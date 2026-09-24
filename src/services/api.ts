import { PrintJob, JobStatus, PrintSettings, PricingBreakdown } from '../types/print';
import { calculatePrintPricing } from './pricingService';

export const BACKEND_URL =
  import.meta.env.VITE_API_URL || 'https://printing-service-vv0a.onrender.com';

const STORAGE_KEY = 'private_print_bridge_jobs_v3';
const AUTH_KEY = 'private_print_bridge_admin_auth';
const DEFAULT_ADMIN_PASSWORD = 'admin';
const ADMIN_SECRET = 'bd-print-secret-2026';

function generateShortCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PRN-${code}`;
}

export function generateId(): string {
  return 'doc_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

let memoryJobsCache: PrintJob[] = [];

function safeSaveJobs(jobs: PrintJob[]) {
  memoryJobsCache = jobs;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (err) {
    console.warn('[Storage] Quota exceeded for localStorage, keeping full job objects in memory cache:', err);
    try {
      // Strip huge data URLs from older jobs to fit essential metadata into localStorage
      const leanJobs = jobs.map((j, index) => {
        if (index > 0 && j.fileDataUrl && j.fileDataUrl.length > 50000) {
          return { ...j, fileDataUrl: '' };
        }
        return j;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leanJobs));
    } catch {
      // Even lean jobs fail, keep in memory
    }
  }
}

// Hydrate a backend job record into the full frontend PrintJob shape.
// The server omits client-only fields (pricing, preview pages, data URLs).
function hydrateRemoteJob(remoteJob: any): PrintJob {
  const fileUrl = `${BACKEND_URL}${remoteJob.fileUrl}`;
  const settings: PrintSettings = {
    copies: 1,
    colorMode: 'bw',
    paperSize: 'A4',
    duplex: 'single',
    orientation: 'portrait',
    pageRange: 'all',
    finishing: {
      staple: 'none',
      binding: 'none',
      lamination: false,
      paperWeight: 'standard_75gsm',
    },
    notes: '',
    ...(remoteJob.settings || {}),
  };
  return {
    ...remoteJob,
    settings,
    fileDataUrl: fileUrl,
    pages: [
      {
        pageNumber: 1,
        title: remoteJob.fileName,
        previewUrl: fileUrl,
      },
    ],
    pricing: remoteJob.pricing || calculatePrintPricing(remoteJob.pageCount || 1, settings, 'BDT'),
  };
}

export const api = {
  // Authentication
  checkAuth(): boolean {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      return stored === 'true' || stored === 'authenticated';
    } catch {
      return false;
    }
  },

  login(username: string, password: string): boolean {
    if (username.trim() === 'Harry' && password === 'Dumbledore') {
      localStorage.setItem(AUTH_KEY, 'authenticated');
      // Verify with backend if online
      fetch(`${BACKEND_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }).catch(() => {
        // Backend offline, local auth succeeds
      });
      return true;
    }
    return false;
  },

  logout(): void {
    // Clear the in-memory cache so locked-out sessions can't read job data
    memoryJobsCache = [];
    localStorage.removeItem(AUTH_KEY);
  },

  setPassword(newPass: string): void {
    localStorage.setItem('print_bridge_custom_pwd', newPass);
  },

  // Jobs retrieval
  getJobs(): PrintJob[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let parsed: PrintJob[] = raw ? JSON.parse(raw) : [];

      // The memory cache is ONLY a fallback to restore full base64 data URLs
      // for jobs that still exist in persisted storage. It must never
      // resurrect jobs that were deleted or wiped.
      if (memoryJobsCache.length > 0) {
        const memoryMap = new Map(memoryJobsCache.map((j) => [j.id, j]));
        parsed = parsed.map((j) => {
          const mem = memoryMap.get(j.id);
          return mem ? { ...j, fileDataUrl: mem.fileDataUrl || j.fileDataUrl } : j;
        });
      }

      // Drop expired jobs (mirrors the server's TTL cleanup) and legacy seed jobs
      const now = Date.now();
      const cleaned = parsed.filter(
        (j) =>
          j.id !== 'doc_resume_bangladesh_01' &&
          j.id !== 'doc_invoice_sample_02' &&
          j.shortCode !== 'PRN-9482' &&
          j.shortCode !== 'PRN-3820' &&
          !(j.expiresAt && new Date(j.expiresAt).getTime() < now)
      );
      return cleaned;
    } catch (err) {
      console.error('Error fetching jobs:', err);
      return [...memoryJobsCache];
    }
  },

  getJobById(idOrCode: string): PrintJob | null {
    const jobs = this.getJobs();
    const normalized = idOrCode.trim().toUpperCase();
    const found = jobs.find(
      (j) =>
        j.id === idOrCode ||
        j.shortCode.toUpperCase() === normalized ||
        j.shortCode.replace('PRN-', '').toUpperCase() === normalized
    );
    return found || null;
  },

  // Fetch from remote backend when opened on shopkeeper PC
  async fetchJobById(idOrCode: string): Promise<PrintJob | null> {
    const local = this.getJobById(idOrCode);
    if (local && local.fileDataUrl) return local;

    try {
      const res = await fetch(`${BACKEND_URL}/api/jobs/${encodeURIComponent(idOrCode.trim())}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success && data.job) {
        const hydratedJob = hydrateRemoteJob(data.job);
        const currentList = this.getJobs();
        safeSaveJobs([hydratedJob, ...currentList.filter((j) => j.id !== hydratedJob.id)]);
        return hydratedJob;
      }
    } catch (err) {
      console.error('[API] Error fetching remote job from backend:', err);
    }
    return local;
  },

  // Fetch the live job list from the backend (source of truth for the queue).
  // Falls back to local storage when the backend is unreachable.
  async fetchJobs(): Promise<PrintJob[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/jobs`);
      if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
      const data = await res.json();
      if (!data.success || !Array.isArray(data.jobs)) throw new Error('Malformed jobs response');

      const remoteJobs: PrintJob[] = data.jobs.map(hydrateRemoteJob);
      const localJobs = this.getJobs();
      const localByCode = new Map(localJobs.map((j) => [j.shortCode, j]));

      const merged: PrintJob[] = remoteJobs.map((remote) => {
        const local = localByCode.get(remote.shortCode);
        if (!local) return remote;
        // Local record keeps rich client-only data (pricing currency, base64
        // preview); the server wins for live operational state.
        return {
          ...local,
          status: remote.status,
          history: remote.history,
          printedCopiesCount: remote.printedCopiesCount,
          expiresAt: remote.expiresAt,
          fileDataUrl: local.fileDataUrl || remote.fileDataUrl,
          pages: local.pages?.length ? local.pages : remote.pages,
        };
      });

      // Keep jobs that only exist locally (e.g. uploaded while offline)
      const remoteCodes = new Set(merged.map((j) => j.shortCode));
      for (const local of localJobs) {
        if (!remoteCodes.has(local.shortCode)) merged.push(local);
      }

      merged.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      safeSaveJobs(merged);
      return merged;
    } catch (err) {
      console.warn('[API] Backend job sync unavailable, serving local jobs:', err);
      return this.getJobs();
    }
  },

  // Upload new document
  uploadDocument(
    data: Omit<PrintJob, 'id' | 'shortCode' | 'uploadedAt' | 'history' | 'printedCopiesCount'>,
    rawFile?: File
  ): PrintJob {
    const jobs = this.getJobs();
    const now = new Date().toISOString();

    const newJob: PrintJob = {
      ...data,
      id: generateId(),
      shortCode: generateShortCode(),
      uploadedAt: now,
      printedCopiesCount: 0,
      history: [
        {
          timestamp: now,
          action: 'Document uploaded via Admin panel',
          actor: 'admin',
        },
      ],
    };

    const updated = [newJob, ...jobs];
    safeSaveJobs(updated);

    // Also send to backend Express server if available
    try {
      const formData = new FormData();
      if (rawFile) {
        formData.append('file', rawFile);
      } else {
        // Create synthetic blob if only mock data
        const blob = new Blob([data.fileDataUrl || 'Sample Document'], { type: data.mimeType || 'text/plain' });
        formData.append('file', blob, data.fileName);
      }
      formData.append('shortCode', newJob.shortCode); // keep server & local identities in sync
      formData.append('copies', String(data.settings.copies || 1));
      formData.append('colorMode', data.settings.colorMode);
      formData.append('paperSize', data.settings.paperSize);
      formData.append('duplex', data.settings.duplex);
      formData.append('customerName', data.customerName || 'Anonymous');
      if (data.customerPhone) formData.append('customerPhone', data.customerPhone);
      if (data.pinCode) formData.append('pinCode', data.pinCode);
      formData.append('autoDeleteAfterPrint', String(data.autoDeleteAfterPrint));
      formData.append('pageCount', String(data.pageCount || 1));

      fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'x-admin-key': ADMIN_SECRET,
        },
        body: formData,
      }).catch((err) => {
        // Backend optional/local demo mode
        console.log('[API] Backend sync skipped or unavailable:', err.message);
      });
    } catch (e) {
      console.warn('[API] Could not dispatch to backend:', e);
    }

    return newJob;
  },

  // Import all files from a public Google Drive folder link.
  // The backend recursively downloads every file and registers print jobs.
  async importFromDrive(
    driveUrl: string,
    options?: { dryRun?: boolean; copies?: number; colorMode?: 'bw' | 'color'; customerName?: string }
  ): Promise<{ success: boolean; importedCount?: number; files?: any[]; failed?: any[]; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/drive/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_SECRET,
        },
        body: JSON.stringify({
          url: driveUrl,
          dryRun: options?.dryRun || false,
          copies: options?.copies ?? 1,
          colorMode: options?.colorMode ?? 'bw',
          customerName: options?.customerName || 'Drive Import',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || `Backend responded with ${res.status}` };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error contacting backend' };
    }
  },

  // Update status (e.g. when shopkeeper clicks Print)
  updateJobStatus(
    jobId: string,
    status: JobStatus,
    options?: { note?: string; actor?: 'admin' | 'shopkeeper' | 'system'; incrementPrintCount?: boolean }
  ): PrintJob | null {
    const jobs = this.getJobs();
    const idx = jobs.findIndex((j) => j.id === jobId || j.shortCode === jobId);
    if (idx === -1) return null;

    const current = jobs[idx];
    const now = new Date().toISOString();

    let count = current.printedCopiesCount;
    if (options?.incrementPrintCount) {
      count += current.settings.copies || 1;
    }

    const updated: PrintJob = {
      ...current,
      status,
      printedCopiesCount: count,
      history: [
        ...current.history,
        {
          timestamp: now,
          action: options?.note || `Status updated to ${status}`,
          actor: options?.actor || 'shopkeeper',
          note: options?.note,
        },
      ],
    };

    // If auto-delete after print is enabled and print finished, mark as wiped
    if (status === 'completed' && current.autoDeleteAfterPrint) {
      updated.fileDataUrl = ''; // Wipe sensitive raw document bytes from local storage
      updated.pages = [
        {
          pageNumber: 1,
          title: 'Document Wiped',
          htmlContent: `
            <div style="font-family: sans-serif; padding: 40px; text-align: center; color: #64748b;">
              <h2 style="color: #0f172a; margin-bottom: 8px;">Document Auto-Wiped</h2>
              <p style="font-size: 13px;">This document was securely erased from memory immediately after printing per privacy policy.</p>
            </div>
          `,
        },
      ];
      updated.status = 'wiped';
    }

    jobs[idx] = updated;
    safeSaveJobs(jobs);

    // Send status update to backend server to trigger physical file deletion
    fetch(`${BACKEND_URL}/api/jobs/${jobId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        note: options?.note,
        actor: options?.actor || 'shopkeeper',
        incrementPrintCount: options?.incrementPrintCount,
      }),
    }).catch(() => {});

    return updated;
  },

  // Delete / wipe file permanently
  deleteJob(jobId: string): boolean {
    const jobs = this.getJobs();
    const filtered = jobs.filter((j) => j.id !== jobId && j.shortCode !== jobId);
    if (filtered.length !== jobs.length) {
      safeSaveJobs(filtered);
      // Notify backend
      fetch(`${BACKEND_URL}/api/jobs/${jobId}`, {
        method: 'DELETE',
      }).catch(() => {});
      return true;
    }
    return false;
  },
};
