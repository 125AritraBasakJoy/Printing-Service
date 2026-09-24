import React, { useState } from 'react';
import {
  Printer,
  ListFilter,
  Sliders,
  Search,
  ArrowRight,
  ShieldCheck,
  Lock,
  LogOut,
  ArrowLeft,
} from 'lucide-react';

export type AppRoute = 'admin' | 'shop' | 'queue' | 'test-pattern';

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute, jobId?: string) => void;
  activeJobId: string | null;
  activeJobShortCode?: string;
  onSearchJob: (query: string) => void;
  queueCount: number;
  isAdminAuthenticated?: boolean;
  onLogoutAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  activeJobId,
  activeJobShortCode,
  onSearchJob,
  queueCount,
  isAdminAuthenticated = false,
  onLogoutAdmin,
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

  const isAdminView = currentRoute === 'admin';
  const isShopView = currentRoute === 'shop';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors no-print shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & Terminal Identifier */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(isAdminView ? 'admin' : 'shop')}
              className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                    BD Print Bridge
                  </span>
                  {isAdminView ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-md uppercase tracking-wider">
                      Admin Panel
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-md uppercase tracking-wider">
                      Shop Terminal
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-slate-500 block leading-none">
                  {isAdminView
                    ? 'Private Document Dispatcher'
                    : 'Zero-Footprint Browser Spooler'}
                </span>
              </div>
            </button>
          </div>

          {/* Right Action Hub: Clean, uncluttered actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* If in Shop view: Search Input */}
            {!isAdminView && (
              <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Enter Token (e.g. PRN-XXXX)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 lg:w-56 pl-8 pr-7 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400 uppercase"
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
            )}

            {/* Mobile search toggle */}
            {!isAdminView && (
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                title="Lookup Print Job"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* If currently in Queue or Test Pattern, provide "Back to Print Terminal" */}
            {!isAdminView && !isShopView && (
              <button
                onClick={() => onNavigate('shop')}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Print Station</span>
              </button>
            )}

            {/* Shopkeeper Utility: Queue Button */}
            {!isAdminView && isShopView && (
              <button
                onClick={() => onNavigate('queue')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors flex items-center gap-1.5"
                title="View Print Queue"
              >
                <ListFilter className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Queue</span>
                {queueCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-indigo-600 text-white rounded-full">
                    {queueCount}
                  </span>
                )}
              </button>
            )}

            {/* Shopkeeper Utility: Printer Test Pattern Button */}
            {!isAdminView && isShopView && (
              <button
                onClick={() => onNavigate('test-pattern')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors flex items-center gap-1.5"
                title="Print Test Sheet"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Test Sheet</span>
              </button>
            )}

            {/* In Admin view: Lock Admin button */}
            {isAdminView && (
              <button
                onClick={onLogoutAdmin}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors border border-slate-200 flex items-center gap-1.5 whitespace-nowrap"
                title="Lock Admin Panel"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lock Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        {isSearchOpen && !isAdminView && (
          <div className="sm:hidden py-3 border-t border-slate-100">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Code e.g. PRN-XXXX"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
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
      </div>
    </header>
  );
};
