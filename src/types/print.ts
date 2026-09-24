export type ColorMode = 'bw' | 'color' | 'grayscale';
export type PaperSize = 'A4' | 'Letter' | 'Legal' | 'A3' | '4x6_Photo';
export type DuplexMode = 'single' | 'double_long' | 'double_short';
export type Orientation = 'portrait' | 'landscape' | 'auto';
export type PaperWeight = 'standard_75gsm' | 'heavy_100gsm' | 'cardstock_200gsm' | 'glossy_photo';
export type StapleOption = 'none' | 'top_left' | 'top_right' | 'two_left' | 'booklet';
export type BindingOption = 'none' | 'spiral_coil' | 'thermal' | 'comb' | 'hardcover';

export type JobStatus = 'pending' | 'in_queue' | 'printing' | 'ready' | 'completed' | 'cancelled' | 'wiped';

export type Currency = 'BDT' | 'USD';

export interface PrintSettings {
  copies: number;
  colorMode: ColorMode;
  paperSize: PaperSize;
  duplex: DuplexMode;
  orientation: Orientation;
  pageRange: string; // 'all' or '1-5, 8'
  finishing: {
    staple: StapleOption;
    binding: BindingOption;
    lamination: boolean;
    paperWeight: PaperWeight;
  };
  notes: string;
}

export interface PricingBreakdown {
  basePageCost: number;
  colorPremium: number;
  duplexDiscount: number;
  paperUpgradeCost: number;
  bindingCost: number;
  stapleCost: number;
  laminationCost: number;
  subtotal: number;
  tax: number;
  totalCost: number;
  currency: string;
}

export interface DocumentPage {
  pageNumber: number;
  title?: string;
  contentSnippet?: string;
  previewUrl?: string;
  htmlContent?: string;
}

export interface PrintJob {
  id: string;
  shortCode: string; // e.g. "PRN-7842"
  fileName: string;
  fileType: 'pdf' | 'image' | 'document' | 'text';
  mimeType: string;
  fileSize: number; // in bytes
  fileDataUrl: string;
  pageCount: number;
  pages: DocumentPage[];
  uploadedAt: string;
  expiresAt: string;
  status: JobStatus;
  pinCode?: string; // Optional security PIN
  autoDeleteAfterPrint?: boolean; // Secure auto-wipe after print execution
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  settings: PrintSettings;
  pricing: PricingBreakdown;
  printedCopiesCount: number;
  pickupTime?: string;
  history: {
    timestamp: string;
    action: string;
    actor: 'admin' | 'customer' | 'shopkeeper' | 'system';
    note?: string;
  }[];
}

export interface AdminAuth {
  isAuthenticated: boolean;
  adminKey: string;
}
