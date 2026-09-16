import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Buyer marks intent to pay (Payment Pending)
router.post('/start-payment', (req, res) => {
  const buyerId = req.headers['x-user-id'] || req.body.buyerId;
  const { orderId } = req.body;

  if (!buyerId || !orderId) {
    return res.status(400).json({ error: 'Order ID and Buyer ID are required.' });
  }

  try {
    const order = db.startOrderPayment(orderId, buyerId);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Buyer submits manual online payment proof (screenshot and/or UTR / Ref ID)
router.post('/submit-payment', (req, res) => {
  const buyerId = req.headers['x-user-id'] || req.body.buyerId;
  const { orderId, paymentReferenceId, paymentProofUrl, note } = req.body;

  if (!buyerId || !orderId) {
    return res.status(400).json({ error: 'Order ID and Buyer ID are required.' });
  }

  if (!paymentReferenceId && !paymentProofUrl) {
    return res.status(400).json({ error: 'Please provide either a Transaction/Reference ID or upload a payment screenshot.' });
  }

  try {
    const order = db.submitPaymentProof(orderId, buyerId, {
      paymentReferenceId,
      paymentProofUrl,
      note
    });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Seller manually verifies and confirms payment
router.post('/:orderId/confirm-payment', (req, res) => {
  const sellerId = req.headers['x-user-id'] || req.body.sellerId;
  const { orderId } = req.params;

  if (!sellerId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const order = db.confirmPayment(orderId, sellerId);
    res.json({
      message: 'Payment verified and confirmed by seller.',
      order
    });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

// Update order fulfillment status (Ready for Delivery, Delivered, Cancelled)
router.patch('/:orderId/status', (req, res) => {
  const userId = req.headers['x-user-id'] || req.body.userId;
  const { orderId } = req.params;
  const { status } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const order = db.updateOrderStatus(orderId, status, userId);
    res.json(order);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

// Buyer purchases list
router.get('/buyer/:buyerId', (req, res) => {
  const userId = req.headers['x-user-id'];
  const { buyerId } = req.params;

  if (userId && userId !== buyerId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const orders = db.getOrdersByBuyer(buyerId);
  res.json(orders);
});

// Seller sales list
router.get('/seller/:sellerId', (req, res) => {
  const userId = req.headers['x-user-id'];
  const { sellerId } = req.params;

  if (userId && userId !== sellerId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const orders = db.getOrdersBySeller(sellerId);
  res.json(orders);
});

// Get single order
router.get('/:orderId', (req, res) => {
  const userId = req.headers['x-user-id'];
  const { orderId } = req.params;

  try {
    const order = db.getOrderById(orderId, userId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

export default router;
