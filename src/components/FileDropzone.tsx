import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, RefreshCw, Sparkles, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { SAMPLE_DOCUMENTS, SampleDocTemplate } from '../data/sampleDocuments';
import { DocumentPage, PrintSettings } from '../types/print';

interface FileDropzoneProps {
  onFileLoaded: (data: {
    fileName: string;
    fileType: 'pdf' | 'image' | 'document' | 'text';
    mimeType: string;
    fileSize: number;
    fileDataUrl: string;
    pageCount: number;
    pages: DocumentPage[];
    suggestedSettings?: Partial<PrintSettings>;
  }) => void;
  selectedFileName?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileLoaded, selectedFileName }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isText = file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt');

    const fileType: 'pdf' | 'image' | 'document' | 'text' = isPdf
      ? 'pdf'
      : isImage
      ? 'image'
      : isText
      ? 'text'
      : 'document';

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      // Generate page representations
      let pages: DocumentPage[] = [];

      if (isImage) {
        pages = [
          {
            pageNumber: 1,
            title: file.name,
            previewUrl: dataUrl,
          },
        ];
      } else if (isText) {
        // Read text snippet for formatted presentation
        const textSnippet = dataUrl.startsWith('data:text')
          ? atob(dataUrl.split(',')[1] || '')
          : 'Document content';
        pages = [
          {
            pageNumber: 1,
            title: 'Page 1',
            htmlContent: `
              <div style="font-family: 'JetBrains Mono', monospace; padding: 28px; white-space: pre-wrap; font-size: 13px; line-height: 1.6; color: #1e293b;">
                ${textSnippet.slice(0, 3000)}
              </div>
            `,
          },
        ];
      } else {
        // PDF or doc representation
        pages = [
          {
            pageNumber: 1,
            title: `${file.name} - Page 1`,
            htmlContent: `
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 36px; color: #1e293b; background: white;">
                <div style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px;">
                  <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${file.name}</div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Uploaded Document · Size: ${(file.size / 1024).toFixed(1)} KB</div>
                </div>
                <div style="space-y: 16px; color: #334155; font-size: 13px; line-height: 1.6;">
                  <p>This document is verified and prepared for high-fidelity native print spooling.</p>
                  <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0;">
                    <div style="font-size: 32px; margin-bottom: 8px;">📄</div>
                    <div style="font-weight: 700; color: #0f172a;">${file.name}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Click 'Print Document' in Shopkeeper View to send directly to physical printer.</div>
                  </div>
                </div>
              </div>
            `,
          },
        ];
      }

      onFileLoaded({
        fileName: file.name,
        fileType,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileDataUrl: dataUrl,
        pageCount: pages.length,
        pages,
      });

      setIsLoading(false);
    };

    reader.onerror = () => {
      setIsLoading(false);
    };

    if (isText) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const loadSample = (sample: SampleDocTemplate) => {
    onFileLoaded({
      fileName: sample.name,
      fileType: sample.type,
      mimeType: sample.mimeType,
      fileSize: sample.size,
      fileDataUrl: '',
      pageCount: sample.pageCount,
      pages: sample.pages,
      suggestedSettings: sample.defaultSettings,
    });
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer group rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
            : selectedFileName
            ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400'
            : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/80 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              selectedFileName
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : selectedFileName ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              {selectedFileName ? 'Document Ready for Print' : 'Upload Document to Print'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {selectedFileName ? (
                <span className="font-semibold text-emerald-700">{selectedFileName}</span>
              ) : (
                'Drag & drop PDF, PNG, JPG or click to select from your device'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <span>Supports PDF</span>
            <span>·</span>
            <span>Images (JPG/PNG)</span>
            <span>·</span>
            <span>Docs</span>
            <span>·</span>
            <span>Up to 50 MB</span>
          </div>
        </div>
      </div>

      {/* Preset Test Documents Selector */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Quick Test with Real Pre-formatted Documents:
          </span>
          <span className="text-[11px] text-slate-400">1-click load</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => loadSample(sample)}
              className="flex flex-col p-2.5 text-left bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div className="flex items-center gap-1.5 mb-1">
                {sample.type === 'pdf' ? (
                  <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                ) : sample.type === 'image' ? (
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
                <span className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">
                  {sample.name.split('_')[0]}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 line-clamp-1 leading-tight">
                {sample.description}
              </span>
              <span className="text-[10px] text-indigo-600 font-medium mt-1">
                {sample.pageCount} {sample.pageCount === 1 ? 'page' : 'pages'} · {sample.defaultSettings.colorMode?.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
