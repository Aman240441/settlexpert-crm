import React, { useState, useEffect } from 'react';
import {
  FileSignature,
  Search,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { AgreementDocumentView } from '../employee/AgreementDocumentView';

export const ManagerAgreementsView: React.FC = () => {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAgr, setSelectedAgr] = useState<any>(null);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const res = await api.getCRMAgreements({ search: search || undefined, status: statusFilter || undefined, page, limit });
      setAgreements(res.agreements);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error('Failed to load agreements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, [search, statusFilter, page, limit]);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  // Full-screen Official Agreement Document View (exact same as Employee CRM)
  if (selectedAgr) {
    return (
      <AgreementDocumentView
        agreement={selectedAgr}
        onBack={() => setSelectedAgr(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-indigo-400" />
            <span>Retainer Contracts & Client Agreements</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Executed settlement contracts linked directly to canonical client records.
          </p>
        </div>

        <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-indigo-400">
          {total} Active Agreements
        </span>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Agreement Ref, Client Name, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="signed">Signed</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-10">#</th>
                <th className="py-3.5 px-4">Agreement Ref</th>
                <th className="py-3.5 px-4">Client User Info</th>
                <th className="py-3.5 px-4">Phone / City</th>
                <th className="py-3.5 px-4">Total Contract Fee</th>
                <th className="py-3.5 px-4">Monthly Fee</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Prepared By</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading agreements...
                  </td>
                </tr>
              ) : agreements.length > 0 ? (
                agreements.map((a, idx) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500">{(page - 1) * limit + idx + 1}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 whitespace-nowrap">
                      {a.agreement_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{a.client_name || a.name}</span>
                      <span className="text-[11px] font-mono text-slate-400">{a.client_number}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300 block">{a.client_phone || a.phone}</span>
                      <span className="text-[11px] text-slate-400">{a.client_city || '—'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-rose-400 text-sm">
                      {formatCurrency(a.total_fee)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {formatCurrency(a.monthly_fee)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px]">{a.resolution_duration || '6 Months'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {a.prepared_by || a.created_by || 'Consultant'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={a.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedAgr(a)}
                        title="Preview Retainer Document"
                        className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 transition-all inline-flex items-center"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No agreements recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span>Showing</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>of {total} total agreements</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-white">Page {page}</span>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PREVIEW DOCUMENT MODAL */}
      <Modal
        isOpen={!!selectedAgr}
        onClose={() => setSelectedAgr(null)}
        title={`Agreement — ${selectedAgr?.agreement_number || ''}`}
        subtitle={`Client: ${selectedAgr?.client_name || selectedAgr?.name} • Status: ${selectedAgr?.status}`}
        maxWidth="lg"
      >
        {selectedAgr && (
          <div className="space-y-4 text-xs">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 space-y-4 font-sans leading-relaxed">
              <div className="border-b border-slate-800 pb-3 flex justify-between items-start">
                <div>
                  <h3 className="text-base font-black text-white">SETTL EXPERT RESOLUTION AGREEMENT</h3>
                  <p className="text-[11px] text-slate-400">Ref: {selectedAgr.agreement_number}</p>
                </div>
                <Badge status={selectedAgr.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px] bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Client Details:</span>
                  <strong className="text-white block">{selectedAgr.client_name || selectedAgr.name}</strong>
                  <span className="text-slate-400">{selectedAgr.client_phone || selectedAgr.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Fee Schedule:</span>
                  <strong className="text-rose-400 block text-sm">{formatCurrency(selectedAgr.total_fee)}</strong>
                  <span className="text-slate-400">Tenure: {selectedAgr.resolution_duration || '6 Months'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 uppercase font-bold text-[10px]">Agreement Clauses:</span>
                <pre className="whitespace-pre-wrap font-sans text-slate-300 text-xs bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                  {selectedAgr.agreement_body || 'Standard Retainer Clauses Executed.'}
                </pre>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Prepared By: {selectedAgr.prepared_by || selectedAgr.created_by}</span>
                <span>Date: {new Date(selectedAgr.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
              >
                <Printer className="h-4 w-4" />
                <span>Print Document</span>
              </button>
              <button
                onClick={() => setSelectedAgr(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
