import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onLoginSuccess?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, onLoginSuccess }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(api.checkAuth());
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (api.login(password)) {
      setIsAuthenticated(true);
      setError('');
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setError('Invalid passcode. Default is "admin".');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Private Admin Panel
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            This section is your private upload bridge. Enter your admin password to upload documents and generate shop links.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Admin Passcode</span>
              <span className="text-[11px] text-indigo-600 font-normal">Default: <strong className="font-mono">admin</strong></span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter admin password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoFocus
                className="w-full pl-4 pr-10 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                <span>⚠️ {error}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 group"
          >
            <span>Unlock Admin Panel</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        {/* Security badge note */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong>Private & Encrypted:</strong> Uploaded documents generate clean one-time links for local Bangladesh print shops with zero tracking.
          </div>
        </div>
      </div>
    </div>
  );
};
