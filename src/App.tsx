/**
 * BD Print Bridge - Main Application Router
 * Provides clean URL routing (/admin, /print/:id, /queue, /test-pattern)
 * and separates Admin and Shopkeeper interfaces.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, AppRoute } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminUploadPage } from './pages/AdminUploadPage';
import { ShopPrintPage } from './pages/ShopPrintPage';
import { ShopQueueDashboard } from './pages/ShopQueueDashboard';
import { PrintTestPatternPage } from './pages/PrintTestPatternPage';
import { PrintJob, JobStatus } from './types/print';
import { api } from './services/api';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('admin');
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' } | null>(null);

  const reloadJobs = useCallback(() => {
    const list = api.getJobs();
    setJobs(list);
    return list;
  }, []);

  // Parse path and search params to determine route and active job
  const parseCurrentUrl = useCallback((allJobs: PrintJob[]) => {
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const jobParam = params.get('job') || params.get('id');

    if (path.startsWith('/admin')) {
      setCurrentRoute('admin');
    } else if (path.startsWith('/queue')) {
      setCurrentRoute('queue');
    } else if (path.startsWith('/test-pattern') || path.startsWith('/test')) {
      setCurrentRoute('test-pattern');
    } else if (path.startsWith('/print') || jobParam) {
      setCurrentRoute('shop');
      let targetCode = jobParam;
      if (!targetCode && path.includes('/print/')) {
        const parts = window.location.pathname.split('/print/');
        targetCode = parts[1]?.trim();
      }

      if (targetCode) {
        const match = api.getJobById(targetCode);
        if (match) {
          setSelectedJobId(match.id);
        }
      } else if (allJobs.length > 0 && !selectedJobId) {
        setSelectedJobId(allJobs[0].id);
      }
    } else {
      // Default route: Admin is STRICTLY accessible ONLY via /admin
      // Root '/' and any other path always serves the Shopkeeper Terminal
      setCurrentRoute('shop');
      if (allJobs.length > 0 && !selectedJobId) {
        setSelectedJobId(allJobs[0].id);
      }
    }
  }, [selectedJobId]);

  // Handle URL navigation without full page reloads
  const navigate = useCallback((route: AppRoute, codeOrId?: string) => {
    setCurrentRoute(route);
    let newPath = '/';

    if (route === 'admin') {
      newPath = '/admin';
    } else if (route === 'queue') {
      newPath = '/queue';
    } else if (route === 'test-pattern') {
      newPath = '/test-pattern';
    } else if (route === 'shop') {
      if (codeOrId) {
        const match = api.getJobById(codeOrId);
        if (match) {
          setSelectedJobId(match.id);
          newPath = `/print/${match.shortCode}`;
        } else {
          newPath = `/print/${codeOrId}`;
        }
      } else if (selectedJobId) {
        const current = api.getJobById(selectedJobId);
        newPath = current ? `/print/${current.shortCode}` : '/print';
      } else {
        newPath = '/print';
      }
    }

    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  }, [selectedJobId]);

  // Initial load and popstate listener
  useEffect(() => {
    const initialJobs = reloadJobs();
    parseCurrentUrl(initialJobs);

    const handlePopState = () => {
      const currentList = api.getJobs();
      setJobs(currentList);
      parseCurrentUrl(currentList);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [reloadJobs, parseCurrentUrl]);

  const showToast = (message: string, type: 'info' | 'success' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleSearchJob = (query: string) => {
    const match = api.getJobById(query);
    if (match) {
      setSelectedJobId(match.id);
      navigate('shop', match.shortCode);
      showToast(`Loaded ${match.shortCode} (${match.fileName}) for printing`, 'success');
    } else {
      showToast(`No document found with token code "${query}".`, 'info');
    }
  };

  const handleOpenShopView = (jobId: string) => {
    const match = api.getJobById(jobId);
    setSelectedJobId(match ? match.id : jobId);
    navigate('shop', match?.shortCode || jobId);
  };

  const handleUpdateStatus = (
    jobId: string,
    status: JobStatus,
    options?: { note?: string; incrementPrintCount?: boolean }
  ) => {
    const updated = api.updateJobStatus(jobId, status, options);
    if (updated) {
      reloadJobs();
      if (status === 'printing') {
        showToast(`Spooling ${updated.shortCode} to browser print wizard...`, 'info');
      } else if (status === 'wiped') {
        showToast(`Document ${updated.shortCode} permanently erased from memory.`, 'success');
      } else if (status === 'ready') {
        showToast(`Job ${updated.shortCode} marked ready for pickup!`, 'success');
      }
    }
  };

  const handleDeleteJob = (jobId: string) => {
    const success = api.deleteJob(jobId);
    if (success) {
      const updated = reloadJobs();
      showToast('Document wiped and erased from server & storage.', 'info');
      if (selectedJobId === jobId) {
        setSelectedJobId(updated.length > 0 ? updated[0].id : null);
      }
    }
  };

  const handleLogout = () => {
    api.logout();
    reloadJobs();
    navigate('shop');
    showToast('Admin panel locked. Switched to Shop Terminal.', 'info');
  };

  const activeJob = jobs.find((j) => j.id === selectedJobId) || jobs[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200 no-print">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold text-white flex items-center gap-2 ${
              notification.type === 'success' ? 'bg-slate-900' : 'bg-indigo-600'
            }`}
          >
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar: Role-separated */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={navigate}
        activeJobId={selectedJobId}
        activeJobShortCode={activeJob?.shortCode}
        onSearchJob={handleSearchJob}
        queueCount={jobs.filter((j) => j.status === 'ready' || j.status === 'in_queue').length}
        isAdminAuthenticated={api.checkAuth()}
        onLogoutAdmin={handleLogout}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentRoute === 'admin' && (
          <ProtectedRoute onLoginSuccess={() => reloadJobs()}>
            <AdminUploadPage
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        )}

        {currentRoute === 'shop' && (
          <ShopPrintPage
            job={activeJob}
            onUpdateStatus={handleUpdateStatus}
            onNavigateToQueue={() => navigate('queue')}
            onSearchJob={handleSearchJob}
          />
        )}

        {currentRoute === 'queue' && (
          <ShopQueueDashboard
            jobs={jobs}
            onSelectJob={handleOpenShopView}
            onUpdateStatus={(id, st) => handleUpdateStatus(id, st)}
            onDeleteJob={handleDeleteJob}
            onNewJobClick={() => navigate('admin')}
          />
        )}

        {currentRoute === 'test-pattern' && (
          <PrintTestPatternPage />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>BD Print Bridge</strong> · Private Personal Printing Service (Bangladesh)
          </div>
          <div className="text-[11px] text-slate-400">
            Zero Local Downloads · Automatic File Purge on Print Spool
          </div>
        </div>
      </footer>
    </div>
  );
}
