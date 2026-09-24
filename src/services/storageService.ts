import { PrintJob, JobStatus, PrintSettings } from '../types/print';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { calculatePrintPricing } from './pricingService';

const STORAGE_KEY = 'printbridge_jobs_v1';

function generateShortCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PRN-${code}`;
}

export function generateId(): string {
  return 'job_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
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
    notes: 'Please print on heavy 100gsm bright white paper. Clean single staple on top-left.',
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
    notes: 'Need 3 copies for Accounts, Vendor copy, and Logistics gate pass.',
  };

  const job1: PrintJob = {
    id: 'job_sample_resume_01',
    shortCode: 'PRN-9482',
    fileName: sample1.name,
    fileType: 'pdf',
    mimeType: sample1.mimeType,
    fileSize: sample1.size,
    fileDataUrl: '',
    pageCount: sample1.pageCount,
    pages: sample1.pages,
    uploadedAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
    expiresAt: expires1.toISOString(),
    status: 'in_queue',
    customerName: 'Sarah Chen',
    customerPhone: '+1 (415) 890-4122',
    customerEmail: 'sarah.chen@designlab.io',
    settings: defaultSettings1,
    pricing: calculatePrintPricing(sample1.pageCount, defaultSettings1),
    printedCopiesCount: 0,
    history: [
      {
        timestamp: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
        action: 'Job uploaded & link generated',
        actor: 'customer',
      },
      {
        timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        action: 'Received at Shop Print Station',
        actor: 'shopkeeper',
        note: 'Queued for Color Laser Jet #2',
      },
    ],
  };

  const job2: PrintJob = {
    id: 'job_sample_invoice_02',
    shortCode: 'PRN-3820',
    fileName: sample2.name,
    fileType: 'pdf',
    mimeType: sample2.mimeType,
    fileSize: sample2.size,
    fileDataUrl: '',
    pageCount: sample2.pageCount,
    pages: sample2.pages,
    uploadedAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
    expiresAt: expires2.toISOString(),
    status: 'completed',
    customerName: 'Marcus Vance',
    customerPhone: '+1 (415) 555-0199',
    settings: defaultSettings2,
    pricing: calculatePrintPricing(sample2.pageCount, defaultSettings2),
    printedCopiesCount: 3,
    history: [
      {
        timestamp: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
        action: 'Job uploaded',
        actor: 'customer',
      },
      {
        timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        action: 'Printed 3 copies on Ricoh High-Speed B&W',
        actor: 'shopkeeper',
      },
      {
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        action: 'Marked ready for customer counter pickup',
        actor: 'shopkeeper',
      },
    ],
  };

  return [job1, job2];
}

export function getStoredJobs(): PrintJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialSeedJobs();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as PrintJob[];
    return parsed;
  } catch (err) {
    console.error('Failed to load stored jobs:', err);
    return createInitialSeedJobs();
  }
}

export function saveJobs(jobs: PrintJob[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (err) {
    console.error('Failed to save jobs:', err);
  }
}

export function getJobByIdOrCode(query: string): PrintJob | undefined {
  const jobs = getStoredJobs();
  const normalized = query.trim().toUpperCase();
  return jobs.find(
    (j) =>
      j.id === query ||
      j.shortCode.toUpperCase() === normalized ||
      j.shortCode.replace('PRN-', '').toUpperCase() === normalized
  );
}

export function createPrintJob(
  jobData: Omit<PrintJob, 'id' | 'shortCode' | 'uploadedAt' | 'history' | 'printedCopiesCount'>
): PrintJob {
  const jobs = getStoredJobs();
  const now = new Date().toISOString();
  
  const newJob: PrintJob = {
    ...jobData,
    id: generateId(),
    shortCode: generateShortCode(),
    uploadedAt: now,
    printedCopiesCount: 0,
    history: [
      {
        timestamp: now,
        action: 'Job created and link generated',
        actor: 'customer',
      },
    ],
  };

  const updated = [newJob, ...jobs];
  saveJobs(updated);
  return newJob;
}

export function updateJobStatus(
  jobId: string,
  newStatus: JobStatus,
  options?: { actor?: 'customer' | 'shopkeeper' | 'system'; note?: string; incrementPrintCount?: boolean }
): PrintJob | null {
  const jobs = getStoredJobs();
  const index = jobs.findIndex((j) => j.id === jobId || j.shortCode === jobId);
  if (index === -1) return null;

  const current = jobs[index];
  const now = new Date().toISOString();

  let newPrintedCount = current.printedCopiesCount;
  if (options?.incrementPrintCount) {
    newPrintedCount += current.settings.copies || 1;
  }

  const updatedJob: PrintJob = {
    ...current,
    status: newStatus,
    printedCopiesCount: newPrintedCount,
    history: [
      ...current.history,
      {
        timestamp: now,
        action: options?.note || `Status changed to ${newStatus.replace('_', ' ')}`,
        actor: options?.actor || 'shopkeeper',
        note: options?.note,
      },
    ],
  };

  jobs[index] = updatedJob;
  saveJobs(jobs);
  return updatedJob;
}

export function deleteJob(jobId: string): boolean {
  const jobs = getStoredJobs();
  const filtered = jobs.filter((j) => j.id !== jobId && j.shortCode !== jobId);
  if (filtered.length !== jobs.length) {
    saveJobs(filtered);
    return true;
  }
  return false;
}
