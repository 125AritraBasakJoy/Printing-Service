import React, { useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Share2,
  Clock,
  Printer,
  ShieldAlert,
  ArrowRight,
  FileCheck,
  RefreshCw,
  Send,
  Download,
} from 'lucide-react';
import { PrintJob } from '../types/print';
import { QrCodeView } from './QrCodeView';

interface ShareSuccessCardProps {
  job: PrintJob;
  onOpenShopView?: (jobId: string) => void;
  onNewUpload: () => void;
}

export const ShareSuccessCard: React.FC<ShareSuccessCardProps> = ({
  job,
  onOpenShopView,
  onNewUpload,
}) => {
  const [copied, setCopied] = useState(false);
  const [showFullQr, setShowFullQr] = useState(false);

  // Build the clean shopkeeper shareable URL (/print/:id)
  const shareUrl = `${window.location.origin}/print/${job.shortCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hello! Here is my print document (${job.fileName}, ${job.settings.copies} ${job.settings.copies === 1 ? 'copy' : 'copies'}, ${job.settings.colorMode.toUpperCase()}): ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDownloadToken = () => {
    // Generate a printable token summary sheet
    const tokenHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Token - ${job.shortCode}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #111; max-width: 500px; margin: 0 auto; border: 2px dashed #333; }
          h1 { margin: 0 0 8px 0; font-size: 24px; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 2px; color: #4338ca; font-family: monospace; }
          .meta { margin: 16px 0; font-size: 14px; line-height: 1.6; }
          .spec { background: #f4f4f5; padding: 12px; border-radius: 6px; margin: 16px 0; }
        </style>
      </head>
      <body>
        <h1>PrintBridge Token Slip</h1>
        <div class="code">${job.shortCode}</div>
        <div class="meta">
          <div><strong>Customer:</strong> ${job.customerName || 'Customer'}</div>
          <div><strong>File:</strong> ${job.fileName}</div>
          <div><strong>Uploaded:</strong> ${new Date(job.uploadedAt).toLocaleString()}</div>
          ${job.pinCode ? `<div><strong>PIN Code:</strong> ${job.pinCode}</div>` : ''}
        </div>
        <div class="spec">
          <div><strong>Copies:</strong> ${job.settings.copies}</div>
          <div><strong>Color:</strong> ${job.settings.colorMode.toUpperCase()}</div>
          <div><strong>Sides:</strong> ${job.settings.duplex}</div>
          <div><strong>Paper:</strong> ${job.settings.paperSize} (${job.settings.finishing.paperWeight})</div>
          <div><strong>Finishing:</strong> Staple: ${job.settings.finishing.staple} | Binding: ${job.settings.finishing.binding}</div>
          <div><strong>Total Cost:</strong> $${job.pricing.totalCost.toFixed(2)}</div>
        </div>
        <p style="font-size: 12px; color: #666;">Present this token or QR code to the shopkeeper at the counter.</p>
      </body>
      </html>
    `;
    const blob = new Blob([tokenHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) {
      setTimeout(() => {
        w.print();
      }, 500);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header with success badge */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-semibold">
          <FileCheck className="w-3.5 h-3.5" />
          <span>Document Ready for Shopkeeper</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Print Link & QR Generated
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Show this QR code or send the link to your print shopkeeper to print immediately.
        </p>
      </div>

      {/* Primary Token Code & QR Card */}
      <div className="bg-gradient-to-b from-slate-50 to-indigo-50/30 rounded-2xl p-6 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-6 justify-between">
        
        {/* Left: Token Code & Details */}
        <div className="space-y-3 text-center sm:text-left flex-1">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Job Token Code
            </span>
            <div className="text-3xl font-extrabold text-indigo-700 font-mono tracking-wider">
              {job.shortCode}
            </div>
            {job.pinCode && (
              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-xs font-mono">
                <ShieldAlert className="w-3 h-3" />
                <span>PIN Lock: <strong>{job.pinCode}</strong></span>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-600 space-y-0.5">
            <div><strong>File:</strong> {job.fileName}</div>
            <div>
              <strong>Print:</strong> {job.settings.copies} {job.settings.copies === 1 ? 'copy' : 'copies'} · {job.settings.colorMode.toUpperCase()} · {job.settings.paperSize}
            </div>
            <div><strong>Cost:</strong> ${job.pricing.totalCost.toFixed(2)}</div>
          </div>
        </div>

        {/* Right: Crisp QR Code */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <QrCodeView value={shareUrl} size={140} />
          <span className="text-[11px] font-semibold text-slate-500">Scan at Counter</span>
        </div>
      </div>

      {/* Share Link Input Box */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">Direct Shopkeeper Link</label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 select-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {/* Preview Shopkeeper Link in New Tab */}
        <button
          type="button"
          onClick={() => window.open(shareUrl, '_blank')}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 group"
        >
          <ExternalLink className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>Preview Shop Link (New Tab)</span>
        </button>

        {/* WhatsApp Share */}
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>Send via WhatsApp</span>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
        <button
          type="button"
          onClick={handleDownloadToken}
          className="hover:text-indigo-600 font-medium flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Print Counter Token Slip</span>
        </button>

        <button
          type="button"
          onClick={onNewUpload}
          className="hover:text-indigo-600 font-medium flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Upload Another File</span>
        </button>
      </div>
    </div>
  );
};
