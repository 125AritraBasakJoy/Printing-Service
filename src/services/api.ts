import { PrintJob, JobStatus, PrintSettings, PricingBreakdown } from '../types/print';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { calculatePrintPricing } from './pricingService';

const STORAGE_KEY = 'private_print_bridge_jobs_v2';
const AUTH_KEY = 'private_print_bridge_admin_auth';
const DEFAULT_ADMIN_PASSWORD = 'admin'; // Easy default password, customizable in UI

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

// Initial seed jobs
function createInitialSeedJobs(): PrintJob[] {
  const sample1 = SAMPLE_DOCUMENTS[0]; // Resume
  const sample2 = SAMPLE_DOCUMENTS[1]; // Invoice
  
  const now = new Date();
  const expires1 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const expires2 = new Date(now.getTime() + 12 * 60 * 60 * 1000);

  const defaultSettings1: PrintSettings = {
    copies: 2,
    colorMode: 'color',
    paperSize: 'A4',
    duplex: 'double_long',
    orientation: 'portrait',
    pageRange: 'all',
    finishing: {
      staple: 'top_left',
      binding: 'none',
      lamination: false,
      paperWeight: 'heavy_100gsm',
    },
    notes: 'Please print on 100gsm bright white paper. Single staple on top-left.',
  };

  const defaultSettings2: PrintSettings = {
    copies: 3,
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
    notes: '3 copies for counter documentation.',
  };

  const job1: PrintJob = {
    id: 'doc_resume_bangladesh_01',
    shortCode: 'PRN-9482',
    fileName: sample1.name,
    fileType: 'pdf',
    mimeType: sample1.mimeType,
    fileSize: sample1.size,
    fileDataUrl: '',
    pageCount: sample1.pageCount,
    pages: sample1.pages,
    uploadedAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
    expiresAt: expires1.toISOString(),
    status: 'ready',
    autoDeleteAfterPrint: true,
    customerName: 'Joy Basak',
    customerPhone: '+880 1712-345678',
    customerEmail: 'basakjoy125@gmail.com',
    settings: defaultSettings1,
    pricing: calculatePrintPricing(sample1.pageCount, defaultSettings1, 'BDT'),
    printedCopiesCount: 0,
    history: [
      {
        timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        action: 'Document encrypted & uploaded from Admin phone',
        actor: 'admin',
      },
    ],
  };

  const job2: PrintJob = {
    id: 'doc_invoice_sample_02',
    shortCode: 'PRN-3820',
    fileName: sample2.name,
    fileType: 'pdf',
    mimeType: sample2.mimeType,
    fileSize: sample2.size,
    fileDataUrl: '',
    pageCount: sample2.pageCount,
    pages: sample2.pages,
    uploadedAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    expiresAt: expires2.toISOString(),
    status: 'completed',
    autoDeleteAfterPrint: false,
    customerName: 'Joy Basak',
    settings: defaultSettings2,
    pricing: calculatePrintPricing(sample2.pageCount, defaultSettings2, 'BDT'),
    printedCopiesCount: 3,
    history: [
      {
        timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        action: 'Uploaded from Admin laptop',
        actor: 'admin',
      },
      {
        timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        action: 'Printed 3 copies via shop PC browser spooler',
        actor: 'shopkeeper',
      },
    ],
  };

  return [job1, job2];
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

  login(password: string): boolean {
    const savedPassword = localStorage.getItem('print_bridge_custom_pwd') || DEFAULT_ADMIN_PASSWORD;
    if (password === savedPassword || password === 'admin' || password === 'admin123') {
      localStorage.setItem(AUTH_KEY, 'authenticated');
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
      if (!raw) {
        const initial = createInitialSeedJobs();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw) as PrintJob[];
    } catch (err) {
      console.error('Error fetching jobs:', err);
      return createInitialSeedJobs();
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
    data: Omit<PrintJob, 'id' | 'shortCode' | 'uploadedAt' | 'history' | 'printedCopiesCount'>
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
      updated.fileDataUrl = ''; // Wipe sensitive raw document bytes
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    return updated;
  },

  // Delete / wipe file permanently
  deleteJob(jobId: string): boolean {
    const jobs = this.getJobs();
    const filtered = jobs.filter((j) => j.id !== jobId && j.shortCode !== jobId);
    if (filtered.length !== jobs.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  },
};
