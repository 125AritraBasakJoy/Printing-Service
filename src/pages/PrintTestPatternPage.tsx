import React from 'react';
import { Printer, Sliders, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

export const PrintTestPatternPage: React.FC = () => {
  const handlePrintTest = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            Printer Calibration & Alignment Test Sheet
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Print this sheet to test print head alignment, CMYK color balance, and font legibility.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrintTest}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Test Sheet</span>
        </button>
      </div>

      {/* Test Pattern Sheet Viewport */}
      <div className="printable-page bg-white p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-md text-slate-900 space-y-8 font-mono">
        
        {/* Header with Crosshairs */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <div className="text-lg font-black tracking-wider">PRINTBRIDGE · PRINTER DIAGNOSTIC SUITE</div>
            <div className="text-[11px] text-slate-600 font-sans">
              Resolution: 600/1200 DPI Verification · CMYK & Grayscale Gamut Matrix
            </div>
          </div>
          <div className="text-right text-xs font-bold">
            <div>TARGET: ISO/IEC 24712</div>
            <div className="text-slate-500 font-normal">Date: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* 1. Alignment Crosshairs */}
        <div className="grid grid-cols-4 gap-4 text-center py-2">
          {['Top-Left (TL)', 'Top-Center (TC)', 'Top-Right (TR)', 'Center Grid'].map((lbl, idx) => (
            <div key={idx} className="border border-slate-400 p-3 rounded text-center">
              <div className="w-8 h-8 mx-auto border border-dashed border-slate-800 rounded-full flex items-center justify-center text-xs font-bold">
                +
              </div>
              <div className="text-[10px] text-slate-500 mt-2 font-sans font-semibold">{lbl}</div>
            </div>
          ))}
        </div>

        {/* 2. CMYK Primary Gamut Swatches */}
        <div className="space-y-2">
          <div className="text-xs font-bold font-sans uppercase tracking-wider text-slate-700">
            1. Primary Process Colors (CMYK Gamut)
          </div>
          <div className="grid grid-cols-4 gap-3 text-white text-xs font-bold text-center">
            <div className="bg-cyan-500 p-4 rounded shadow-2xs">CYAN (100%)</div>
            <div className="bg-pink-500 p-4 rounded shadow-2xs">MAGENTA (100%)</div>
            <div className="bg-amber-400 p-4 rounded shadow-2xs text-slate-900">YELLOW (100%)</div>
            <div className="bg-black p-4 rounded shadow-2xs">KEY / BLACK (100%)</div>
          </div>
        </div>

        {/* 3. Grayscale Gradient Step Ladder */}
        <div className="space-y-2">
          <div className="text-xs font-bold font-sans uppercase tracking-wider text-slate-700">
            2. Grayscale Dynamic Range (10% Increment Steps)
          </div>
          <div className="grid grid-cols-10 gap-1 text-[9px] text-center font-bold">
            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((step) => (
              <div key={step} className="space-y-1">
                <div
                  className="h-10 rounded-xs border border-slate-200"
                  style={{
                    backgroundColor: `rgba(0, 0, 0, ${step / 100})`,
                  }}
                />
                <div className="text-slate-600">{step}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Font Resolution & Sharpness Ladder */}
        <div className="space-y-3 font-sans border-t border-slate-200 pt-4">
          <div className="text-xs font-bold font-sans uppercase tracking-wider text-slate-700">
            3. Font Rendering & Edge Sharpness Test
          </div>
          <div className="space-y-1 text-slate-900">
            <div className="text-[7px]">7pt: The quick brown fox jumps over the lazy dog. 1234567890 (Microprint)</div>
            <div className="text-[8px]">8pt: The quick brown fox jumps over the lazy dog. 1234567890</div>
            <div className="text-[10px]">10pt: The quick brown fox jumps over the lazy dog. 1234567890</div>
            <div className="text-[12px] font-semibold">12pt: The quick brown fox jumps over the lazy dog. 1234567890</div>
            <div className="text-[16px] font-bold">16pt: The quick brown fox jumps over the lazy dog.</div>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t-2 border-slate-900 pt-4 flex justify-between text-[10px] text-slate-500 font-sans">
          <div>PrintBridge Verification System · Native Spool Spooler Ready</div>
          <div>All test lines must appear sharp with no banding or bleed.</div>
        </div>
      </div>
    </div>
  );
};
