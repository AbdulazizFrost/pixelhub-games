import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRoutes from './routes/authRoutes';
import gameRoutes from './routes/gameRoutes';
import interactionRoutes from './routes/interactionRoutes';
import adminRoutes from './routes/adminRoutes';
import prisma from './utils/db';

const app = express();
const PORT = process.env.PORT || 5000;

// Diagnostic logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  const oldJson = res.json;
  res.json = function(data) {
    if (res.statusCode >= 400) {
      console.log(`[Response Error ${res.statusCode}]`, JSON.stringify(data));
    }
    return oldJson.apply(this, arguments as any);
  };
  next();
});

// Enable CORS
app.use(cors({
  origin: '*', // For development. Change to CLIENT_URL in production.
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
// When compiled, rootDir is src/ and outDir is dist/.
// The uploads folder is in the parent backend root (public/uploads/).
// Let's resolve the path relative to the current file to make it work in dev (ts-node) and prod (node dist/app.js).
const uploadsPath = path.resolve(process.cwd(), 'public/uploads');
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Add compression headers
    if (filePath.endsWith('.gz')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
    if (filePath.endsWith('.br')) {
      res.setHeader('Content-Encoding', 'br');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }

    // Set correct Content-Type for WebGL/HTML5 files
    if (filePath.endsWith('.wasm') || filePath.endsWith('.wasm.gz') || filePath.endsWith('.wasm.br')) {
      res.setHeader('Content-Type', 'application/wasm');
    } else if (filePath.endsWith('.js') || filePath.endsWith('.js.gz') || filePath.endsWith('.js.br')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.data') || filePath.endsWith('.data.gz') || filePath.endsWith('.data.br')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }

    // SharedArrayBuffer requirement headers for Unity WebGL in chrome/firefox
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  }
}));

// Route Middlewares
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/admin', adminRoutes);

// Basic health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', time: new Date() });
  } catch (err: any) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error occurred in Express:', err);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'Размер загружаемого файла слишком велик. Максимальный разрешенный размер — 2 ГБ (2000 МБ).'
    });
  }

  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
export default app;
