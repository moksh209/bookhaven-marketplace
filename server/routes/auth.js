import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { isSupabaseConfigured, signUpSupabaseUser, signInSupabaseUser, resendSupabaseVerification } from '../supabase.js';

const router = express.Router();

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || 'bookhaven-anti-bot-key-2026';

// Cache for single-use tokens to prevent replay attacks online
const usedCaptchaSignatures = new Set();
setInterval(() => {
  if (usedCaptchaSignatures.size > 5000) {
    usedCaptchaSignatures.clear();
  }
}, 15 * 60 * 1000).unref();

// In-memory rate limiting map for email verification & sign-up attempts
// Tracks: email -> { count: number, firstAttemptAt: number, lastAttemptAt: number }
const verificationRateLimits = new Map();

// Periodic cleanup of rate limiting entries older than 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of verificationRateLimits.entries()) {
    if (now - record.firstAttemptAt > 15 * 60 * 1000) {
      verificationRateLimits.delete(email);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Checks and updates rate limits for a given email address
 * Policy:
 * 1. Cooldown: Minimum 60 seconds between resends/requests
 * 2. Max: Maximum 3 attempts per 15-minute rolling window
 */
function checkVerificationRateLimit(email) {
  const cleanEmail = email.toLowerCase().trim();
  const now = Date.now();
  const record = verificationRateLimits.get(cleanEmail);

  if (!record) {
    verificationRateLimits.set(cleanEmail, {
      count: 1,
      firstAttemptAt: now,
      lastAttemptAt: now
    });
    return { allowed: true, retryAfterSeconds: 60 };
  }

  // Check 15-minute rolling window reset
  if (now - record.firstAttemptAt > 15 * 60 * 1000) {
    verificationRateLimits.set(cleanEmail, {
      count: 1,
      firstAttemptAt: now,
      lastAttemptAt: now
    });
    return { allowed: true, retryAfterSeconds: 60 };
  }

  // Check 60-second cooldown between consecutive requests
  const timeSinceLast = now - record.lastAttemptAt;
  if (timeSinceLast < 60 * 1000) {
    const retryAfter = Math.ceil((60 * 1000 - timeSinceLast) / 1000);
    return {
      allowed: false,
      reason: 'cooldown',
      retryAfterSeconds: retryAfter,
      message: `Please wait ${retryAfter}s before requesting another verification email.`
    };
  }

  // Check max limit (3 attempts per 15-minute window)
  if (record.count >= 3) {
    const windowRemaining = Math.ceil((15 * 60 * 1000 - (now - record.firstAttemptAt)) / 1000);
    return {
      allowed: false,
      reason: 'max_attempts',
      retryAfterSeconds: windowRemaining,
      message: `Too many verification requests for this email. Please wait ${Math.ceil(windowRemaining / 60)} minutes before trying again.`
    };
  }

  // Increment counter and update lastAttemptAt
  record.count += 1;
  record.lastAttemptAt = now;
  return { allowed: true, retryAfterSeconds: 60 };
}

/**
 * Validates captcha answer and HMAC token
 */
function verifyCaptchaChallenge(captchaToken, captchaAnswer) {
  if (!captchaToken || captchaAnswer === undefined || captchaAnswer === null || String(captchaAnswer).trim() === '') {
    return { valid: false, error: 'Please answer the anti-bot verification question.' };
  }

  try {
    const decoded = JSON.parse(Buffer.from(captchaToken, 'base64').toString('utf-8'));
    
    // Check expiry
    if (Date.now() > decoded.exp) {
      return { valid: false, error: 'Anti-bot verification expired. Please refresh and try again.' };
    }

    // Replay attack prevention: check if signature already used
    if (decoded.sig) {
      if (usedCaptchaSignatures.has(decoded.sig)) {
        return { valid: false, error: 'Anti-bot verification already used. Please refresh the question.' };
      }

      // Verify HMAC signature
      const expectedSig = crypto
        .createHmac('sha256', CAPTCHA_SECRET)
        .update(`${decoded.a}:${decoded.exp}`)
        .digest('hex');

      if (decoded.sig !== expectedSig) {
        return { valid: false, error: 'Invalid anti-bot verification token.' };
      }
    }

    // Verify mathematical answer
    if (parseInt(captchaAnswer, 10) !== decoded.a) {
      return { valid: false, error: 'Incorrect answer to the anti-bot verification question. Please try again.' };
    }

    // Mark as consumed
    if (decoded.sig) {
      usedCaptchaSignatures.add(decoded.sig);
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: 'Invalid anti-bot verification challenge format.' };
  }
}

// ----------------------------------------------------------------------
// 1. Generate Anti-Bot Math Challenge (Protected with HMAC for Online Usage)
// ----------------------------------------------------------------------
router.get('/captcha-challenge', (req, res) => {
  const num1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
  const num2 = Math.floor(Math.random() * 8) + 1; // 1 to 8
  const answer = num1 + num2;
  const exp = Date.now() + 10 * 60 * 1000; // 10 minutes

  const sig = crypto
    .createHmac('sha256', CAPTCHA_SECRET)
    .update(`${answer}:${exp}`)
    .digest('hex');

  const token = Buffer.from(JSON.stringify({ a: answer, exp, sig })).toString('base64');

  res.json({
    question: `What is ${num1} + ${num2}?`,
    captchaToken: token
  });
});

// ----------------------------------------------------------------------
// 2. Real User Registration (Anti-Bot Protected + Rate Limited Edge Cases + Supabase ID)
// ----------------------------------------------------------------------
router.post('/signup', async (req, res) => {
  const { name, email, password, college, phone, captchaToken, captchaAnswer } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email).trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  // Password strength validation
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  // Verify anti-bot captcha challenge
  const captchaCheck = verifyCaptchaChallenge(captchaToken, captchaAnswer);
  if (!captchaCheck.valid) {
    return res.status(400).json({ error: captchaCheck.error });
  }

  // Check email verification rate limit / signup attempts
  const rateLimitCheck = checkVerificationRateLimit(email);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      error: rateLimitCheck.message,
      retryAfter: rateLimitCheck.retryAfterSeconds
    });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  }

  let supabaseId = null;

  // Integrate Supabase Auth & ID system if configured
  if (isSupabaseConfigured()) {
    try {
      const supaData = await signUpSupabaseUser({
        email,
        password,
        name,
        college,
        phone
      });
      if (supaData?.user?.id) {
        supabaseId = supaData.user.id;
        console.log(`[Auth] Registered Supabase Auth ID: ${supabaseId}`);
      }
    } catch (supaErr) {
      console.warn('[Auth] Supabase signup error:', supaErr.message);
      if (supaErr.message && supaErr.message.toLowerCase().includes('already registered')) {
        return res.status(409).json({ error: 'An account with this email is already registered in Supabase. Please log in.' });
      }
    }
  }

  // Create user in local/serverless store with canonical ID
  const newId = supabaseId || (crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
  const user = db.createUser({
    id: newId,
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
    token: `token-${user.id}`,
    message: 'Account created successfully!'
  });
});

// ----------------------------------------------------------------------
// 3. User Login (Anti-Bot Captcha Protected for Online Usage)
// ----------------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password, captchaToken, captchaAnswer } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Enforce Anti-Bot Captcha if provided or in production online environments
  if (captchaToken || process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    if (captchaToken) {
      const captchaCheck = verifyCaptchaChallenge(captchaToken, captchaAnswer);
      if (!captchaCheck.valid) {
        return res.status(400).json({ error: captchaCheck.error });
      }
    } else {
      // In production online usage, captcha is required
      return res.status(400).json({ error: 'Please answer the anti-bot verification question to log in.' });
    }
  }

  // If Supabase is connected, optionally authenticate with Supabase
  if (isSupabaseConfigured()) {
    try {
      await signInSupabaseUser({ email, password });
    } catch (supaErr) {
      if (supaErr.message && supaErr.message.toLowerCase().includes('email not confirmed')) {
        return res.status(403).json({
          error: 'Your student email is not yet confirmed. Please verify your email before logging in.',
          needsEmailVerification: true,
          email
        });
      }
    }
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

// ----------------------------------------------------------------------
// 4. Resend Verification Email (Rate-Limited Edge Case)
// ----------------------------------------------------------------------
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const rateLimitCheck = checkVerificationRateLimit(email);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      error: rateLimitCheck.message,
      retryAfter: rateLimitCheck.retryAfterSeconds
    });
  }

  if (isSupabaseConfigured()) {
    try {
      await resendSupabaseVerification(email);
    } catch (supaErr) {
      console.warn('[Auth] Resend error:', supaErr.message);
    }
  }

  res.json({
    message: `Verification instructions resent to ${email}. Please check your inbox.`,
    nextAllowedInSeconds: 60
  });
});

// ----------------------------------------------------------------------
// 5. Forgot Password
// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// 6. Current User Profile (Private, authenticated)
// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// 7. Update Profile
// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// 8. Update Seller Payment Settings (Private Payment QR Code & UPI)
// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// 9. SECURE ACCESS: Get Seller's Private Payment QR
// ----------------------------------------------------------------------
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
