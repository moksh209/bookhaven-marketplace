import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import categoriesRoutes from './routes/categories.js';
import uploadRoutes from './routes/upload.js';
import chatRoutes from './routes/chat.js';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Production & Local CORS Configuration
const clientOrigin = process.env.CLIENT_ORIGIN;
if (clientOrigin) {
  const allowedOrigins = clientOrigin.split(',').map(o => o.trim());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive fallback to allow mobile tunnels
      }
    },
    credentials: true
  }));
} else {
  app.use(cors());
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploads if directory exists locally
const uploadsDir = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static(uploadsDir));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

// Database reset endpoint for testing
app.post('/api/reset', (req, res) => {
  db.resetDb();
  res.json({ message: 'Database reset to initial sample seed successfully.' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    env: process.env.VERCEL ? 'vercel-serverless' : 'standard'
  });
});

// Serve frontend dist assets if built (for monolithic deployments e.g. Docker / Render)
const clientDist = path.join(__dirname, '..', 'dist');
if (fs.existsSync(clientDist) && !process.env.VERCEL) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start listener only when run directly as standalone server (not on Vercel / serverless or imported)
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

if (isMain && !isServerless) {
  app.listen(PORT, HOST, () => {
    console.log(`===========================================`);
    console.log(`  BookHaven Full-Stack Server running`);
    console.log(`  Local Address:  http://localhost:${PORT}`);
    console.log(`  Host Binding:   http://${HOST}:${PORT}`);
    console.log(`  Health API:     http://localhost:${PORT}/api/health`);
    console.log(`===========================================`);
  });
}

export default app;
