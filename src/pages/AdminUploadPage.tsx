import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  QrCode,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  LogOut,
  Sparkles,
  Layers,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  RefreshCw,
  Clock,
  Key,
  ShieldAlert,
  Send,
  Printer,
} from 'lucide-react';
import {
  ColorMode,
  Currency,
  DocumentPage,
  PrintJob,
  PrintSettings,
  PricingBreakdown,
} from '../types/print';
import { calculatePrintPricing } from '../services/pricingService';
import { api } from '../services/api';
import { FileDropzone } from '../components/FileDropzone';
import { PrintConfigPanel } from '../components/PrintConfigPanel';
import { DocumentPreview } from '../components/DocumentPreview';
import { ShareSuccessCard } from '../components/ShareSuccessCard';
import { QrCodeView } from '../components/QrCodeView';

interface AdminUploadPageProps {
  onOpenShopView?: (jobId: string) => void;
  onLogout: () => void;
}

export const AdminUploadPage: React.FC<AdminUploadPageProps> = ({
  onOpenShopView,
  onLogout,
}) => {
  const [currency, setCurrency] = useState<Currency>('BDT');
  // Loaded File State (starts empty with no dummy file preloaded)
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'document' | 'text'>('pdf');
  const [mimeType, setMimeType] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(1);
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | undefined>(undefined);

  // Settings
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
    notes: 'Please print on 100gsm paper. Clean single staple on top-left.',
  });

  // Customer & Privacy Controls
  const [customerName, setCustomerName] = useState('Joy Basak');
  const [customerPhone, setCustomerPhone] = useState('+880 1712-345678');
  const [pinCode, setPinCode] = useState('');
  const [autoDeleteAfterPrint, setAutoDeleteAfterPrint] = useState(true);
  const [expirationHours, setExpirationHours] = useState(24);

  // Generated Job View
  const [generatedJob, setGeneratedJob] = useState<PrintJob | null>(null);
  const [activeJobs, setActiveJobs] = useState<PrintJob[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeQrModalJob, setActiveQrModalJob] = useState<PrintJob | null>(null);

  // Dynamic pricing
  const pricing: PricingBreakdown = calculatePrintPricing(pageCount, settings, currency);

  const refreshJobs = () => {
    setActiveJobs(api.getJobs());
  };

  useEffect(() => {
    refreshJobs();
  }, []);

  const handleFileLoaded = (data: {
    fileName: string;
    fileType: 'pdf' | 'image' | 'document' | 'text';
    mimeType: string;
    fileSize: number;
    fileDataUrl: string;
    pageCount: number;
    pages: DocumentPage[];
    rawFile?: File;
    suggestedSettings?: Partial<PrintSettings>;
  }) => {
    setFileName(data.fileName);
    setFileType(data.fileType);
    setMimeType(data.mimeType);
    setFileSize(data.fileSize);
    setFileDataUrl(data.fileDataUrl);
    setPageCount(data.pageCount);
    setPages(data.pages);
    setRawFile(data.rawFile);
    setCurrentPageIndex(0);
    setErrorMessage(null);

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

    setGeneratedJob(null);
  };

  const handleGenerateLink = () => {
    if (!fileName) {
      setErrorMessage('Please drop or select a document above before generating a print link.');
      return;
    }
    setErrorMessage(null);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000).toISOString();

    const created = api.uploadDocument(
      {
        fileName,
        fileType,
        mimeType,
        fileSize,
        fileDataUrl,
        pageCount,
        pages,
        expiresAt,
        status: 'ready',
        pinCode: pinCode.trim() || undefined,
        autoDeleteAfterPrint,
        customerName: customerName.trim() || 'Joy Basak',
        customerPhone: customerPhone.trim() || undefined,
        settings,
        pricing,
      },
      rawFile
    );

    setGeneratedJob(created);
    refreshJobs();
  };

  const handleCopyLinkForJob = (job: PrintJob) => {
    const link = `${window.location.origin}/print/${job.shortCode}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(job.shortCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* 1. Admin Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">Private Admin Upload Bridge</h1>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Protected / Secured
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Upload documents securely from your phone/laptop to create temporary shopkeeper print links.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {/* Currency Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-bold border border-slate-200">
            <button
              onClick={() => setCurrency('BDT')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                currency === 'BDT' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ৳ BDT
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                currency === 'USD' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              $ USD
            </button>
          </div>

          <button
            onClick={onLogout}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Lock Admin Panel"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* 2. Success Hub (If Generated) */}
      {generatedJob && (
        <ShareSuccessCard
          job={generatedJob}
          onNewUpload={() => setGeneratedJob(null)}
        />
      )}

      {/* 3. Upload Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Upload & Form Config (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <FileDropzone
              onFileLoaded={handleFileLoaded}
              selectedFileName={fileName}
            />

            {/* Privacy & Auto-Wipe Protection Card */}
            <div className="bg-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Anti-Leak & Auto-Wipe Protocol
                </span>
                <span className="text-[10px] bg-indigo-800/80 px-2 py-0.5 rounded font-mono text-indigo-200">
                  Zero Shop Retention
                </span>
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoDeleteAfterPrint}
                  onChange={(e) => setAutoDeleteAfterPrint(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-indigo-500 focus:ring-indigo-400 border-indigo-700 bg-indigo-900"
                />
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-white block">
                    Auto-wipe document immediately after print
                  </span>
                  <span className="text-indigo-200 text-[11px] block leading-relaxed">
                    Once the shopkeeper clicks "Print Document", the file content is permanently erased from memory. Public cyber café / print shop computers cannot recover or download it.
                  </span>
                </div>
              </label>
            </div>

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

            {/* Submit Button */}
            {errorMessage && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-medium animate-in fade-in">
                ⚠️ {errorMessage}
              </div>
            )}
            <button
              type="button"
              onClick={handleGenerateLink}
              disabled={!fileName}
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group hover:scale-[1.01]"
            >
              <QrCode className="w-5 h-5 text-indigo-200 group-hover:scale-110 transition-transform" />
              <span>{fileName ? 'Generate Shopkeeper Print Link & QR' : 'Upload Document to Generate Link'}</span>
              <ArrowRight className="w-4 h-4 text-indigo-300" />
            </button>
          </div>

          {/* Right Column: Live Document Preview (6 cols) */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Document Preview & Laser Simulation
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {pageCount} {pageCount === 1 ? 'Page' : 'Pages'}
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

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Zero Download Exposure:</strong> The shopkeeper prints directly via the native browser print spooler with high fidelity CSS without saving the raw file to their downloads folder.
              </div>
            </div>
          </div>
        </div>

      {/* 3. Active Shared Links & Jobs Dashboard */}
      <div className="pt-8 border-t border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Active Print Links & Documents
            </h2>
            <p className="text-xs text-slate-500">
              Manage live links, check print status, or manually wipe files at any time.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-600">
            {activeJobs.length} {activeJobs.length === 1 ? 'link active' : 'links active'}
          </span>
        </div>

        {activeJobs.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No active documents. Upload a document above to generate a shopkeeper link.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeJobs.map((job) => {
              const shareLink = `${window.location.origin}/print/${job.shortCode}`;
              const isWiped = job.status === 'wiped';

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black font-mono text-indigo-700">
                        {job.shortCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isWiped
                            ? 'bg-slate-100 text-slate-500 line-through'
                            : job.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.status === 'printing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {isWiped ? 'Wiped & Erased' : job.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900 truncate" title={job.fileName}>
                        {job.fileName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{job.settings.copies} {job.settings.copies === 1 ? 'copy' : 'copies'}</span>
                        <span>·</span>
                        <span className="uppercase font-semibold">{job.settings.colorMode}</span>
                        <span>·</span>
                        <span>{job.pricing.currency}{job.pricing.totalCost.toFixed(2)}</span>
                      </div>
                    </div>

                    {job.pinCode && (
                      <div className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                        PIN: <strong>{job.pinCode}</strong>
                      </div>
                    )}
                  </div>

                  {/* Actions for this job */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyLinkForJob(job)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 font-medium text-[11px]"
                        title="Copy Share Link"
                      >
                        {copiedCode === job.shortCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedCode === job.shortCode ? 'Copied' : 'Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveQrModalJob(job)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => window.open(`/print/${job.shortCode}`, '_blank')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                        title="Preview in new tab without leaving admin"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Permanently wipe and erase ${job.shortCode}?`)) {
                            api.deleteJob(job.id);
                            refreshJobs();
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {activeQrModalJob && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setActiveQrModalJob(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Scan at Print Shop Counter
              </span>
              <h3 className="text-xl font-black text-indigo-700 font-mono mt-0.5">
                {activeQrModalJob.shortCode}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-1">
                {activeQrModalJob.fileName}
              </p>
            </div>

            <div className="flex justify-center py-2">
              <QrCodeView
                value={`${window.location.origin}/print/${activeQrModalJob.shortCode}`}
                size={180}
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleCopyLinkForJob(activeQrModalJob);
                  setActiveQrModalJob(null);
                }}
                className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700"
              >
                Copy Direct Link
              </button>
              <button
                type="button"
                onClick={() => setActiveQrModalJob(null)}
                className="w-full py-2 text-slate-500 text-xs font-semibold hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
