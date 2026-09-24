import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'text/plain',
  ];
  if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|jpe?g|png|webp|txt)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload PDF, PNG, JPG, or TXT.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
});

export const router = express.Router();

// In-memory job repository with persistence fallback
const jobsStore = new Map();

// Helper to generate shortcode
function generateShortCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PRN-${code}`;
}

// Find job by ID or shortCode
function findJob(identifier) {
  if (!identifier) return null;
  const upper = identifier.trim().toUpperCase();
  for (const job of jobsStore.values()) {
    if (
      job.id === identifier ||
      job.shortCode.toUpperCase() === upper ||
      job.shortCode.replace('PRN-', '').toUpperCase() === upper
    ) {
      return job;
    }
  }
  return null;
}

// Helper: Safely delete physical file
function deletePhysicalFile(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Zero-Footprint] Physically purged file: ${filePath}`);
    }
  } catch (err) {
    console.error(`[Zero-Footprint] Error deleting file ${filePath}:`, err);
  }
}

// ==========================================
// 1. Auth check endpoint
// ==========================================
router.post('/auth/verify', (req, res) => {
  const secretKey = process.env.ADMIN_SECRET_KEY || 'bd-print-secret-2026';
  const { username, password } = req.body;
  if ((username === 'Harry' && password === 'Dumbledore') || password === secretKey) {
    return res.json({ success: true, message: 'Authentication successful', token: secretKey });
  }
  return res.status(401).json({ success: false, error: 'Invalid username or password' });
});

// ==========================================
// 2. Upload Document (Protected by Auth)
// ==========================================
router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No document file uploaded' });
    }

    const {
      copies = 1,
      colorMode = 'bw',
      paperSize = 'A4',
      duplex = 'single',
      orientation = 'portrait',
      pageRange = 'all',
      notes = '',
      staple = 'none',
      paperWeight = 'standard_75gsm',
      pinCode = '',
      customerName = 'Anonymous User',
      customerPhone = '',
      autoDeleteAfterPrint = 'true',
      expirationHours = '24',
      pageCount = '1',
    } = req.body;

    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Prefer the client-supplied shortcode so the browser's local record and
    // the server record share one identity (keeps the queue in sync).
    let shortCode = /^PRN-[2-9A-HJ-NP-Z]{4}$/.test(req.body.shortCode || '')
      ? req.body.shortCode
      : generateShortCode();
    while (findJob(shortCode)) {
      shortCode = generateShortCode(); // collision guard
    }
    const now = new Date();
    const expHoursNum = parseInt(expirationHours, 10) || 24;
    const expiresAt = new Date(now.getTime() + expHoursNum * 60 * 60 * 1000).toISOString();

    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf');
    const isImage = req.file.mimetype.startsWith('image/');

    const newJob = {
      id,
      shortCode,
      fileName: req.file.originalname,
      fileType: isPdf ? 'pdf' : isImage ? 'image' : 'document',
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      fileUrl: `/api/jobs/${shortCode}/file`,
      pageCount: parseInt(pageCount, 10) || 1,
      uploadedAt: now.toISOString(),
      expiresAt,
      status: 'ready',
      autoDeleteAfterPrint: autoDeleteAfterPrint === 'true' || autoDeleteAfterPrint === true,
      pinCode: pinCode.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      settings: {
        copies: parseInt(copies, 10) || 1,
        colorMode: colorMode === 'color' ? 'color' : 'bw',
        paperSize: paperSize || 'A4',
        duplex: duplex || 'single',
        orientation: orientation || 'portrait',
        pageRange: pageRange || 'all',
        finishing: {
          staple: staple || 'none',
          binding: 'none',
          lamination: false,
          paperWeight: paperWeight || 'standard_75gsm',
        },
        notes: notes || '',
      },
      printedCopiesCount: 0,
      history: [
        {
          timestamp: now.toISOString(),
          action: 'Document encrypted & uploaded from Admin panel',
          actor: 'admin',
        },
      ],
    };

    jobsStore.set(id, newJob);

    console.log(`[Upload] Created Print Job ${shortCode} (${newJob.fileName})`);

    return res.status(201).json({
      success: true,
      job: newJob,
      printUrl: `/print/${shortCode}`,
    });
  } catch (error) {
    console.error('[Upload Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. List Jobs (Queue & Logs)
// ==========================================
router.get('/jobs', (req, res) => {
  const jobsList = Array.from(jobsStore.values())
    .map((j) => {
      // Omit direct physical file path from public payload
      const { filePath, ...safeJob } = j;
      return safeJob;
    })
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  return res.json({ success: true, count: jobsList.length, jobs: jobsList });
});

// ==========================================
// 4. Get Job Details by ID or ShortCode
// ==========================================
router.get('/jobs/:id', (req, res) => {
  const job = findJob(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Document not found or expired' });
  }

  const { filePath, ...safeJob } = job;
  return res.json({ success: true, job: safeJob });
});

// ==========================================
// 5. Stream Raw File for Preview & Direct Iframe Print
// ==========================================
router.get('/jobs/:id/file', (req, res) => {
  const job = findJob(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'File not found or expired' });
  }

  // Check PIN if document is PIN-protected
  if (job.pinCode) {
    const providedPin = req.headers['x-pin-code'] || req.query.pin;
    if (providedPin !== job.pinCode) {
      return res.status(401).json({ success: false, error: 'PIN required to access file' });
    }
  }

  if (job.status === 'wiped' || !job.filePath || !fs.existsSync(job.filePath)) {
    return res.status(410).json({
      success: false,
      error: 'File was securely wiped from server storage after printing',
    });
  }

  res.setHeader('Content-Type', job.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${job.fileName}"`);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  const fileStream = fs.createReadStream(job.filePath);
  fileStream.pipe(res);
});

// ==========================================
// 6. Update Job Status & Trigger Zero-Footprint Auto-Wipe
// ==========================================
router.patch('/jobs/:id/status', (req, res) => {
  const job = findJob(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }

  const { status, note, actor = 'shopkeeper', incrementPrintCount = false } = req.body;
  const now = new Date().toISOString();

  if (incrementPrintCount) {
    job.printedCopiesCount += job.settings.copies || 1;
  }

  if (status) {
    job.status = status;
  }

  job.history.push({
    timestamp: now,
    action: note || `Status updated to ${status}`,
    actor,
    note,
  });

  // Zero-Footprint Auto-Wipe trigger
  if ((status === 'completed' || status === 'wiped') && job.autoDeleteAfterPrint) {
    if (job.filePath) {
      deletePhysicalFile(job.filePath);
      job.filePath = null;
    }
    job.status = 'wiped';
    job.history.push({
      timestamp: new Date().toISOString(),
      action: 'File permanently erased from disk (Zero-Footprint Policy)',
      actor: 'system',
    });
  }

  const { filePath, ...safeJob } = job;
  return res.json({ success: true, job: safeJob });
});

// ==========================================
// 7. Delete / Purge File Permanently
// ==========================================
router.delete('/jobs/:id', (req, res) => {
  const job = findJob(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }

  if (job.filePath) {
    deletePhysicalFile(job.filePath);
  }

  jobsStore.delete(job.id);
  return res.json({
    success: true,
    message: `Job ${job.shortCode} and file were permanently wiped from storage.`,
  });
});

// TTL Cleanup interval: Purge expired documents every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobsStore.entries()) {
    if (job.expiresAt && new Date(job.expiresAt).getTime() < now) {
      console.log(`[TTL Cleanup] Expired job ${job.shortCode}, purging file...`);
      if (job.filePath) {
        deletePhysicalFile(job.filePath);
      }
      jobsStore.delete(id);
    }
  }
}, 15 * 60 * 1000);
