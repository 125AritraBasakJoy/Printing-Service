/**
 * Google Drive public folder import routes.
 *
 * Lets an admin paste a shared Google Drive folder link; the server
 * recursively lists every file in the folder, downloads them into the
 * uploads directory, and registers each one as a print job so it shows
 * up in the queue UI and on /print/:code pages.
 *
 * Works for folders shared as "Anyone with the link" by scraping the
 * embedded _DRIVE_ivd metadata from the folder's HTML page (no API key
 * or OAuth needed for public folders).
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { store as jobsStore } from '../store/jobStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const router = express.Router();

// ---------- helpers ----------

function generateShortCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PRN-${code}`;
}

function findJobBy(predicate) {
  for (const job of jobsStore.values()) {
    if (predicate(job)) return job;
  }
  return null;
}

/** Extract a Drive folder id from any common Drive URL shape. */
function extractFolderId(url) {
  if (!url || typeof url !== 'string') return null;
  const patterns = [
    /drive\.google\.com\/drive\/(?:folders\/|u\/\d+\/folders\/)([A-Za-z0-9_-]{20,})/,
    /drive\.google\.com\/\?[^#]*(?:id=|folderId=)([A-Za-z0-9_-]{20,})/,
    /^([A-Za-z0-9_-]{25,})$/, // bare folder id
  ];
  for (const re of patterns) {
    const m = url.trim().match(re);
    if (m) return m[1];
  }
  return null;
}

/** Fetch a Drive folder page and parse its embedded file listing. */
async function listDriveFolder(folderId) {
  const res = await fetch(
    `https://drive.google.com/drive/folders/${folderId}`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' } }
  );
  if (!res.ok) {
    throw new Error(`Google Drive returned HTTP ${res.status}. Make sure the folder is shared as "Anyone with the link".`);
  }
  const html = await res.text();

  const m = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'((?:[^'\\]|\\.)*)'/s);
  if (!m) {
    throw new Error('Could not read folder metadata from Google Drive. The folder may be private or empty.');
  }

  // Decode JS escapes (hex \xNN, \' and \") then strip the )]}' XSS-guard prefix
  let data = m[1]
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"');
  data = data.replace(/^\)\]\}'/, '');

  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch {
    throw new Error('Failed to parse Google Drive folder metadata.');
  }

  const entries = parsed[0] || [];
  const items = [];
  for (const item of entries) {
    const [id, , name, mime, size, , , , , , modifiedMs] = item;
    items.push({
      id,
      name,
      mime,
      size: typeof size === 'number' ? size : 0,
      modified: typeof modifiedMs === 'number' ? new Date(modifiedMs).toISOString() : null,
      isFolder: mime === 'application/vnd.google-apps.folder',
    });
  }
  return items;
}

/** Recursively walk a folder, returning flat list of files with paths. */
async function walkDriveFolder(folderId, folderPath = '', depth = 0) {
  if (depth > 10) return []; // safety guard
  const entries = await listDriveFolder(folderId);
  const files = [];
  for (const entry of entries) {
    if (entry.isFolder) {
      const nested = await walkDriveFolder(entry.id, `${folderPath}/${entry.name}`, depth + 1);
      files.push(...nested);
    } else {
      files.push({ ...entry, path: folderPath });
    }
  }
  return files;
}

/** Download a single public Drive file, following the confirm-token flow. */
async function downloadDriveFile(fileId, destPath) {
  const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`Download failed with HTTP ${res.status}`);
  }
  const contentType = res.headers.get('content-type') || '';
  const buffer = Buffer.from(await res.arrayBuffer());

  // If Google returned an HTML page instead of the file, surface a clear error
  if (contentType.includes('text/html') && buffer.length < 200000) {
    const text = buffer.toString('utf8');
    if (text.includes('Google Drive - Virus scan warning') || text.includes('uc-error')) {
      throw new Error('Google Drive blocked the download (virus-scan confirm page).');
    }
    throw new Error('Google Drive returned an HTML page instead of file contents.');
  }

  fs.writeFileSync(destPath, buffer);
  return { size: buffer.length, contentType };
}

function guessMime(fileName, fallback) {
  if (/\.pdf$/i.test(fileName)) return 'application/pdf';
  if (/\.jpe?g$/i.test(fileName)) return 'image/jpeg';
  if (/\.png$/i.test(fileName)) return 'image/png';
  if (/\.webp$/i.test(fileName)) return 'image/webp';
  if (/\.txt$/i.test(fileName)) return 'text/plain';
  return fallback || 'application/octet-stream';
}

/** Count pages of a PDF by scanning for /Type /Page objects (best-effort). */
function countPdfPages(buffer) {
  try {
    const text = buffer.toString('latin1');
    const matches = text.match(/\/Type\s*\/Page[^s]/g);
    if (matches && matches.length > 0) return matches.length;
    const counts = text.match(/\/Count\s+(\d+)/g);
    if (counts && counts.length > 0) {
      const nums = counts.map((c) => parseInt(c.replace(/\D+/g, ''), 10));
      return Math.max(...nums);
    }
  } catch {
    /* ignore */
  }
  return 1;
}

// ---------- routes ----------

/**
 * POST /api/drive/import
 * Body: { url: "https://drive.google.com/drive/folders/...", dryRun?: boolean, ...job defaults }
 * Protected by admin key.
 */
router.post('/drive/import', authMiddleware, async (req, res) => {
  try {
    const folderId = extractFolderId(req.body.url);
    if (!folderId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Google Drive folder URL. Expected something like https://drive.google.com/drive/folders/XXXX',
      });
    }

    const files = await walkDriveFolder(folderId);
    if (files.length === 0) {
      return res.status(404).json({ success: false, error: 'No files found in this Google Drive folder.' });
    }

    // Dry-run: just report what would be imported
    if (req.body.dryRun) {
      return res.json({
        success: true,
        folderId,
        count: files.length,
        files: files.map((f) => ({
          name: f.name,
          path: f.path,
          mime: guessMime(f.name, f.mime),
          driveId: f.id,
        })),
      });
    }

    const {
      copies = 1,
      colorMode = 'bw',
      paperSize = 'A4',
      duplex = 'single',
      orientation = 'portrait',
      customerName = 'Drive Import',
      customerPhone = '',
      pinCode = '',
      autoDeleteAfterPrint = 'false', // keep Drive files until manually deleted
      expirationHours = '168', // 7 days for imported batches
    } = req.body;

    const imported = [];
    const failed = [];

    for (const file of files) {
      // Skip files we already imported from this Drive id (idempotent re-runs)
      const existing = findJobBy((j) => j.driveFileId === file.id);
      if (existing) {
        imported.push({ ...existing, filePath: undefined, alreadyImported: true });
        continue;
      }

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const localName = `drive-${Date.now()}-${Math.round(Math.random() * 1e6)}-${sanitizedName}`;
      const destPath = path.join(uploadsDir, localName);

      try {
        const { size } = await downloadDriveFile(file.id, destPath);
        const buffer = fs.readFileSync(destPath);
        const mimeType = guessMime(file.name, file.mime);

        const isPdf = mimeType === 'application/pdf';
        const isImage = mimeType.startsWith('image/');

        const now = new Date();
        const id = `job_${now.getTime()}_${Math.random().toString(36).substring(2, 7)}`;
        let shortCode = generateShortCode();
        while (findJobBy((j) => j.shortCode === shortCode)) shortCode = generateShortCode();

        const expHours = parseInt(expirationHours, 10) || 168;
        const job = {
          id,
          shortCode,
          fileName: file.name,
          fileType: isPdf ? 'pdf' : isImage ? 'image' : 'document',
          mimeType,
          fileSize: size,
          filePath: destPath,
          fileUrl: `/api/jobs/${shortCode}/file`,
          pageCount: isPdf ? countPdfPages(buffer) : 1,
          uploadedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + expHours * 3600 * 1000).toISOString(),
          status: 'ready',
          autoDeleteAfterPrint: autoDeleteAfterPrint === 'true' || autoDeleteAfterPrint === true,
          pinCode: (pinCode || '').trim(),
          customerName: (customerName || '').trim(),
          customerPhone: (customerPhone || '').trim(),
          driveFileId: file.id,
          drivePath: file.path || '',
          settings: {
            copies: parseInt(copies, 10) || 1,
            colorMode: colorMode === 'color' ? 'color' : 'bw',
            paperSize: paperSize || 'A4',
            duplex: duplex || 'single',
            orientation: orientation || 'portrait',
            pageRange: 'all',
            finishing: { staple: 'none', binding: 'none', lamination: false, paperWeight: 'standard_75gsm' },
            notes: `Imported from Google Drive${file.path ? ` (${file.path.replace(/^\//, '')})` : ''}`,
          },
          printedCopiesCount: 0,
          history: [
            {
              timestamp: now.toISOString(),
              action: 'Imported from Google Drive folder',
              actor: 'admin',
            },
          ],
        };

        jobsStore.set(id, job);
        console.log(`[Drive Import] ${file.name} -> ${shortCode} (${(size / 1024).toFixed(0)} KB)`);
        const { filePath, ...safe } = job;
        imported.push(safe);
      } catch (err) {
        console.error(`[Drive Import] Failed ${file.name}:`, err.message);
        failed.push({ name: file.name, error: err.message });
      }
    }

    return res.json({
      success: true,
      folderId,
      importedCount: imported.length,
      failedCount: failed.length,
      imported,
      failed,
    });
  } catch (error) {
    console.error('[Drive Import Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});
