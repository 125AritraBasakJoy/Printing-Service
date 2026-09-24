import React, { useState } from 'react';
import {
  ListFilter,
  Search,
  Printer,
  FileText,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Trash2,
  Plus,
  Send,
  User,
} from 'lucide-react';
import { PrintJob, JobStatus } from '../types/print';

interface ShopQueueDashboardProps {
  jobs: PrintJob[];
  onSelectJob: (jobId: string) => void;
  onUpdateStatus: (jobId: string, status: JobStatus) => void;
  onDeleteJob: (jobId: string) => void;
  onNewJobClick: () => void;
}

export const ShopQueueDashboard: React.FC<ShopQueueDashboardProps> = ({
  jobs,
  onSelectJob,
  onUpdateStatus,
  onDeleteJob,
  onNewJobClick,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Metrics
  const activeInQueue = jobs.filter((j) => j.status === 'in_queue' || j.status === 'pending').length;
  const printingNow = jobs.filter((j) => j.status === 'printing').length;
  const readyPickup = jobs.filter((j) => j.status === 'ready').length;
  const completedJobs = jobs.filter((j) => j.status === 'completed');
  
  const totalRevenue = jobs.reduce((acc, j) => acc + (j.pricing.totalCost || 0), 0);
  const totalSheets = jobs.reduce(
    (acc, j) => acc + (j.pageCount * (j.settings.copies || 1)),
    0
  );

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesSearch =
      job.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 1. Header & Metric Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Shop Print Operations Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming customer print orders, track spooling jobs, and verify payment.
          </p>
        </div>

        <button
          onClick={onNewJobClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Customer Document</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pending in Queue
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {activeInQueue}
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
            {printingNow > 0 ? `${printingNow} actively printing` : 'Ready to spool'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Ready for Pickup
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">
            {readyPickup}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">At counter</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Sheets
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {totalSheets}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Pages processed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Revenue
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
            ${totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">{jobs.length} jobs total</div>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status segmented filters */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs font-semibold">
          {(['all', 'in_queue', 'printing', 'ready', 'completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all'
                ? 'All Jobs'
                : st === 'in_queue'
                ? 'In Queue'
                : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Token, Customer, File..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 3. Jobs Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">No matching print jobs</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No orders found matching your filter criteria. Try resetting search or upload a new file.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Token Code</th>
                  <th className="py-3 px-4">Document / File</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Print Specs</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {job.shortCode}
                      {job.pinCode && (
                        <span className="block text-[10px] font-sans font-medium text-amber-600">
                          PIN Protected
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={job.fileName}>
                        {job.fileName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {job.pageCount} {job.pageCount === 1 ? 'page' : 'pages'} · {(job.fileSize / 1024).toFixed(0)} KB
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{job.customerName || 'Walk-in Customer'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{job.customerPhone || '—'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {job.settings.copies} {job.settings.copies === 1 ? 'Copy' : 'Copies'} · {job.settings.colorMode.toUpperCase()}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {job.settings.paperSize} · {job.settings.duplex === 'single' ? '1-Sided' : '2-Sided'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ${job.pricing.totalCost.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          job.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.status === 'printing'
                            ? 'bg-blue-100 text-blue-800'
                            : job.status === 'ready'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectJob(job.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Station</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete job ${job.shortCode}?`)) {
                              onDeleteJob(job.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Wipe Job"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
