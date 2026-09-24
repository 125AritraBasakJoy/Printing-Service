import React, { useState } from 'react';
import {
  Printer,
  FileDown,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Phone,
  User,
  MessageSquare,
  AlertCircle,
  FileText,
  Sliders,
  Send,
  Trash2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PrintJob, JobStatus } from '../types/print';
import { DocumentPreview } from '../components/DocumentPreview';

interface ShopViewPageProps {
  job: PrintJob | null;
  onUpdateStatus: (
    jobId: string,
    status: JobStatus,
    options?: { note?: string; incrementPrintCount?: boolean }
  ) => void;
  onDeleteJob: (jobId: string) => void;
  onSelectAnotherJob: () => void;
}

export const ShopViewPage: React.FC<ShopViewPageProps> = ({
  job,
  onUpdateStatus,
  onDeleteJob,
  onSelectAnotherJob,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [enteredPin, setEnteredPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [isPrintingModalOpen, setIsPrintingModalOpen] = useState(false);
  const [shopNote, setShopNote] = useState('');

  if (!job) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
          <Printer className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Active Print Job Selected</h2>
        <p className="text-xs text-slate-500">
          Scan a QR code, enter a job token code (e.g. PRN-9482), or select a job from the shop queue.
        </p>
        <button
          onClick={onSelectAnotherJob}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
        >
          View Shop Queue & History
        </button>
      </div>
    );
  }

  // Check if PIN lock is active
  const isProtected = !!job.pinCode && !isUnlocked;

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.trim() === job.pinCode) {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Trigger Native Browser Print Window
  const handleNativePrint = () => {
    onUpdateStatus(job.id, 'printing', {
      note: `Triggered native browser print spooler for ${job.settings.copies} ${job.settings.copies === 1 ? 'copy' : 'copies'}`,
      incrementPrintCount: true,
    });

    // Short timeout to ensure state settles before browser print lock takes over UI
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDownloadRaw = () => {
    if (job.fileDataUrl) {
      const link = document.createElement('a');
      link.href = job.fileDataUrl;
      link.download = job.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create a plain text or simulated file download
      const content = job.pages.map((p) => p.htmlContent || p.title).join('\n\n');
      const blob = new Blob([content], { type: job.mimeType || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = job.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleNotifyCustomer = () => {
    if (job.customerPhone) {
      const text = encodeURIComponent(
        `Hi ${job.customerName || 'Customer'}! Your print job (${job.fileName}, ${job.settings.copies} copies) is ready for pickup at our counter. Total: $${job.pricing.totalCost.toFixed(2)}.`
      );
      window.open(`https://wa.me/${job.customerPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
    }
    onUpdateStatus(job.id, 'ready', { note: 'Customer notified for pickup' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Shopkeeper Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Left: Job ID, Customer & Upload Time */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black font-mono text-indigo-700 tracking-wider">
              {job.shortCode}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                job.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : job.status === 'printing'
                  ? 'bg-blue-100 text-blue-800 animate-pulse'
                  : job.status === 'ready'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {job.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {job.customerName || 'Counter Customer'}
            </span>
            {job.customerPhone && (
              <>
                <span>·</span>
                <span className="font-mono">{job.customerPhone}</span>
              </>
            )}
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Uploaded {new Date(job.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Right: Quick Spool Print Button & Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleDownloadRaw}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
            title="Download original file for external RIP/Plotter"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Raw File</span>
          </button>

          {job.customerPhone && (
            <button
              type="button"
              onClick={handleNotifyCustomer}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all flex items-center gap-1.5"
              title="Notify customer via WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Notify Ready</span>
            </button>
          )}

          {/* Primary Big Print Button */}
          <button
            type="button"
            onClick={handleNativePrint}
            disabled={isProtected}
            className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all group"
          >
            <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>PRINT DOCUMENT</span>
          </button>
        </div>
      </div>

      {/* PIN Lock Barrier if Protected */}
      {isProtected ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-lg max-w-md mx-auto text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Protected Document</h3>
            <p className="text-xs text-slate-500 mt-1">
              The customer locked this document with a PIN. Ask the customer at the counter for their security passcode.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-3 pt-2">
            <input
              type="password"
              placeholder="Enter PIN Code"
              value={enteredPin}
              onChange={(e) => {
                setEnteredPin(e.target.value);
                setPinError(false);
              }}
              autoFocus
              className="w-full text-center text-lg font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {pinError && (
              <p className="text-xs text-red-600 font-semibold">
                Incorrect PIN. Please ask customer to confirm.
              </p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
            >
              Unlock Document
            </button>
          </form>
        </div>
      ) : (
        /* Main Workspace: Specs Breakdown + Live Document Canvas */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (5 cols): Print Instruction Checklist */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Prominent Shopkeeper Checklist Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Shop Print Checklist
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600">
                  Total: ${job.pricing.totalCost.toFixed(2)}
                </span>
              </div>

              {/* High-visibility spec pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                  <span className="text-xs font-semibold text-slate-700">Copies Required:</span>
                  <span className="text-base font-black text-indigo-900 font-mono">
                    {job.settings.copies} {job.settings.copies === 1 ? 'COPY' : 'COPIES'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Color Mode</div>
                    <div className="text-xs font-black text-slate-900 uppercase mt-0.5">
                      {job.settings.colorMode === 'bw' ? 'Black & White' : 'Full Color'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Sides / Duplex</div>
                    <div className="text-xs font-black text-slate-900 uppercase mt-0.5">
                      {job.settings.duplex === 'single' ? 'Single-Sided' : 'Double-Sided'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Paper Size</div>
                    <div className="text-xs font-black text-slate-900 mt-0.5">
                      {job.settings.paperSize}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Paper Stock</div>
                    <div className="text-xs font-black text-slate-900 mt-0.5 capitalize">
                      {job.settings.finishing.paperWeight.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                {/* Staple & Binding notes */}
                {(job.settings.finishing.staple !== 'none' ||
                  job.settings.finishing.binding !== 'none' ||
                  job.settings.finishing.lamination) && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1">
                    <div className="text-[10px] uppercase font-bold text-amber-800">
                      Finishing Services:
                    </div>
                    {job.settings.finishing.staple !== 'none' && (
                      <div className="font-semibold text-amber-950">
                        • Staple: {job.settings.finishing.staple.replace('_', ' ')}
                      </div>
                    )}
                    {job.settings.finishing.binding !== 'none' && (
                      <div className="font-semibold text-amber-950">
                        • Binding: {job.settings.finishing.binding.replace('_', ' ')}
                      </div>
                    )}
                    {job.settings.finishing.lamination && (
                      <div className="font-semibold text-amber-950">
                        • Heat Lamination Included
                      </div>
                    )}
                  </div>
                )}

                {/* Customer instructions */}
                {job.settings.notes && (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Customer Note:
                    </div>
                    <p className="font-medium text-slate-800 italic">"{job.settings.notes}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shopkeeper Status Update & History Controls */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                Update Order Status
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateStatus(job.id, 'in_queue', { note: 'Placed in active queue' })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    job.status === 'in_queue'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  In Queue
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStatus(job.id, 'printing', { note: 'Printer running' })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    job.status === 'printing'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Printing
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStatus(job.id, 'completed', { note: 'Order collected by customer' })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    job.status === 'completed'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Completed
                </button>
              </div>

              {/* History trail */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Audit Trail
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-slate-500 font-mono">
                  {job.history.map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-slate-400 shrink-0">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-slate-700 font-medium">· {h.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delete / Wipe Button */}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete and wipe this document from storage?')) {
                      onDeleteJob(job.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe Document</span>
                </button>
                <button
                  type="button"
                  onClick={onSelectAnotherJob}
                  className="text-slate-500 hover:text-slate-800 font-medium"
                >
                  Back to Queue
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Document Inspection Canvas */}
          <div className="lg:col-span-7">
            <DocumentPreview
              fileName={job.fileName}
              fileType={job.fileType}
              fileDataUrl={job.fileDataUrl}
              pages={job.pages}
              currentPageIndex={currentPageIndex}
              onPageChange={setCurrentPageIndex}
              colorMode={job.settings.colorMode}
              paperSize={job.settings.paperSize}
              orientation={job.settings.orientation}
            />
          </div>
        </div>
      )}
    </div>
  );
};
