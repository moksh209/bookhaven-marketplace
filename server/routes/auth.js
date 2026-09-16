import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Generate Anti-Bot Math Challenge
router.get('/captcha-challenge', (req, res) => {
  const num1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
  const num2 = Math.floor(Math.random() * 8) + 1; // 1 to 8
  const answer = num1 + num2;
  const token = Buffer.from(JSON.stringify({ a: answer, exp: Date.now() + 10 * 60 * 1000 })).toString('base64');

  res.json({
    question: `What is ${num1} + ${num2}?`,
    captchaToken: token
  });
});

// Real User Registration (Anti-Bot Protected)
router.post('/signup', (req, res) => {
  const { name, email, password, college, phone, captchaToken, captchaAnswer } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  // Verify anti-bot captcha challenge
  if (!captchaToken || captchaAnswer === undefined || captchaAnswer === null || String(captchaAnswer).trim() === '') {
    return res.status(400).json({ error: 'Please answer the anti-bot verification question.' });
  }

  try {
    const decoded = JSON.parse(Buffer.from(captchaToken, 'base64').toString('utf-8'));
    if (Date.now() > decoded.exp) {
      return res.status(400).json({ error: 'Anti-bot verification expired. Please refresh and try again.' });
    }
    if (parseInt(captchaAnswer, 10) !== decoded.a) {
      return res.status(400).json({ error: 'Incorrect answer to the anti-bot verification question. Please try again.' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid anti-bot verification token.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  }

  const user = db.createUser({
    name,
    email,
    password,
    college: college || 'University Campus',
    phone: phone || '',
    bio: 'Student & book lover.'
  });

  const { password: _, paymentQrUrl, ...userSafe } = user;
  res.status(201).json({ 
    user: { ...userSafe, hasQrCode: Boolean(user.paymentQrUrl) }, 
    token: `token-${user.id}` 
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const { password: _, paymentQrUrl, ...userSafe } = user;
  res.json({ 
    user: { ...userSafe, hasQrCode: Boolean(user.paymentQrUrl) }, 
    token: `token-${user.id}` 
  });
});

// Forgot password
router.post('/forgot-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'No registered account found with this email address.' });
  }

  if (newPassword) {
    db.updateUser(user.id, { password: newPassword });
    return res.json({ message: 'Password has been successfully updated! You can now log in.' });
  }

  res.json({ message: 'Verification successful. Enter your new password.', userFound: true });
});

// Get Current User Profile (Private, authenticated)
router.get('/me', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password: _, ...userSafe } = user;
  res.json({
    ...userSafe,
    hasQrCode: Boolean(user.paymentQrUrl)
  });
});

// Update Profile
router.put('/profile', (req, res) => {
  const userId = req.headers['x-user-id'] || req.body.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { name, college, location, phone, bio } = req.body;
  const updated = db.updateUser(userId, {
    ...(name && { name: name.trim() }),
    ...(college && { college: college.trim() }),
    ...(location && { location: location.trim() }),
    ...(phone !== undefined && { phone: phone.trim() }),
    ...(bio !== undefined && { bio: bio.trim() })
  });

  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password: _, ...userSafe } = updated;
  res.json({
    ...userSafe,
    hasQrCode: Boolean(updated.paymentQrUrl)
  });
});

// Update Seller Payment Settings (Private Payment QR Code & UPI)
router.put('/payment-settings', (req, res) => {
  const userId = req.headers['x-user-id'] || req.body.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { paymentQrUrl, upiId, paymentInstructions } = req.body;
  const result = db.updatePaymentSettings(userId, { paymentQrUrl, upiId, paymentInstructions });

  if (!result) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    message: 'Private payment settings saved securely.',
    hasQrCode: Boolean(result.paymentQrUrl),
    upiId: result.upiId,
    paymentInstructions: result.paymentInstructions
  });
});

// SECURE ACCESS: Get Seller's Private Payment QR
// ACCESSIBLE ONLY by authorized buyers involved in an active order/conversation with this seller!
router.get('/seller-payment-info/:sellerId', (req, res) => {
  const requestingUserId = req.headers['x-user-id'];
  const { sellerId } = req.params;

  if (!requestingUserId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // The seller themselves can always view their own payment info
  if (requestingUserId === sellerId) {
    const info = db.getSellerPrivatePaymentInfo(sellerId);
    return res.json(info);
  }

  // Check authorization: Requesting user MUST have an active order or conversation with this seller
  const conversations = db.getConversationsForUser(requestingUserId);
  const isAuthorized = conversations.some(c => 
    (c.buyerId === requestingUserId && c.sellerId === sellerId) ||
    (c.sellerId === requestingUserId && c.buyerId === sellerId)
  );

  if (!isAuthorized) {
    return res.status(403).json({ 
      error: 'Access Denied: The seller’s payment QR code is private and can only be viewed by buyers with an active purchase or inquiry.' 
    });
  }

  const paymentInfo = db.getSellerPrivatePaymentInfo(sellerId);
  if (!paymentInfo) {
    return res.status(404).json({ error: 'Seller payment information not found.' });
  }

  res.json(paymentInfo);
});

export default router;
