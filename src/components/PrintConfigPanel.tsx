import React from 'react';
import {
  Layers,
  Palette,
  FileCheck,
  RotateCw,
  Sparkles,
  Lock,
  MessageSquare,
  User,
  Phone,
  Clock,
  Info,
  Check,
  Minus,
  Plus,
} from 'lucide-react';
import {
  ColorMode,
  DuplexMode,
  Orientation,
  PaperSize,
  PaperWeight,
  PrintSettings,
  StapleOption,
  BindingOption,
  PricingBreakdown,
} from '../types/print';

interface PrintConfigPanelProps {
  settings: PrintSettings;
  onChange: (updated: PrintSettings) => void;
  pricing: PricingBreakdown;
  pageCount: number;
  customerName: string;
  onCustomerNameChange: (val: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (val: string) => void;
  pinCode: string;
  onPinCodeChange: (val: string) => void;
  expirationHours: number;
  onExpirationHoursChange: (val: number) => void;
}

export const PrintConfigPanel: React.FC<PrintConfigPanelProps> = ({
  settings,
  onChange,
  pricing,
  pageCount,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  pinCode,
  onPinCodeChange,
  expirationHours,
  onExpirationHoursChange,
}) => {
  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const updateFinishing = <K extends keyof PrintSettings['finishing']>(
    key: K,
    value: PrintSettings['finishing'][K]
  ) => {
    onChange({
      ...settings,
      finishing: {
        ...settings.finishing,
        [key]: value,
      },
    });
  };

  const handleCopiesStep = (delta: number) => {
    const next = Math.max(1, Math.min(100, settings.copies + delta));
    updateSetting('copies', next);
  };

  return (
    <div className="space-y-6">
      {/* 1. Quick Primary Specs (Copies, Color, Duplex) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-sm font-bold text-slate-900">Print Specifications</span>
          <span className="text-xs text-slate-500 font-mono">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'} · {settings.copies} {settings.copies === 1 ? 'copy' : 'copies'}
          </span>
        </div>

        {/* Copies Stepper */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Number of Copies</label>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleCopiesStep(-1)}
                disabled={settings.copies <= 1}
                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 rounded-lg text-slate-700 disabled:opacity-40 disabled:hover:bg-white shadow-2xs font-bold transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.copies}
                onChange={(e) => updateSetting('copies', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 text-center font-bold text-sm bg-transparent border-none focus:outline-none text-slate-900"
              />
              <button
                type="button"
                onClick={() => handleCopiesStep(1)}
                disabled={settings.copies >= 100}
                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 rounded-lg text-slate-700 disabled:opacity-40 disabled:hover:bg-white shadow-2xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto">
              {[1, 2, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateSetting('copies', num)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    settings.copies === num
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {num} {num === 1 ? 'set' : 'sets'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Color Mode Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Color Output</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => updateSetting('colorMode', 'bw')}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                settings.colorMode === 'bw'
                  ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-white text-[10px] font-bold">
                  B/W
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Black & White</div>
                  <div className="text-[11px] text-slate-500 font-mono">$0.10 / page</div>
                </div>
              </div>
              {settings.colorMode === 'bw' && <Check className="w-4 h-4 text-indigo-600" />}
            </button>

            <button
              type="button"
              onClick={() => updateSetting('colorMode', 'color')}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                settings.colorMode === 'color'
                  ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                  RGB
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Full Color</div>
                  <div className="text-[11px] text-slate-500 font-mono">$0.45 / page</div>
                </div>
              </div>
              {settings.colorMode === 'color' && <Check className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </div>

        {/* Duplex / Sides */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Print Sides (Duplex)</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => updateSetting('duplex', 'single')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                settings.duplex === 'single'
                  ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Single-Sided</div>
                <div className="text-[11px] text-slate-500">1 side per sheet</div>
              </div>
              {settings.duplex === 'single' && <Check className="w-4 h-4 text-indigo-600" />}
            </button>

            <button
              type="button"
              onClick={() => updateSetting('duplex', 'double_long')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                settings.duplex === 'double_long'
                  ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Double-Sided</div>
                <div className="text-[11px] text-slate-500">Flip on long edge</div>
              </div>
              {settings.duplex === 'double_long' && <Check className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Paper & Layout Settings */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <span className="text-sm font-bold text-slate-900 block pb-2 border-b border-slate-100">
          Paper & Finishing Options
        </span>

        <div className="grid grid-cols-2 gap-3">
          {/* Paper Size */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Paper Size</label>
            <select
              value={settings.paperSize}
              onChange={(e) => updateSetting('paperSize', e.target.value as PaperSize)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="A4">A4 Standard (210 × 297 mm)</option>
              <option value="Letter">US Letter (8.5 × 11 in)</option>
              <option value="Legal">Legal (8.5 × 14 in)</option>
              <option value="A3">A3 Oversize (297 × 420 mm)</option>
              <option value="4x6_Photo">4×6 Photo Gloss Card</option>
            </select>
          </div>

          {/* Paper Weight / Stock */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Paper Quality</label>
            <select
              value={settings.finishing.paperWeight}
              onChange={(e) => updateFinishing('paperWeight', e.target.value as PaperWeight)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="standard_75gsm">Standard Plain (75-80 gsm)</option>
              <option value="heavy_100gsm">Premium Heavy (100 gsm) +$0.08</option>
              <option value="cardstock_200gsm">Thick Cardstock (200 gsm) +$0.25</option>
              <option value="glossy_photo">High-Gloss Photo (250 gsm) +$0.40</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Staple Option */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Staple</label>
            <select
              value={settings.finishing.staple}
              onChange={(e) => updateFinishing('staple', e.target.value as StapleOption)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="none">No Staple</option>
              <option value="top_left">Top-Left Corner ($0.05)</option>
              <option value="top_right">Top-Right Corner ($0.05)</option>
              <option value="two_left">Two Staples on Left Edge ($0.10)</option>
              <option value="booklet">Center Saddle Stitch ($0.30)</option>
            </select>
          </div>

          {/* Binding Option */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Binding</label>
            <select
              value={settings.finishing.binding}
              onChange={(e) => updateFinishing('binding', e.target.value as BindingOption)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="none">No Binding</option>
              <option value="spiral_coil">Spiral Coil Ring ($2.50)</option>
              <option value="thermal">Thermal Book Binding ($3.50)</option>
              <option value="comb">Plastic Comb Binding ($1.80)</option>
              <option value="hardcover">Executive Hardcover ($7.00)</option>
            </select>
          </div>
        </div>

        {/* Lamination Toggle */}
        <label className="flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors border border-slate-200/80">
          <input
            type="checkbox"
            checked={settings.finishing.lamination}
            onChange={(e) => updateFinishing('lamination', e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <div className="flex-1">
            <span className="text-xs font-bold text-slate-900">Add Clear Heat Lamination</span>
            <span className="text-[11px] text-slate-500 block leading-tight">
              Protective waterproof plastic seal (+$1.00 / page)
            </span>
          </div>
        </label>
      </div>

      {/* 3. Customer Info, Shop Instructions & Security */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <span className="text-sm font-bold text-slate-900 block pb-2 border-b border-slate-100">
          Customer & Security Details
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Your Name (For Order Pickup)
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Morgan"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Phone / WhatsApp (Optional)
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={customerPhone}
              onChange={(e) => onCustomerPhoneChange(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Optional PIN Lock */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Security PIN Lock (Optional)
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Shopkeeper enters PIN to open</span>
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder="e.g. 4821 (Leave blank for public link)"
            value={pinCode}
            onChange={(e) => onPinCodeChange(e.target.value.replace(/\D/g, ''))}
            className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Special Instructions */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            Special Instructions for Shopkeeper
          </label>
          <textarea
            rows={2}
            placeholder="e.g., Please trim margins, staple on top-left, call when printed..."
            value={settings.notes}
            onChange={(e) => updateSetting('notes', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 4. Real-Time Transparent Price Estimator Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Estimated Cost</span>
          <span className="text-xs text-slate-400">Pay at counter or online</span>
        </div>

        <div className="space-y-1.5 text-xs text-slate-300 font-mono">
          <div className="flex justify-between">
            <span>Base Printing ({pageCount}p × {settings.copies}c):</span>
            <span className="text-white">${pricing.basePageCost.toFixed(2)}</span>
          </div>

          {pricing.paperUpgradeCost > 0 && (
            <div className="flex justify-between text-indigo-200">
              <span>Paper Stock Upgrade:</span>
              <span>+${pricing.paperUpgradeCost.toFixed(2)}</span>
            </div>
          )}

          {pricing.bindingCost > 0 && (
            <div className="flex justify-between text-indigo-200">
              <span>Binding ({settings.finishing.binding}):</span>
              <span>+${pricing.bindingCost.toFixed(2)}</span>
            </div>
          )}

          {pricing.stapleCost > 0 && (
            <div className="flex justify-between text-indigo-200">
              <span>Stapling:</span>
              <span>+${pricing.stapleCost.toFixed(2)}</span>
            </div>
          )}

          {pricing.laminationCost > 0 && (
            <div className="flex justify-between text-indigo-200">
              <span>Lamination:</span>
              <span>+${pricing.laminationCost.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-400 text-[11px] pt-1">
            <span>Sales Tax (8%):</span>
            <span>${pricing.tax.toFixed(2)}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/15 flex items-baseline justify-between">
          <span className="text-sm font-bold text-white">Estimated Total:</span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono">
            ${pricing.totalCost.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
