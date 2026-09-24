import React, { useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, ChevronLeft, ChevronRight, Eye, FileText, CheckCircle2, ExternalLink } from 'lucide-react';
import { ColorMode, DocumentPage, Orientation, PaperSize } from '../types/print';

interface DocumentPreviewProps {
  fileName: string;
  fileType: 'pdf' | 'image' | 'document' | 'text';
  fileDataUrl?: string;
  pages: DocumentPage[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  colorMode: ColorMode;
  paperSize: PaperSize;
  orientation: Orientation;
  className?: string;
  allowFullscreen?: boolean;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  fileName,
  fileType,
  fileDataUrl,
  pages,
  currentPageIndex,
  onPageChange,
  colorMode,
  paperSize,
  orientation,
  className = '',
  allowFullscreen = true,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const totalPages = Math.max(1, pages.length);
  const currentPage = pages[currentPageIndex] || pages[0];

  // Convert base64 dataUrl to Blob URL for clean browser embedding without data URI sandbox blocks
  const blobUrl = useMemo(() => {
    if (!fileDataUrl) return '';
    if (fileDataUrl.startsWith('blob:')) return fileDataUrl;
    if (fileDataUrl.startsWith('data:')) {
      try {
        const parts = fileDataUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.error('Error generating Blob URL from dataUrl:', e);
        return fileDataUrl;
      }
    }
    return fileDataUrl;
  }, [fileDataUrl]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 175));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 60));
  const handleResetZoom = () => setZoomLevel(100);
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Determine aspect ratio class / dimensions based on paper size and orientation
  const isLandscape = orientation === 'landscape';

  const getGrayscaleFilter = () => {
    if (colorMode === 'bw') {
      return 'grayscale(100%) contrast(115%) brightness(98%)';
    }
    if (colorMode === 'grayscale') {
      return 'grayscale(100%)';
    }
    return 'none';
  };

  const isExtractedImagePage =
    !!currentPage?.previewUrl &&
    (currentPage.previewUrl.startsWith('data:image/') || currentPage.previewUrl.startsWith('blob:'));

  return (
    <div
      className={`flex flex-col bg-slate-900/95 rounded-2xl border border-slate-800 shadow-xl overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl ring-1 ring-white/10' : className
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 text-xs text-slate-300">
        <div className="flex items-center gap-2 truncate max-w-[240px] sm:max-w-md">
          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-medium text-slate-200 truncate">{fileName || 'Untitled Document'}</span>
          <span className="text-slate-500 font-mono text-[11px] shrink-0">
            · {paperSize} {isLandscape ? 'Landscape' : 'Portrait'}
          </span>
        </div>

        {/* Zoom, Rotate, Page Navigation Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Page Counter & Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60 mr-1">
              <button
                type="button"
                disabled={currentPageIndex === 0}
                onClick={() => onPageChange(currentPageIndex - 1)}
                className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-slate-300 px-1">
                {currentPageIndex + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPageIndex >= totalPages - 1}
                onClick={() => onPageChange(currentPageIndex + 1)}
                className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 py-0.5 font-mono text-[11px] text-slate-300 hover:text-white"
              title="Reset Zoom"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 bg-slate-800/80 border border-slate-700/60 rounded-lg"
            title="Rotate 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Pop out into new tab for full inspection */}
          {(blobUrl || isExtractedImagePage) && (
            <button
              type="button"
              onClick={() => {
                const target = isExtractedImagePage ? currentPage.previewUrl : blobUrl;
                if (target) window.open(target, '_blank');
              }}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 bg-slate-800/80 border border-slate-700/60 rounded-lg flex items-center gap-1"
              title="Open full document in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {allowFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 bg-slate-800/80 border border-slate-700/60 rounded-lg"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Viewport */}
      <div className="relative flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center min-h-[380px] max-h-[620px] bg-slate-950/60">
        {!fileName && pages.length === 0 ? (
          <div className="text-center p-8 text-slate-400 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
              <FileText className="w-7 h-7 text-indigo-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">No Document Uploaded</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Upload a document above to see high-fidelity preview and print simulation.
            </p>
          </div>
        ) : (
          <div
            className="transition-transform duration-200 ease-out origin-center select-none"
            style={{
              transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
            }}
          >
            {/* Printable Page Sheet Container */}
            <div
              className="printable-page relative bg-white text-slate-900 rounded-sm shadow-2xl overflow-hidden transition-all duration-300"
              style={{
                width: isLandscape ? '760px' : '560px',
                minHeight: isLandscape ? '540px' : '740px',
                filter: fileType === 'pdf' && !isExtractedImagePage ? 'none' : getGrayscaleFilter(),
              }}
            >
            {/* 1. Scanned PDF Page / Image Preview */}
            {isExtractedImagePage ? (
              <div className="w-full h-full flex items-center justify-center p-4 bg-white min-h-[540px] sm:min-h-[700px]">
                <img
                  src={currentPage.previewUrl}
                  alt={currentPage.title || fileName || 'Document preview'}
                  className="printable-image max-w-full max-h-full object-contain mx-auto"
                  style={{ filter: getGrayscaleFilter() }}
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : fileType === 'image' && fileDataUrl ? (
              /* 2. Direct Image File Preview */
              <div className="w-full h-full flex items-center justify-center p-4 bg-white min-h-[540px] sm:min-h-[700px]">
                <img
                  src={fileDataUrl}
                  alt={fileName || 'Document preview'}
                  className="printable-image max-w-full max-h-full object-contain mx-auto"
                  style={{ filter: getGrayscaleFilter() }}
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : fileType === 'pdf' && (blobUrl || fileDataUrl) ? (
              /* 3. Real Vector PDF Document Object/Iframe with Blob URL */
              <div className="w-full h-full min-h-[540px] sm:min-h-[700px] flex flex-col bg-slate-100">
                <object
                  data={`${blobUrl || fileDataUrl}#toolbar=0&navpanes=0`}
                  type="application/pdf"
                  className="w-full h-full min-h-[540px] sm:min-h-[700px] border-0 bg-white"
                >
                  <iframe
                    src={`${blobUrl || fileDataUrl}#toolbar=0&navpanes=0`}
                    title={fileName || 'PDF Preview'}
                    className="w-full h-full min-h-[540px] sm:min-h-[700px] border-0 bg-white"
                  />
                </object>
              </div>
            ) : currentPage?.htmlContent ? (
              /* 4. Formatted Document / Text */
              <div
                className="w-full h-full text-left"
                dangerouslySetInnerHTML={{ __html: currentPage.htmlContent }}
              />
            ) : (
              /* 5. Generic document fallback presentation */
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between border-b pb-4 border-slate-200">
                  <div className="space-y-1">
                    <div className="h-6 w-48 bg-slate-800 rounded"></div>
                    <div className="h-3 w-32 bg-slate-400 rounded"></div>
                  </div>
                  <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                    P
                  </div>
                </div>
                <div className="space-y-2 pt-4">
                  <div className="h-3 w-full bg-slate-200 rounded"></div>
                  <div className="h-3 w-11/12 bg-slate-200 rounded"></div>
                  <div className="h-3 w-4/5 bg-slate-200 rounded"></div>
                  <div className="h-3 w-full bg-slate-200 rounded"></div>
                  <div className="h-3 w-3/4 bg-slate-200 rounded"></div>
                </div>
                <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div className="h-20 bg-slate-50 border rounded p-2"></div>
                  <div className="h-20 bg-slate-50 border rounded p-2"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Bottom Status / Mode bar */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Spooler Ready</span>
          </span>
          <span className="text-slate-600">·</span>
          <span>Simulation Mode: <strong className="text-slate-300 uppercase">{colorMode}</strong></span>
        </div>
        <div className="font-mono text-slate-400">
          Page {currentPageIndex + 1} of {totalPages}
        </div>
      </div>
    </div>
  );
};
