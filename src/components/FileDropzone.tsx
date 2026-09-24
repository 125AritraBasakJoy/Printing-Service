import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, RefreshCw } from 'lucide-react';
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
    rawFile?: File;
    suggestedSettings?: Partial<PrintSettings>;
  }) => void;
  selectedFileName?: string;
}

// Scanned PDF JPEG stream extractor (CamScanner, Adobe Scan, phone scanners)
function extractJpegsFromPdf(uint8Array: Uint8Array): string[] {
  const images: string[] = [];
  const len = uint8Array.length;
  let i = 0;
  while (i < len - 3) {
    // Look for JPEG SOI marker (0xFF, 0xD8, 0xFF)
    if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xD8 && uint8Array[i + 2] === 0xFF) {
      const start = i;
      let end = -1;
      let j = start + 3;
      while (j < len - 1) {
        // Look for JPEG EOI marker (0xFF, 0xD9)
        if (uint8Array[j] === 0xFF && uint8Array[j + 1] === 0xD9) {
          end = j + 2;
          break;
        }
        j++;
      }
      if (end !== -1 && end - start > 1024) {
        const chunk = uint8Array.subarray(start, end);
        let binary = '';
        const chunkSize = 8192;
        for (let k = 0; k < chunk.length; k += chunkSize) {
          const slice = chunk.subarray(k, Math.min(k + chunkSize, chunk.length));
          binary += String.fromCharCode.apply(null, Array.from(slice));
        }
        images.push('data:image/jpeg;base64,' + btoa(binary));
        i = end;
        continue;
      }
    }
    i++;
  }
  return images;
}

// Extract page count from PDF catalog
function getPdfPageCount(uint8Array: Uint8Array): number {
  try {
    const decoder = new TextDecoder('latin1');
    const text = decoder.decode(uint8Array);
    const countMatch = text.match(/\/Count\s+(\d+)/);
    if (countMatch && parseInt(countMatch[1], 10) > 0) {
      return parseInt(countMatch[1], 10);
    }
    const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
    return pageMatches && pageMatches.length > 0 ? pageMatches.length : 1;
  } catch {
    return 1;
  }
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

  const processFile = async (file: File) => {
    setIsLoading(true);

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

    try {
      if (isPdf) {
        // Read as ArrayBuffer to extract embedded scanned images & page count
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const extractedJpegs = extractJpegsFromPdf(uint8Array);
        const parsedPagesCount = getPdfPageCount(uint8Array);

        // Also convert to DataURL for iframe / raw download
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = (e.target?.result as string) || '';

          let pages: DocumentPage[] = [];

          if (extractedJpegs.length > 0) {
            // High-fidelity scanned PDF pages (CamScanner, Adobe Scan, etc.)
            pages = extractedJpegs.map((imgUrl, idx) => ({
              pageNumber: idx + 1,
              title: `Page ${idx + 1}`,
              previewUrl: imgUrl,
            }));
          } else {
            // Vector PDF
            pages = Array.from({ length: Math.max(1, parsedPagesCount) }, (_, idx) => ({
              pageNumber: idx + 1,
              title: `Page ${idx + 1}`,
              previewUrl: dataUrl,
            }));
          }

          onFileLoaded({
            fileName: file.name,
            fileType: 'pdf',
            mimeType: 'application/pdf',
            fileSize: file.size,
            fileDataUrl: dataUrl,
            pageCount: pages.length,
            pages,
            rawFile: file,
            suggestedSettings: {
              copies: 1,
            },
          });

          setIsLoading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = (e.target?.result as string) || '';
          const pages: DocumentPage[] = [
            {
              pageNumber: 1,
              title: file.name,
              previewUrl: dataUrl,
            },
          ];

          onFileLoaded({
            fileName: file.name,
            fileType: 'image',
            mimeType: file.type || 'image/jpeg',
            fileSize: file.size,
            fileDataUrl: dataUrl,
            pageCount: 1,
            pages,
            rawFile: file,
          });

          setIsLoading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      if (isText) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = (e.target?.result as string) || '';
          const textSnippet = dataUrl.startsWith('data:text')
            ? atob(dataUrl.split(',')[1] || '')
            : 'Document content';

          const pages: DocumentPage[] = [
            {
              pageNumber: 1,
              title: 'Page 1',
              htmlContent: `
                <div style="font-family: 'JetBrains Mono', monospace; padding: 28px; white-space: pre-wrap; font-size: 13px; line-height: 1.6; color: #1e293b;">
                  ${textSnippet.slice(0, 4000)}
                </div>
              `,
            },
          ];

          onFileLoaded({
            fileName: file.name,
            fileType: 'text',
            mimeType: file.type || 'text/plain',
            fileSize: file.size,
            fileDataUrl: dataUrl,
            pageCount: 1,
            pages,
            rawFile: file,
          });

          setIsLoading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Default binary fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        onFileLoaded({
          fileName: file.name,
          fileType,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileDataUrl: dataUrl,
          pageCount: 1,
          pages: [
            {
              pageNumber: 1,
              title: file.name,
              previewUrl: dataUrl,
            },
          ],
          rawFile: file,
        });
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing uploaded file:', err);
      setIsLoading(false);
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
    </div>
  );
};
