import React, { useState } from 'react';
import {
  Printer,
  UploadCloud,
  ListFilter,
  Sliders,
  Search,
  ArrowRight,
  ShieldCheck,
  Lock,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'admin' | 'shop' | 'queue' | 'test-pattern';
  onViewChange: (view: 'admin' | 'shop' | 'queue' | 'test-pattern') => void;
  activeJobId: string | null;
  onSearchJob: (query: string) => void;
  queueCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  activeJobId,
  onSearchJob,
  queueCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchJob(searchQuery.trim());
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onViewChange('admin')}
              className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                  PrintBridge
                </span>
                <span className="text-[11px] font-medium text-slate-500 block leading-none">
                  Private Personal Print Service
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 text-xs font-semibold">
            <button
              onClick={() => onViewChange('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                currentView === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Upload (/admin)</span>
            </button>

            <button
              onClick={() => onViewChange('shop')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                currentView === 'shop'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Shopkeeper Link (/print)</span>
              {activeJobId && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              )}
            </button>

            <button
              onClick={() => onViewChange('queue')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                currentView === 'queue'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Queue & Logs</span>
              {queueCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 rounded-full">
                  {queueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onViewChange('test-pattern')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                currentView === 'test-pattern'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Printer Test Pattern</span>
            </button>
          </nav>

          {/* Zone 3: Search / Fast Lookup */}
          <div className="flex items-center gap-2 sm:gap-3">
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Lookup Token (e.g. PRN-9482)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 lg:w-56 pl-8 pr-7 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-indigo-600 rounded"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Lookup Print Job"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => onViewChange('shop')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-300" />
              <span>Shop View</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        {isSearchOpen && (
          <div className="sm:hidden py-3 border-t border-slate-100">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Code e.g. PRN-9482"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
              >
                Find
              </button>
            </form>
          </div>
        )}

        {/* Mobile View Switcher */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 text-xs font-medium text-slate-600 overflow-x-auto">
          <button
            onClick={() => onViewChange('admin')}
            className={`px-3 py-1 rounded-md ${currentView === 'admin' ? 'bg-indigo-50 text-indigo-700 font-semibold' : ''}`}
          >
            Admin
          </button>
          <button
            onClick={() => onViewChange('shop')}
            className={`px-3 py-1 rounded-md ${currentView === 'shop' ? 'bg-indigo-50 text-indigo-700 font-semibold' : ''}`}
          >
            Shop View
          </button>
          <button
            onClick={() => onViewChange('queue')}
            className={`px-3 py-1 rounded-md ${currentView === 'queue' ? 'bg-indigo-50 text-indigo-700 font-semibold' : ''}`}
          >
            Queue ({queueCount})
          </button>
          <button
            onClick={() => onViewChange('test-pattern')}
            className={`px-3 py-1 rounded-md ${currentView === 'test-pattern' ? 'bg-indigo-50 text-indigo-700 font-semibold' : ''}`}
          >
            Test Sheet
          </button>
        </div>
      </div>
    </header>
  );
};
