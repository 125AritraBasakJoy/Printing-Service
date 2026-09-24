import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Printer,
  QrCode,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  History,
  Trash2,
} from 'lucide-react';
import {
  ColorMode,
  DocumentPage,
  PrintJob,
  PrintSettings,
  PricingBreakdown,
} from '../types/print';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { calculatePrintPricing } from '../services/pricingService';
import { createPrintJob, getStoredJobs, deleteJob } from '../services/storageService';
import { FileDropzone } from '../components/FileDropzone';
import { PrintConfigPanel } from '../components/PrintConfigPanel';
import { DocumentPreview } from '../components/DocumentPreview';
import { ShareSuccessCard } from '../components/ShareSuccessCard';

interface UploadPageProps {
  onOpenShopView: (jobId: string) => void;
  onSelectJob: (jobId: string) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  onOpenShopView,
  onSelectJob,
}) => {
  // Loaded File State (Defaults to initial high-quality sample for immediate interaction)
  const initialSample = SAMPLE_DOCUMENTS[0];
  const [fileName, setFileName] = useState<string>(initialSample.name);
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'document' | 'text'>('pdf');
  const [mimeType, setMimeType] = useState<string>(initialSample.mimeType);
  const [fileSize, setFileSize] = useState<number>(initialSample.size);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(initialSample.pageCount);
  const [pages, setPages] = useState<DocumentPage[]>(initialSample.pages);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Settings State
  const [settings, setSettings] = useState<PrintSettings>({
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
  });

  // Customer & Security State
  const [customerName, setCustomerName] = useState('Sarah Chen');
  const [customerPhone, setCustomerPhone] = useState('+1 (415) 890-4122');
  const [pinCode, setPinCode] = useState('');
  const [expirationHours, setExpirationHours] = useState(24);

  // Completed / Created Job
  const [generatedJob, setGeneratedJob] = useState<PrintJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<PrintJob[]>([]);

  // Compute pricing
  const pricing: PricingBreakdown = calculatePrintPricing(pageCount, settings);

  // Refresh recent jobs
  const refreshRecentJobs = () => {
    setRecentJobs(getStoredJobs());
  };

  useEffect(() => {
    refreshRecentJobs();
  }, []);

  const handleFileLoaded = (data: {
    fileName: string;
    fileType: 'pdf' | 'image' | 'document' | 'text';
    mimeType: string;
    fileSize: number;
    fileDataUrl: string;
    pageCount: number;
    pages: DocumentPage[];
    suggestedSettings?: Partial<PrintSettings>;
  }) => {
    setFileName(data.fileName);
    setFileType(data.fileType);
    setMimeType(data.mimeType);
    setFileSize(data.fileSize);
    setFileDataUrl(data.fileDataUrl);
    setPageCount(data.pageCount);
    setPages(data.pages);
    setCurrentPageIndex(0);

    if (data.suggestedSettings) {
      setSettings((prev) => ({
        ...prev,
        ...data.suggestedSettings,
        finishing: {
          ...prev.finishing,
          ...(data.suggestedSettings?.finishing || {}),
        },
      }));
    }

    // Reset generated job view when new file is loaded
    setGeneratedJob(null);
  };

  const handleGenerateLink = () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000).toISOString();

    const created = createPrintJob({
      fileName,
      fileType,
      mimeType,
      fileSize,
      fileDataUrl,
      pageCount,
      pages,
      expiresAt,
      status: 'in_queue',
      pinCode: pinCode.trim() || undefined,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || undefined,
      settings,
      pricing,
    });

    setGeneratedJob(created);
    refreshRecentJobs();
  };

  const handleResetForNew = () => {
    setGeneratedJob(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* If job is generated, show share success screen */}
      {generatedJob ? (
        <div className="py-4">
          <ShareSuccessCard
            job={generatedJob}
            onOpenShopView={onOpenShopView}
            onNewUpload={handleResetForNew}
          />
        </div>
      ) : (
        <>
          {/* Hero Intro */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Instant Document Printing & Sharing
            </h1>
            <p className="text-sm text-slate-500">
              Upload your document, select your paper & color options, and generate a secure link or QR code for any physical print shop.
            </p>
          </div>

          {/* Main 2-Column Workflow */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Upload & Settings (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              <FileDropzone
                onFileLoaded={handleFileLoaded}
                selectedFileName={fileName}
              />

              <PrintConfigPanel
                settings={settings}
                onChange={setSettings}
                pricing={pricing}
                pageCount={pageCount}
                customerName={customerName}
                onCustomerNameChange={setCustomerName}
                customerPhone={customerPhone}
                onCustomerPhoneChange={setCustomerPhone}
                pinCode={pinCode}
                onPinCodeChange={setPinCode}
                expirationHours={expirationHours}
                onExpirationHoursChange={setExpirationHours}
              />

              {/* Primary CTA: Generate Link & QR */}
              <button
                type="button"
                onClick={handleGenerateLink}
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group hover:scale-[1.01]"
              >
                <QrCode className="w-5 h-5 text-indigo-200 group-hover:scale-110 transition-transform" />
                <span>Generate Shopkeeper Link & QR Code</span>
                <ArrowRight className="w-4 h-4 text-indigo-300" />
              </button>
            </div>

            {/* Right Column: Live Document Preview (6 cols) */}
            <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Live Print Simulation
                </span>
                <span className="text-xs text-slate-500">
                  Exact appearance before printing
                </span>
              </div>

              <DocumentPreview
                fileName={fileName}
                fileType={fileType}
                fileDataUrl={fileDataUrl}
                pages={pages}
                currentPageIndex={currentPageIndex}
                onPageChange={setCurrentPageIndex}
                colorMode={settings.colorMode}
                paperSize={settings.paperSize}
                orientation={settings.orientation}
              />

              {/* Quick Info Callout */}
              <div className="bg-slate-100/80 rounded-xl p-4 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Browser Native Spooling</div>
                  <div>
                    The shopkeeper can print directly from their browser using the native OS printer dialog with no drivers or software installation required.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent / Stored Jobs Drawer */}
      {recentJobs.length > 0 && (
        <div className="pt-8 border-t border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Recent Print Uploads & Tokens
            </span>
            <span className="text-xs text-slate-500">{recentJobs.length} active documents</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentJobs.slice(0, 6).map((job) => (
              <div
                key={job.id}
                className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-indigo-600">
                      {job.shortCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded-full ${
                        job.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate" title={job.fileName}>
                    {job.fileName}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {job.settings.copies} {job.settings.copies === 1 ? 'copy' : 'copies'} · {job.settings.colorMode.toUpperCase()} · ${job.pricing.totalCost.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectJob(job.id)}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Open in Shopkeeper View"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete ${job.shortCode}?`)) {
                        deleteJob(job.id);
                        refreshRecentJobs();
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Delete Job"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
