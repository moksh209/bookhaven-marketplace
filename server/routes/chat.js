import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Start or open existing private conversation for a book listing
router.post('/start', (req, res) => {
  const buyerId = req.headers['x-user-id'] || req.body.buyerId;
  const { bookId } = req.body;

  if (!buyerId) {
    return res.status(401).json({ error: 'You must be logged in to contact the seller.' });
  }

  if (!bookId) {
    return res.status(400).json({ error: 'Book ID is required.' });
  }

  try {
    const conversation = db.getOrCreateConversation({ bookId, buyerId });
    res.json(conversation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all private conversations for authenticated user
router.get('/conversations', (req, res) => {
  const userId = req.headers['x-user-id'] || req.query.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const list = db.getConversationsForUser(userId);
  res.json(list);
});

// Get single private conversation with message history
router.get('/:conversationId', (req, res) => {
  const userId = req.headers['x-user-id'] || req.query.userId;
  const { conversationId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const conv = db.getConversationById(conversationId, userId);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    res.json(conv);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

// Send a private message or payment proof inside conversation
router.post('/:conversationId/message', (req, res) => {
  const senderId = req.headers['x-user-id'] || req.body.senderId;
  const { conversationId } = req.params;
  const { text, attachmentUrl, messageType } = req.body;

  if (!senderId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const sender = db.getUserById(senderId);
  if (!sender) {
    return res.status(404).json({ error: 'Sender user not found.' });
  }

  try {
    const msg = db.createMessage({
      conversationId,
      senderId: sender.id,
      senderName: sender.name,
      text,
      attachmentUrl,
      messageType: messageType || 'text'
    });
    res.status(201).json(msg);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

export default router;
