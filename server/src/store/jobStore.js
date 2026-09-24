/**
 * Persistent JSON-file-backed job store.
 * Replaces the previous in-memory Map that lost every print job on restart.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const storeFile = path.join(dataDir, 'jobs.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const jobsStore = new Map();

// ---- Load persisted jobs on boot ----
try {
  if (fs.existsSync(storeFile)) {
    const raw = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
    for (const job of raw) {
      // Drop jobs whose physical file is gone (e.g. wiped/expired while down)
      jobsStore.set(job.id, job);
    }
    console.log(`[JobStore] Restored ${jobsStore.size} job(s) from ${storeFile}`);
  }
} catch (err) {
  console.error('[JobStore] Failed to load persisted jobs:', err.message);
}

let saveTimer = null;
function persist() {
  // Debounced write so bursts of mutations don't hammer the disk
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(storeFile, JSON.stringify(Array.from(jobsStore.values()), null, 2));
    } catch (err) {
      console.error('[JobStore] Failed to persist jobs:', err.message);
    }
  }, 150);
}

export const store = {
  get(id) {
    return jobsStore.get(id);
  },
  set(id, job) {
    jobsStore.set(id, job);
    persist();
  },
  delete(id) {
    jobsStore.delete(id);
    persist();
  },
  entries() {
    return jobsStore.entries();
  },
  values() {
    return jobsStore.values();
  },
  get size() {
    return jobsStore.size;
  },
};
