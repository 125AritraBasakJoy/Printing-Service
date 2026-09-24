/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminUploadPage } from './pages/AdminUploadPage';
import { ShopPrintPage } from './pages/ShopPrintPage';
import { ShopQueueDashboard } from './pages/ShopQueueDashboard';
import { PrintTestPatternPage } from './pages/PrintTestPatternPage';
import { PrintJob, JobStatus } from './types/print';
import { api } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState<'admin' | 'shop' | 'queue' | 'test-pattern'>('admin');
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' } | null>(null);

  const reloadJobs = () => {
    const list = api.getJobs();
    setJobs(list);
    return list;
  };

  useEffect(() => {
    const initialJobs = reloadJobs();

    // Check URL parameters for ?job=PRN-XXXX, ?id=..., or path /print/PRN-XXXX
    const params = new URLSearchParams(window.location.search);
    const jobParam = params.get('job') || params.get('id');
    const path = window.location.pathname;

    if (jobParam) {
      const match = api.getJobById(jobParam);
      if (match) {
        setSelectedJobId(match.id);
        setCurrentView('shop');
      }
    } else if (path.includes('/print/')) {
      const parts = path.split('/print/');
      const code = parts[1]?.trim();
      if (code) {
        const match = api.getJobById(code);
        if (match) {
          setSelectedJobId(match.id);
          setCurrentView('shop');
        }
      }
    } else if (initialJobs.length > 0 && !selectedJobId) {
      setSelectedJobId(initialJobs[0].id);
    }
  }, []);

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
      setCurrentView('shop');
      showToast(`Loaded ${match.shortCode} (${match.fileName}) for printing`, 'success');
    } else {
      showToast(`No document found with token code "${query}".`, 'info');
    }
  };

  const handleOpenShopView = (jobId: string) => {
    setSelectedJobId(jobId);
    setCurrentView('shop');
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
        showToast(`Document ${updated.shortCode} was permanently auto-wiped after printing.`, 'success');
      } else if (status === 'ready') {
        showToast(`Job ${updated.shortCode} marked ready for pickup!`, 'success');
      }
    }
  };

  const handleDeleteJob = (jobId: string) => {
    const success = api.deleteJob(jobId);
    if (success) {
      const updated = reloadJobs();
      showToast('Document wiped and erased from storage.', 'info');
      if (selectedJobId === jobId) {
        setSelectedJobId(updated.length > 0 ? updated[0].id : null);
      }
    }
  };

  const handleLogout = () => {
    api.logout();
    reloadJobs();
    showToast('Admin panel locked.', 'info');
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

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={(v) => {
          setCurrentView(v);
          reloadJobs();
        }}
        activeJobId={selectedJobId}
        onSearchJob={handleSearchJob}
        queueCount={jobs.filter((j) => j.status === 'ready' || j.status === 'in_queue').length}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentView === 'admin' && (
          <ProtectedRoute onLoginSuccess={() => reloadJobs()}>
            <AdminUploadPage
              onOpenShopView={handleOpenShopView}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        )}

        {currentView === 'shop' && (
          <ShopPrintPage
            job={activeJob}
            onUpdateStatus={handleUpdateStatus}
            onAdminLoginClick={() => setCurrentView('admin')}
          />
        )}

        {currentView === 'queue' && (
          <ShopQueueDashboard
            jobs={jobs}
            onSelectJob={handleOpenShopView}
            onUpdateStatus={(id, st) => handleUpdateStatus(id, st)}
            onDeleteJob={handleDeleteJob}
            onNewJobClick={() => setCurrentView('admin')}
          />
        )}

        {currentView === 'test-pattern' && (
          <PrintTestPatternPage />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>PrintBridge</strong> · Private Personal Printing Service (Bangladesh)
          </div>
          <div className="text-[11px] text-slate-400">
            Zero Local Downloads · Automatic Memory Wipe on Print Spool
          </div>
        </div>
      </footer>
    </div>
  );
}
