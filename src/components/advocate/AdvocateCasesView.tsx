import React, { useState, useEffect } from 'react';
import {
  Scale,
  Briefcase,
  Search,
  Eye,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Landmark,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { CalendarDateFilter, getTodayStr } from '../common/CalendarDateFilter';

interface AdvocateCasesViewProps {
  initialCaseStatusFilter?: string;
}

export const AdvocateCasesView: React.FC<AdvocateCasesViewProps> = ({ initialCaseStatusFilter }) => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>(
    initialCaseStatusFilter === 'closed' ? 'closed' : 'active'
  );
  const [monthFilter, setMonthFilter] = useState('');

  // Modals & Drawers
  const [selectedCaseDossier, setSelectedCaseDossier] = useState<any>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierFullData, setDossierFullData] = useState<any>(null);

  // Multi-Lender Dedicated Modal
  const [selectedLendersClient, setSelectedLendersClient] = useState<any>(null);
  const [lendersData, setLendersData] = useState<any[]>([]);
  const [lendersLoading, setLendersLoading] = useState(false);

  const [taskModalCase, setTaskModalCase] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.getAdvocateCases({
        search: search || undefined,
        case_status: activeTab,
        date: selectedDate || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        page,
        limit
      });
      setCases(res.cases || []);
      setTotal(res.pagination?.total || 0);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load assigned cases' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [search, activeTab, monthFilter, selectedDate, fromDate, toDate, page, limit]);

  const handleOpenDossier = async (c: any) => {
    setSelectedCaseDossier(c);
    try {
      setDossierLoading(true);
      const res = await api.getAdvocateCaseById(c.id);
      setDossierFullData(res);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to load case dossier' });
    } finally {
      setDossierLoading(false);
    }
  };

  const handleOpenLenders = async (c: any) => {
    setSelectedLendersClient(c);
    try {
      setLendersLoading(true);
      const res = await api.getAdvocateCaseById(c.id);
      setLendersData(res.lenders || []);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to load multi-lender portfolio' });
    } finally {
      setLendersLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskModalCase || !taskTitle.trim()) return;

    try {
      await api.createAdvocateCaseTask(taskModalCase.id, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        due_date: taskDueDate
      });
      setFeedbackMsg({ type: 'success', text: 'Legal notice action logged successfully' });
      setTaskModalCase(null);
      setTaskTitle('');
      setTaskDesc('');
      if (selectedCaseDossier) {
        handleOpenDossier(selectedCaseDossier);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to log task' });
    }
  };

  const exportToCSV = () => {
    if (cases.length === 0) return;
    const headers = ['Case Number', 'Client Name', 'Phone', 'Email', 'City', 'Total Debt', 'Consultant', 'Status'];
    const rows = cases.map((c) => [
      c.client_number,
      c.name,
      c.phone,
      c.email || '',
      c.city || '',
      c.total_debt,
      c.consultant_name || '',
      c.case_status || c.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Advocate_Assigned_Cases_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-16">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-500 hover:text-slate-800 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Controls Matching Employee CRM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <span className="text-[#1e40af] font-bold">Dashboard</span>
          <span>/</span>
          <span className="text-[#1e40af] font-bold">Legal Counsel</span>
          <span>/</span>
          <span className="text-slate-800 font-bold">My Assigned Cases</span>
        </div>

        {/* Right Controls: Calendar Date Filter, Month Selector & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDateFilter
            selectedDate={selectedDate}
            onDateChange={(d) => {
              setSelectedDate(d);
              setPage(1);
            }}
            fromDate={fromDate}
            toDate={toDate}
            onRangeChange={(f, t) => {
              setFromDate(f);
              setToDate(t);
              setPage(1);
            }}
          />

          <select
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              if (e.target.value) {
                setSelectedDate('');
                setFromDate('');
                setToDate('');
              }
              setPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">Month Wise</option>
            <option value="2026-08">August - 2026</option>
            <option value="2026-07">July - 2026</option>
            <option value="2026-06">June - 2026</option>
          </select>

          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center space-x-1 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar Matching Employee CRM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'active'
                ? 'bg-[#111827] text-white shadow-sm'
                : 'bg-white border border-gray-300 text-slate-700 hover:bg-gray-50'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Active Cases</span>
          </button>

          <button
            onClick={() => setActiveTab('closed')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'closed'
                ? 'bg-[#111827] text-white shadow-sm'
                : 'bg-white border border-gray-300 text-slate-700 hover:bg-gray-50'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            <span>Closed / Dropped</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Case ID, Name, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 w-56 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Card Container Matching Employee CRM */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        {/* Card Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4 text-[#15803d]" />
            <h2 className="text-sm font-bold text-slate-900">
              Assigned Legal Cases Portfolio
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {total} Cases under Counsel Advisory
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-3 w-10">#</th>
                <th className="py-3 px-3">Case ID</th>
                <th className="py-3 px-3">Client Name</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">City</th>
                <th className="py-3 px-3">Total Debt</th>
                <th className="py-3 px-3">Target Settlement</th>
                <th className="py-3 px-3">Multi-Lenders</th>
                <th className="py-3 px-3">Case Status</th>
                <th className="py-3 px-3">Assigned Consultant</th>
                <th className="py-3 px-3">Last Update</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    Loading assigned case dossier...
                  </td>
                </tr>
              ) : cases.length > 0 ? (
                cases.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono">{(page - 1) * limit + idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#1e40af] whitespace-nowrap">
                      {c.client_number}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">{c.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{c.phone}</td>
                    <td className="py-3 px-3 text-slate-600">{c.city || '—'}</td>
                    <td className="py-3 px-3 font-bold text-rose-700">
                      {formatCurrency(c.total_debt)}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {formatCurrency(c.settlement_target || (c.total_debt * 0.45))}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleOpenLenders(c)}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300 font-bold text-[10px] inline-flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                        title="Click to view all attached Multi-Lenders"
                      >
                        <Landmark className="h-3 w-3 text-blue-600" />
                        <span>{c.lender_count || 0} Lenders</span>
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold text-[10px]">
                        {c.case_status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{c.consultant_name || 'Staff Consultant'}</div>
                      {c.consultant_phone && <span className="text-[10px] text-slate-500 font-mono">{c.consultant_phone}</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {c.updated_at ? c.updated_at.substring(0, 16) : '—'}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Action 1: View Dossier */}
                        <button
                          onClick={() => handleOpenDossier(c)}
                          title="View Complete Case Dossier"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-cyan-600 transition-colors flex items-center justify-center shadow-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Action 2: Multi Lenders View */}
                        <button
                          onClick={() => handleOpenLenders(c)}
                          title="View Multi-Lenders Portfolio"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-purple-600 transition-colors flex items-center justify-center shadow-xs"
                        >
                          <Landmark className="h-3.5 w-3.5" />
                        </button>

                        {/* Action 3: Add Legal Action Task */}
                        <button
                          onClick={() => setTaskModalCase(c)}
                          title="Log Legal Notice Action"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-emerald-600 transition-colors flex items-center justify-center shadow-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <Scale className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-bold text-slate-700">No cases found for this date or filter</p>
                    <p className="text-xs text-slate-500">
                      Cases assigned to you by Legal Managers appear here in real-time.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination matching Employee CRM */}
        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-500">
          <div>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
          </div>
          <div className="flex items-center space-x-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 rounded border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 text-slate-700"
            >
              Previous
            </button>
            <span className="px-3 py-1 rounded bg-[#111827] text-white font-bold">
              {page}
            </span>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 rounded border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 text-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* FULL CASE DOSSIER MODAL */}
      <Modal
        isOpen={!!selectedCaseDossier}
        onClose={() => {
          setSelectedCaseDossier(null);
          setDossierFullData(null);
        }}
        title={`Legal Case Dossier — ${selectedCaseDossier?.client_number}`}
        subtitle={`Client: ${selectedCaseDossier?.name} • Phone: ${selectedCaseDossier?.phone}`}
        maxWidth="lg"
      >
        {dossierLoading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#166534] border-t-transparent mx-auto mb-2" />
            <span>Loading complete case portfolio...</span>
          </div>
        ) : dossierFullData ? (
          <div className="space-y-4 text-xs">
            {/* Top Financial Breakdown */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Debt</span>
                <span className="text-sm font-black text-rose-700">{formatCurrency(dossierFullData.case.total_debt)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Settlement</span>
                <span className="text-sm font-black text-slate-900">{formatCurrency(dossierFullData.case.settlement_target || (dossierFullData.case.total_debt * 0.45))}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Assigned Consultant</span>
                <span className="text-xs font-bold text-slate-900 truncate block">{dossierFullData.case.consultant_name || 'Staff'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Case Status</span>
                <span className="text-xs font-bold text-emerald-700 uppercase">{dossierFullData.case.case_status || 'Active'}</span>
              </div>
            </div>

            {/* Multi-Lender Portfolio */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Landmark className="h-3.5 w-3.5 text-[#15803d]" />
                <span>Multi-Lender Liabilities ({dossierFullData.lenders?.length || 0})</span>
              </h4>
              {dossierFullData.lenders && dossierFullData.lenders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dossierFullData.lenders.map((len: any) => (
                    <div key={len.id} className="p-3 rounded-lg bg-white border border-gray-200 shadow-2xs space-y-1">
                      <div className="flex justify-between">
                        <strong className="text-slate-900">{len.bank_name}</strong>
                        <span className="font-bold text-rose-700">{formatCurrency(len.balance)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{len.loan_type}</span>
                        <span className="capitalize text-emerald-700 font-bold">{len.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-center text-slate-500">
                  No individual lenders recorded
                </div>
              )}
            </div>

            {/* Advocate Assignment History */}
            {dossierFullData.assignmentHistory && dossierFullData.assignmentHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Counsel Assignment Audit Trail
                </h4>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {dossierFullData.assignmentHistory.map((h: any) => (
                    <div key={h.id} className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-[11px] flex justify-between items-center">
                      <div>
                        <span className="text-slate-500">{h.previous_advocate_name || 'Unassigned'}</span>
                        <span className="text-indigo-600 mx-1.5 font-bold">➔</span>
                        <strong className="text-emerald-700">{h.new_advocate_name}</strong>
                        {h.notes && <span className="text-slate-500 block text-[10px] italic">{h.notes}</span>}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Assigned by {h.assigned_by_name} • {h.created_at ? h.created_at.substring(0, 10) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedCaseDossier(null);
                  setDossierFullData(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* LOG LEGAL TASK MODAL */}
      <Modal
        isOpen={!!taskModalCase}
        onClose={() => setTaskModalCase(null)}
        title={`Log Legal Action — ${taskModalCase?.client_number}`}
        subtitle={`Client: ${taskModalCase?.name}`}
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 block mb-1 font-semibold">Action / Notice Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Drafted notice reply to HDFC Bank conciliation"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">Remarks & Legal Advice</label>
            <textarea
              rows={3}
              placeholder="Enter case strategy, conciliation status, or hearing notes..."
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 block mb-1">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 block mb-1">Next Action Date</label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setTaskModalCase(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-slate-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white font-bold shadow-xs"
            >
              Save Legal Action
            </button>
          </div>
        </form>
      </Modal>
      {/* MULTI-LENDER PORTFOLIO MODAL (Advocate View) */}
      <Modal
        isOpen={!!selectedLendersClient}
        onClose={() => {
          setSelectedLendersClient(null);
          setLendersData([]);
        }}
        title={`Multi-Lender Portfolio — ${selectedLendersClient?.client_number}`}
        subtitle={`Client: ${selectedLendersClient?.name} • Phone: ${selectedLendersClient?.phone} • City: ${selectedLendersClient?.city || 'India'}`}
        maxWidth="lg"
      >
        {lendersLoading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#166534] border-t-transparent mx-auto mb-2" />
            <span>Loading attached multi-lender portfolio...</span>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Top Summary Banner */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Portfolio Debt</span>
                <span className="text-sm font-black text-rose-700">
                  {formatCurrency(selectedLendersClient?.total_debt)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Settlement</span>
                <span className="text-sm font-black text-slate-900">
                  {formatCurrency(selectedLendersClient?.settlement_target || (selectedLendersClient?.total_debt * 0.45))}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Attached Lenders</span>
                <span className="text-sm font-black text-blue-700">
                  {lendersData.length} Banks / NBFCs
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Assigned Consultant</span>
                <span className="text-xs font-bold text-slate-900 truncate block">
                  {selectedLendersClient?.consultant_name || 'Staff Consultant'}
                </span>
              </div>
            </div>

            {/* Lenders Table & Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Landmark className="h-3.5 w-3.5 text-[#15803d]" />
                  <span>Empanelled Bank / Lender Accounts ({lendersData.length})</span>
                </h4>
                <button
                  onClick={() => {
                    setTaskModalCase(selectedLendersClient);
                    setTaskTitle(`Notice response for ${selectedLendersClient?.name}`);
                  }}
                  className="px-2.5 py-1 rounded bg-[#15803d] hover:bg-emerald-800 text-white font-bold text-[11px] inline-flex items-center space-x-1 transition-colors shadow-2xs"
                >
                  <Plus className="h-3 w-3" />
                  <span>Log Notice Action</span>
                </button>
              </div>

              {lendersData.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3 w-8">#</th>
                        <th className="py-2.5 px-3">Bank / Institution</th>
                        <th className="py-2.5 px-3">Loan / Facility Type</th>
                        <th className="py-2.5 px-3">Outstanding Balance</th>
                        <th className="py-2.5 px-3">Account Number</th>
                        <th className="py-2.5 px-3">Conciliation Status</th>
                        <th className="py-2.5 px-3 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-slate-700">
                      {lendersData.map((lender, idx) => (
                        <tr key={lender.id || idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <strong className="text-slate-900 block">{lender.bank_name}</strong>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {lender.loan_type || 'Personal Loan / Card'}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-rose-700">
                            {formatCurrency(lender.balance)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {lender.account_number || lender.loan_account_no || '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                              {lender.status || 'Active Conciliation'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setTaskModalCase(selectedLendersClient);
                                setTaskTitle(`Notice response to ${lender.bank_name}`);
                                setTaskDesc(`Regarding ${lender.loan_type || 'Loan'} account balance of ${formatCurrency(lender.balance)}`);
                              }}
                              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-[10px] transition-colors"
                            >
                              Notice
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Table Total Footer */}
                  <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600">Total Sum of Lenders Liabilities:</span>
                    <span className="text-rose-700 text-sm font-black">
                      {formatCurrency(lendersData.reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 text-center space-y-2">
                  <Landmark className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700">No individual bank records attached yet</p>
                  <p className="text-xs text-slate-500">
                    Total debt ({formatCurrency(selectedLendersClient?.total_debt)}) is currently managed at the client case level.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedLendersClient(null);
                  setLendersData([]);
                }}
                className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
              >
                Close Multi-Lenders
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
