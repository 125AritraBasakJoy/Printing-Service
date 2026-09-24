import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  FileDown,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  FileText,
  Send,
  Trash2,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { PrintJob, JobStatus } from '../types/print';
import { DocumentPreview } from '../components/DocumentPreview';

interface ShopPrintPageProps {
  job: PrintJob | null;
  onUpdateStatus: (
    jobId: string,
    status: JobStatus,
    options?: { note?: string; incrementPrintCount?: boolean }
  ) => void;
  onAdminLoginClick?: () => void;
}

export const ShopPrintPage: React.FC<ShopPrintPageProps> = ({
  job,
  onUpdateStatus,
  onAdminLoginClick,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [enteredPin, setEnteredPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [printTriggered, setPrintTriggered] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!job) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Document Not Found or Expired</h2>
        <p className="text-xs text-slate-500">
          This print link may have expired or was securely wiped from memory after printing.
        </p>
        {onAdminLoginClick && (
          <button
            onClick={onAdminLoginClick}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            Go to Admin Upload Panel
          </button>
        )}
      </div>
    );
  }

  // If document is wiped
  if (job.status === 'wiped') {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Document Printed & Auto-Wiped
        </h2>
        <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
          In accordance with the private zero-retention security protocol, this document was permanently erased immediately after printing. No data remains on this computer.
        </p>
        <div className="pt-4">
          <span className="text-xs font-mono text-slate-400">Job Reference: {job.shortCode}</span>
        </div>
      </div>
    );
  }

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

  // Generate printable HTML content for iframe
  const generatePrintableHtml = () => {
    const pagesHtml = job.pages
      .map(
        (page) => `
        <div class="print-page-wrapper">
          ${
            page.htmlContent ||
            (job.fileDataUrl && job.fileType === 'image'
              ? `<img src="${job.fileDataUrl}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />`
              : `<div style="padding: 40px; font-family: sans-serif;"><h2>${page.title || 'Document Page'}</h2><p>${page.contentSnippet || ''}</p></div>`)
          }
        </div>
      `
      )
      .join('<div style="page-break-after: always;"></div>');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Print - ${job.fileName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
        <style>
          @page {
            size: ${job.settings.paperSize === 'A3' ? 'A3' : job.settings.paperSize === 'Legal' ? 'legal' : 'A4'} ${job.settings.orientation === 'landscape' ? 'landscape' : 'portrait'};
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            color: #0f172a;
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            ${job.settings.colorMode === 'bw' ? 'filter: grayscale(100%) contrast(120%);' : ''}
          }
          .print-page-wrapper {
            padding: 24px;
            width: 100%;
            min-height: 100vh;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `;
  };

  // Target the embedded iframe directly to mimic the MS Word print experience
  const handleIframePrint = () => {
    setPrintTriggered(true);
    onUpdateStatus(job.id, 'printing', {
      note: `Shopkeeper triggered native iframe print wizard for ${job.settings.copies} ${
        job.settings.copies === 1 ? 'copy' : 'copies'
      }`,
      incrementPrintCount: true,
    });

    const iframe = document.getElementById('document-preview-frame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(generatePrintableHtml());
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 250);
    } else {
      // Direct window fallback
      setTimeout(() => {
        window.print();
      }, 150);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Hidden isolated iframe for standard Word-like print spooling */}
      <iframe
        id="document-preview-frame"
        ref={iframeRef}
        title="Print Document Spooler"
        style={{ position: 'fixed', right: 0, bottom: 0, width: '0px', height: '0px', border: 'none', opacity: 0 }}
      />

      {/* 1. Shopkeeper Header & Big Print Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Left: Job Code & Customer Info */}
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
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {job.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-900 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {job.customerName}
            </span>
            {job.customerPhone && (
              <>
                <span>·</span>
                <span className="font-mono">{job.customerPhone}</span>
              </>
            )}
            <span>·</span>
            <span>{job.pageCount} {job.pageCount === 1 ? 'Page' : 'Pages'}</span>
          </div>
        </div>

        {/* Right: Big Native Print Spooler Trigger Button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleIframePrint}
            disabled={isProtected}
            className="flex-1 md:flex-none px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition-all group hover:scale-[1.02]"
          >
            <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>🖨️ PRINT DOCUMENT / প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* PIN Security Barrier if Locked */}
      {isProtected ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-lg max-w-md mx-auto text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">PIN Protected Document</h3>
            <p className="text-xs text-slate-500 mt-1">
              The customer locked this document with a PIN. Ask the customer at the counter for their security passcode.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-3 pt-2">
            <input
              type="password"
              placeholder="Enter PIN Code..."
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
                Incorrect PIN. Please confirm with customer.
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
        /* Workspace: High-Visibility Print Specs + Live Canvas */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (5 cols): Print Instruction Checklist */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Print Instructions
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600">
                  Total: {job.pricing.currency}{job.pricing.totalCost.toFixed(2)}
                </span>
              </div>

              {/* Bold Spec Checklist Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl">
                  <span className="text-xs font-bold text-slate-700 uppercase">Copies Required:</span>
                  <span className="text-lg font-black text-indigo-900 font-mono">
                    {job.settings.copies} {job.settings.copies === 1 ? 'COPY' : 'COPIES'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Color Mode</div>
                    <div className="text-xs font-black text-slate-900 uppercase mt-0.5">
                      {job.settings.colorMode === 'bw' ? 'Black & White (B&W)' : 'Full Color'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Sides / Duplex</div>
                    <div className="text-xs font-black text-slate-900 uppercase mt-0.5">
                      {job.settings.duplex === 'single' ? 'Single Sided' : 'Double Sided'}
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
                  <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs space-y-1">
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
                        • Lamination Included
                      </div>
                    )}
                  </div>
                )}

                {/* Notes from customer */}
                {job.settings.notes && (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Customer Note:
                    </div>
                    <p className="font-medium text-slate-800 italic">"{job.settings.notes}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Helper Note for Shopkeeper */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-indigo-600" />
                Browser Print Integration
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                When you click "PRINT DOCUMENT", your browser's native print wizard opens. Set the destination to your connected counter printer and verify the copy count matches the specification above.
              </p>
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
