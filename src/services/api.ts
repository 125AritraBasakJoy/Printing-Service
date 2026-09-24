import { PrintJob, JobStatus, PrintSettings, PricingBreakdown } from '../types/print';
import { calculatePrintPricing } from './pricingService';

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
      fetch('/api/auth/verify', {
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
      
      // Merge with memory cache to preserve full data URLs
      if (memoryJobsCache.length > 0) {
        const memoryMap = new Map(memoryJobsCache.map((j) => [j.id, j]));
        parsed = parsed.map((j) => {
          const mem = memoryMap.get(j.id);
          return mem || j;
        });
        // Include any memory-only jobs
        for (const memJob of memoryJobsCache) {
          if (!parsed.some((p) => p.id === memJob.id)) {
            parsed.push(memJob);
          }
        }
      }

      // Filter out any legacy dummy seed jobs
      const cleaned = parsed.filter(
        (j) =>
          j.id !== 'doc_resume_bangladesh_01' &&
          j.id !== 'doc_invoice_sample_02' &&
          j.shortCode !== 'PRN-9482' &&
          j.shortCode !== 'PRN-3820'
      );
      return cleaned;
    } catch (err) {
      console.error('Error fetching jobs:', err);
      return memoryJobsCache;
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
      formData.append('copies', String(data.settings.copies || 1));
      formData.append('colorMode', data.settings.colorMode);
      formData.append('paperSize', data.settings.paperSize);
      formData.append('duplex', data.settings.duplex);
      formData.append('customerName', data.customerName || 'Anonymous');
      if (data.customerPhone) formData.append('customerPhone', data.customerPhone);
      if (data.pinCode) formData.append('pinCode', data.pinCode);
      formData.append('autoDeleteAfterPrint', String(data.autoDeleteAfterPrint));
      formData.append('pageCount', String(data.pageCount || 1));

      fetch('/api/upload', {
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
    fetch(`/api/jobs/${jobId}/status`, {
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
      fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      }).catch(() => {});
      return true;
    }
    return false;
  },
};
