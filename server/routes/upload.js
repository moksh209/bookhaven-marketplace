import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { isSupabaseConfigured, uploadToSupabaseStorage } from '../supabase.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Use in-memory storage so uploads work seamlessly in serverless (Vercel) & cloud storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are permitted'));
    }
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(req.file.originalname) || '.jpg';
  const filename = `book-${uniqueSuffix}${ext}`;

  // 1. Prioritize Supabase Storage (Production Cloud Storage)
  if (isSupabaseConfigured()) {
    try {
      const result = await uploadToSupabaseStorage({
        buffer: req.file.buffer,
        filename,
        mimeType: req.file.mimetype
      });
      console.log(`[Storage] Uploaded to Supabase Storage: ${result.publicUrl}`);
      return res.json({
        imageUrl: result.publicUrl,
        filename,
        storage: 'supabase'
      });
    } catch (err) {
      console.error('[Storage] Supabase upload failed, trying fallback...', err.message);
    }
  }

  // 2. Local File System Fallback (if writable)
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    const localFilePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(localFilePath, req.file.buffer);
    return res.json({
      imageUrl: `/uploads/${filename}`,
      filename,
      storage: 'local'
    });
  } catch (fsErr) {
    // 3. Resilient Read-Only Fallback for Vercel without Supabase keys: Base64 Data URL
    console.warn('[Storage] Local filesystem is read-only. Fallback to Data URL.');
    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    return res.json({
      imageUrl: base64Data,
      filename,
      storage: 'inline'
    });
  }
});

export default router;
