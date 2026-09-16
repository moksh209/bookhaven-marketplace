import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// List books with search & filters (Public)
router.get('/', (req, res) => {
  const { search, category, condition, college, sort, sellerId, includeSold, minPrice, maxPrice } = req.query;
  const products = db.getProducts({ 
    search, 
    category, 
    condition, 
    college, 
    sort, 
    sellerId, 
    includeSold: includeSold === 'true',
    minPrice,
    maxPrice
  });
  res.json(products);
});

// Products listed by a specific seller
router.get('/seller/:sellerId', (req, res) => {
  const { sellerId } = req.params;
  const includeSold = req.query.includeSold === 'true';
  const products = db.getProducts({ sellerId, includeSold: true });
  res.json(products);
});

// Single book details (Public)
router.get('/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Book listing not found' });
  }
  res.json(product);
});

// Create Book Listing (Authenticated User Only)
router.post('/', (req, res) => {
  const sellerId = req.headers['x-user-id'] || req.body.sellerId;
  if (!sellerId) {
    return res.status(401).json({ error: 'You must be registered and logged in to sell a book.' });
  }

  const seller = db.getUserById(sellerId);
  if (!seller) {
    return res.status(404).json({ error: 'Seller account not found.' });
  }

  const {
    title,
    author,
    category,
    condition,
    price,
    originalPrice,
    quantity,
    description,
    imageUrl,
    additionalImages,
    college
  } = req.body;

  if (!title || !author || !category || price === undefined || price === null || price === '') {
    return res.status(400).json({ error: 'Title, author, category, and selling price are required.' });
  }

  if (Number(price) < 0) {
    return res.status(400).json({ error: 'Selling price cannot be negative.' });
  }

  try {
    const newProduct = db.createProduct({
      title,
      author,
      category,
      condition: condition || 'Good',
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      quantity: parseInt(quantity || 1, 10),
      description,
      imageUrl,
      additionalImages: Array.isArray(additionalImages) ? additionalImages : [],
      college: college || seller.college || 'Campus'
    }, seller);

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit Book Listing (Owner Only)
router.put('/:id', (req, res) => {
  const sellerId = req.headers['x-user-id'] || req.body.sellerId;
  const { id } = req.params;

  if (!sellerId) {
    return res.status(401).json({ error: 'Authentication required to edit listing.' });
  }

  try {
    const updated = db.updateProduct(id, req.body, sellerId);
    if (!updated) {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    res.json(updated);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

// Mark Book As Sold (Owner Only)
router.patch('/:id/sold', (req, res) => {
  const sellerId = req.headers['x-user-id'] || req.body.sellerId;
  const { id } = req.params;

  if (!sellerId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const updated = db.markProductSold(id, sellerId);
    if (!updated) {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    res.json({ message: 'Book marked as sold.', product: updated });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

// Delete Book Listing (Owner Only)
router.delete('/:id', (req, res) => {
  const sellerId = req.headers['x-user-id'] || req.body.sellerId;
  const { id } = req.params;

  if (!sellerId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const deleted = db.deleteProduct(id, sellerId);
    if (!deleted) {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    res.json({ message: 'Listing successfully deleted.' });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

export default router;
