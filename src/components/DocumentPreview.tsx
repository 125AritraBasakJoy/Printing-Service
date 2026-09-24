import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, ChevronLeft, ChevronRight, Eye, FileText, CheckCircle2 } from 'lucide-react';
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

  return (
    <div
      className={`flex flex-col bg-slate-900/95 rounded-2xl border border-slate-800 shadow-xl overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl ring-1 ring-white/10' : className
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 text-xs text-slate-300">
        <div className="flex items-center gap-2 truncate max-w-[260px] sm:max-w-md">
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
              filter: getGrayscaleFilter(),
            }}
          >
            {/* If we have direct page HTML snippet */}
            {currentPage?.htmlContent ? (
              <div
                className="w-full h-full text-left"
                dangerouslySetInnerHTML={{ __html: currentPage.htmlContent }}
              />
            ) : fileDataUrl ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={fileDataUrl}
                  alt={fileName || 'Document preview'}
                  className="printable-image max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              /* Generic document fallback presentation */
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
