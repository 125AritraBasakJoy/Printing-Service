import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { router as printRoutes } from './routes/printRoutes.js';
import { router as driveRoutes } from './routes/driveRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Middlewares
app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'x-pin-code'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'BD Print Bridge Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Print Routes
app.use('/api', printRoutes);

// Google Drive folder import routes
app.use('/api', driveRoutes);

// Serve the built frontend (single-origin deployment, e.g. Render).
// The React build lives in <repo-root>/dist and is gitignored, so the
// hosting platform's build command must run `npm run build` first.
const distDir = path.resolve(__dirname, '../../dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  // SPA fallback: let the client-side router handle /admin, /queue, /print/:code
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
  console.log(`[Static] Serving frontend from ${distDir}`);
} else {
  console.warn(`[Static] No frontend build found at ${distDir} — running in API-only mode.`);
}

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`  BD Print Bridge Backend Server running`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

export default app;
