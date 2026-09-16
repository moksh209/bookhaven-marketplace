import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const categories = db.getCategories();
  res.json(categories);
});

export default router;
