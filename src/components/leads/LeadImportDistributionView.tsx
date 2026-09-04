import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Shuffle,
  ListOrdered,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Eye,
  ArrowRightLeft,
  Clock,
  ShieldCheck,
  Check,
  X,
  FileCheck,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Plus,
  Trash2,
  Clipboard,
  Edit3
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';

interface ManualRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  total_debt: number;
  monthly_income: number;
  loan_type: string;
  employment_status: string;
  employee_id: string;
  remarks: string;
}

interface LeadImportDistributionViewProps {
  onNavigateToLeads?: () => void;
  isManager?: boolean;
}

export const LeadImportDistributionView: React.FC<LeadImportDistributionViewProps> = ({
  onNavigateToLeads,
  isManager = false
}) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'import' | 'manual' | 'distribute' | 'workload' | 'history'>('import');
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // ─── Manual Entry State ───────────────────────────────────────────────────
  const [manualRows, setManualRows] = useState<ManualRow[]>([
    {
      id: 'row-1',
      name: '',
      phone: '',
      email: '',
      city: '',
      total_debt: 500000,
      monthly_income: 45000,
      loan_type: 'Credit Card & Personal Loan',
      employment_status: 'Employed',
      employee_id: '',
      remarks: ''
    }
  ]);
  const [defaultBulkEmployeeId, setDefaultBulkEmployeeId] = useState<string>('');
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // ─── Step 1: Upload & Preview State ───────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    totalRows: number;
    validCount: number;
    duplicateCount: number;
    invalidCount: number;
    previewRows: any[];
    validRows: any[];
    duplicateRows: any[];
    invalidRows: any[];
  } | null>(null);

  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'duplicate' | 'invalid'>('all');
  const [previewSearch, setPreviewSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Step 2: Distribution State ───────────────────────────────────────────
  const [importResult, setImportResult] = useState<{
    import_id: string;
    import_number: string;
    imported_count: number;
    imported_lead_ids: string[];
    imported_leads: any[];
  } | null>(null);

  const [unassignedLeads, setUnassignedLeads] = useState<any[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [employeesWorkload, setEmployeesWorkload] = useState<any[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const [distributionMode, setDistributionMode] = useState<'equal' | 'custom'>('equal');
  const [assignmentMethod, setAssignmentMethod] = useState<'sequential' | 'random'>('sequential');
  const [customCounts, setCustomCounts] = useState<Record<string, number>>({});

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [distributionSuccess, setDistributionSuccess] = useState<{
    distribution_number: string;
    total_leads: number;
    summary: Array<{ employee_id: string; employee_name: string; count: number }>;
  } | null>(null);

  // ─── Step 3: Distribution History & Reassignment ──────────────────────────
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [selectedDistribution, setSelectedDistribution] = useState<any | null>(null);

  // Reassignment Modal State
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignLeadId, setReassignLeadId] = useState<string>('');
  const [reassignLeadNumber, setReassignLeadNumber] = useState<string>('');
  const [reassignTargetEmpId, setReassignTargetEmpId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('Workload Rebalancing');

  useEffect(() => {
    loadWorkloadAndUnassigned();
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadWorkloadAndUnassigned = async () => {
    try {
      const [wlRes, unassignedRes] = await Promise.all([
        api.getEmployeeWorkload(),
        api.getUnassignedLeads()
      ]);
      setEmployeesWorkload(wlRes.employees || []);
      setUnassignedLeads(unassignedRes.leads || []);

      // Auto select all active employees by default
      if (wlRes.employees && wlRes.employees.length > 0 && selectedEmployeeIds.length === 0) {
        setSelectedEmployeeIds(wlRes.employees.map((e: any) => e.id));
      }
    } catch (e: any) {
      console.error('Error loading workload/unassigned leads:', e);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getLeadDistributionHistory();
      setHistoryList(res.distributions || []);
    } catch (e: any) {
      console.error('Error loading distribution history:', e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Manual Lead Rows Handlers ────────────────────────────────────────────
  const handleAddManualRow = () => {
    setManualRows(prev => [
      ...prev,
      {
        id: 'row-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        name: '',
        phone: '',
        email: '',
        city: '',
        total_debt: 500000,
        monthly_income: 45000,
        loan_type: 'Credit Card & Personal Loan',
        employment_status: 'Employed',
        employee_id: defaultBulkEmployeeId || '',
        remarks: ''
      }
    ]);
  };

  const handleRemoveManualRow = (rowId: string) => {
    if (manualRows.length === 1) {
      // Reset first row
      setManualRows([
        {
          id: 'row-1',
          name: '',
          phone: '',
          email: '',
          city: '',
          total_debt: 500000,
          monthly_income: 45000,
          loan_type: 'Credit Card & Personal Loan',
          employment_status: 'Employed',
          employee_id: defaultBulkEmployeeId || '',
          remarks: ''
        }
      ]);
      return;
    }
    setManualRows(prev => prev.filter(r => r.id !== rowId));
  };

  const handleUpdateManualRow = (rowId: string, field: keyof ManualRow, value: any) => {
    setManualRows(prev =>
      prev.map(r => (r.id === rowId ? { ...r, [field]: value } : r))
    );
  };

  const handleApplyBulkEmployee = (empId: string) => {
    setDefaultBulkEmployeeId(empId);
    setManualRows(prev => prev.map(r => ({ ...r, employee_id: empId })));
  };

  const handlePasteParse = () => {
    if (!pastedText.trim()) return;
    try {
      const lines = pastedText.trim().split(/\r?\n/);
      const parsedRows: ManualRow[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Detect delimiter: Tab or Comma
        const delimiter = line.includes('\t') ? '\t' : ',';
        const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

        // If line 0 is a header (contains "name" or "phone"), skip header
        if (i === 0 && (cols[0]?.toLowerCase().includes('name') || cols[1]?.toLowerCase().includes('phone'))) {
          continue;
        }

        const name = cols[0] || '';
        const phone = cols[1] || '';
        const email = cols[2] || '';
        const city = cols[3] || '';
        const debt = parseFloat(cols[4]?.replace(/[^0-9.]/g, '')) || 500000;
        const loanType = cols[5] || 'Credit Card & Personal Loan';
        const remarks = cols[6] || '';

        if (name || phone) {
          parsedRows.push({
            id: 'row-p-' + Date.now() + '-' + i,
            name,
            phone,
            email,
            city,
            total_debt: debt,
            monthly_income: 45000,
            loan_type: loanType,
            employment_status: 'Employed',
            employee_id: defaultBulkEmployeeId || '',
            remarks
          });
        }
      }

      if (parsedRows.length > 0) {
        setManualRows(parsedRows);
        setFeedbackMsg({
          type: 'success',
          text: `Successfully parsed ${parsedRows.length} rows from clipboard!`
        });
        setIsPasteModalOpen(false);
        setPastedText('');
      } else {
        alert('Could not parse any rows from pasted text. Please check format.');
      }
    } catch (e: any) {
      alert('Error parsing pasted data: ' + e.message);
    }
  };

  const handleExecuteManualSave = async (directAssign: boolean = true) => {
    // Validate rows
    const validRowsToSubmit: any[] = [];
    for (let i = 0; i < manualRows.length; i++) {
      const r = manualRows[i];
      if (!r.name.trim()) {
        setFeedbackMsg({ type: 'error', text: `Row #${i + 1} is missing Name.` });
        return;
      }
      if (!r.phone.trim() || r.phone.replace(/[^0-9]/g, '').length < 10) {
        setFeedbackMsg({ type: 'error', text: `Row #${i + 1} (${r.name}) has an invalid Phone number (must be at least 10 digits).` });
        return;
      }

      validRowsToSubmit.push({
        name: r.name.trim(),
        phone: r.phone.trim(),
        email: r.email ? r.email.trim() : '',
        city: r.city ? r.city.trim() : '',
        total_debt: Number(r.total_debt) || 0,
        monthly_income: Number(r.monthly_income) || 0,
        loan_type: r.loan_type || 'Credit Card & Personal Loan',
        employment_status: r.employment_status || 'Employed',
        employee_id: directAssign ? (r.employee_id || null) : null,
        remarks: r.remarks ? r.remarks.trim() : 'Manual Lead Entry'
      });
    }

    setLoading(true);
    try {
      // 1. Preview for duplicate checking
      const previewRes = await api.previewLeadImport({ rows: validRowsToSubmit });
      if (previewRes.duplicateCount > 0 || previewRes.invalidCount > 0) {
        const firstErr = previewRes.duplicateRows[0] || previewRes.invalidRows[0];
        setFeedbackMsg({
          type: 'error',
          text: `Validation alert: ${firstErr.validationReason} (${firstErr.name})`
        });
        setLoading(false);
        return;
      }

      // 2. Execute insertion
      const execRes = await api.executeLeadImport({
        validRows: validRowsToSubmit,
        fileName: 'Manual_Lead_Entry.xlsx',
        totalRows: validRowsToSubmit.length,
        duplicateCount: 0,
        invalidCount: 0
      });

      const assignedCount = validRowsToSubmit.filter(r => r.employee_id).length;
      setImportResult(execRes);

      if (directAssign && assignedCount > 0) {
        setFeedbackMsg({
          type: 'success',
          text: `Success! ${execRes.imported_count} leads created and assigned directly to Employee CRM workspace!`
        });
        // Reset manual rows to clean state
        setManualRows([
          {
            id: 'row-1',
            name: '',
            phone: '',
            email: '',
            city: '',
            total_debt: 500000,
            monthly_income: 45000,
            loan_type: 'Credit Card & Personal Loan',
            employment_status: 'Employed',
            employee_id: defaultBulkEmployeeId || '',
            remarks: ''
          }
        ]);
        loadWorkloadAndUnassigned();
      } else {
        // Direct to distribution tab
        setSelectedLeadIds(execRes.imported_lead_ids || []);
        setActiveTab('distribute');
        setFeedbackMsg({
          type: 'success',
          text: `${execRes.imported_count} leads created! Now distribute them among employees using Equal or Custom mode below.`
        });
        loadWorkloadAndUnassigned();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to save manual leads' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Download Sample Excel Template ───────────────────────────────────────
  const handleDownloadTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
    const token = localStorage.getItem('settl_expert_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
    const url = `/api/crm/lead-import/template?format=${format}&t=${Date.now()}`;
    
    // Trigger download with auth header via fetch blob
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `settl_expert_leads_template.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch(err => {
        alert('Failed to download template: ' + err.message);
      });
  };

  // ─── File Upload & Preview Handler ────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setPreviewLoading(true);
    setPreviewData(null);
    setImportResult(null);
    setDistributionSuccess(null);
    setFeedbackMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (rawJson.length === 0) {
            setFeedbackMsg({ type: 'error', text: 'Uploaded spreadsheet is empty. Please add rows with lead data.' });
            setPreviewLoading(false);
            return;
          }

          // Call backend preview API for validation & duplicate detection
          const previewRes = await api.previewLeadImport({ rows: rawJson });
          setPreviewData(previewRes);
          setFeedbackMsg({
            type: previewRes.validCount > 0 ? 'info' : 'error',
            text: `Analyzed ${previewRes.totalRows} rows: ${previewRes.validCount} Valid, ${previewRes.duplicateCount} Duplicates, ${previewRes.invalidCount} Invalid.`
          });
        } catch (err: any) {
          setFeedbackMsg({ type: 'error', text: `Failed to parse Excel file: ${err.message}` });
        } finally {
          setPreviewLoading(false);
        }
      };
      reader.readAsBinaryString(selectedFile);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Error reading file: ${err.message}` });
      setPreviewLoading(false);
    }
  };

  // ─── Download Error Report ────────────────────────────────────────────────
  const handleDownloadErrorReport = async () => {
    if (!previewData || (previewData.invalidCount === 0 && previewData.duplicateCount === 0)) {
      alert('No errors or duplicates found to generate report.');
      return;
    }

    try {
      const token = localStorage.getItem('settl_expert_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch('/api/crm/lead-import/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          invalidRows: previewData.invalidRows,
          duplicateRows: previewData.duplicateRows
        })
      });

      if (!response.ok) throw new Error('Failed to generate error report');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `lead_import_error_report_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert('Error downloading error report: ' + err.message);
    }
  };

  // ─── Execute Import (Valid Leads Only) ────────────────────────────────────
  const handleExecuteImport = async () => {
    if (!previewData || previewData.validCount === 0) {
      setFeedbackMsg({ type: 'error', text: 'No valid leads available to import.' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.executeLeadImport({
        validRows: previewData.validRows,
        fileName: fileName,
        totalRows: previewData.totalRows,
        duplicateCount: previewData.duplicateCount,
        invalidCount: previewData.invalidCount
      });

      setImportResult(res);
      setSelectedLeadIds(res.imported_lead_ids || []);
      setFeedbackMsg({
        type: 'success',
        text: `Successfully imported ${res.imported_count} leads with permanent IDs (${res.imported_leads[0]?.lead_number} – ${res.imported_leads[res.imported_leads.length - 1]?.lead_number})!`
      });

      // Switch to distribution tab
      setActiveTab('distribute');
      loadWorkloadAndUnassigned();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to import leads' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Distribution Calculations ────────────────────────────────────────────
  const activeLeadsToDistributeCount = importResult
    ? importResult.imported_count
    : selectedLeadIds.length > 0
    ? selectedLeadIds.length
    : unassignedLeads.length;

  const totalCustomAssigned = selectedEmployeeIds.reduce(
    (sum, empId) => sum + (Number(customCounts[empId]) || 0),
    0
  );
  const remainingCustomLeads = activeLeadsToDistributeCount - totalCustomAssigned;

  const handleCustomCountChange = (empId: string, val: string) => {
    const num = parseInt(val, 10) || 0;
    setCustomCounts(prev => ({
      ...prev,
      [empId]: Math.max(0, num)
    }));
  };

  // Toggle employee selection
  const handleToggleEmployee = (empId: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmployeeIds.length === employeesWorkload.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(employeesWorkload.map(e => e.id));
    }
  };

  // ─── Confirm & Execute Distribution ───────────────────────────────────────
  const handleConfirmDistribution = async () => {
    if (selectedEmployeeIds.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'Please select at least one employee for distribution.' });
      return;
    }

    let leadsTarget = importResult ? importResult.imported_lead_ids : selectedLeadIds;
    if (!leadsTarget || leadsTarget.length === 0) {
      leadsTarget = unassignedLeads.map(l => l.id);
    }

    if (leadsTarget.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'No leads available to distribute.' });
      return;
    }

    // Build assignment list
    let assignments: Array<{ employee_id: string; count: number }> = [];

    if (distributionMode === 'equal') {
      const countPerEmp = Math.floor(leadsTarget.length / selectedEmployeeIds.length);
      const remainder = leadsTarget.length % selectedEmployeeIds.length;

      assignments = selectedEmployeeIds.map((empId, idx) => ({
        employee_id: empId,
        count: countPerEmp + (idx < remainder ? 1 : 0)
      }));
    } else {
      if (totalCustomAssigned !== leadsTarget.length) {
        setFeedbackMsg({
          type: 'error',
          text: `Distribution quantity does not match available leads. Assigned: ${totalCustomAssigned}, Available: ${leadsTarget.length}`
        });
        return;
      }
      assignments = selectedEmployeeIds.map(empId => ({
        employee_id: empId,
        count: Number(customCounts[empId]) || 0
      }));
    }

    setLoading(true);
    setIsConfirmOpen(false);

    try {
      const res = await api.distributeLeads({
        lead_ids: leadsTarget,
        mode: distributionMode,
        assignment_method: assignmentMethod,
        assignments,
        import_id: importResult ? importResult.import_id : null
      });

      setDistributionSuccess(res);
      setFeedbackMsg({
        type: 'success',
        text: `Success! ${res.total_leads} leads distributed across ${res.summary.length} employees.`
      });

      // Clear imported batch state
      setImportResult(null);
      setSelectedLeadIds([]);
      loadWorkloadAndUnassigned();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to distribute leads' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Single Lead Reassignment ─────────────────────────────────────────────
  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignLeadId || !reassignTargetEmpId) return;

    setLoading(true);
    try {
      await api.reassignLead({
        lead_id: reassignLeadId,
        new_employee_id: reassignTargetEmpId,
        reason: reassignReason
      });

      setFeedbackMsg({
        type: 'success',
        text: `Lead ${reassignLeadNumber} successfully reassigned!`
      });
      setIsReassignOpen(false);
      setReassignLeadId('');
      loadWorkloadAndUnassigned();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to reassign lead' });
    } finally {
      setLoading(false);
    }
  };

  // Filtered rows for Preview Table
  const filteredPreviewRows = (previewData?.previewRows || []).filter(row => {
    if (previewFilter === 'valid' && row.validationStatus !== 'valid') return false;
    if (previewFilter === 'duplicate' && row.validationStatus !== 'duplicate') return false;
    if (previewFilter === 'invalid' && row.validationStatus !== 'invalid') return false;

    if (previewSearch) {
      const q = previewSearch.toLowerCase();
      return (
        row.name.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs border animate-in fade-in duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : feedbackMsg.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : feedbackMsg.type === 'info' ? (
              <TrendingUp className="h-4 w-4 text-blue-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              {isManager ? 'Manager Team Pipeline' : 'Master Control'}
            </span>
            <span className="text-xs text-slate-400">• Excel / CSV Lead Processing & Distribution</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            <span>Excel Lead Import & Smart Distribution</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Upload bulk lead records (.xlsx, .xls, .csv), automatically detect & block phone/email duplicates, preview data, and distribute leads fairly among employees with Equal or Custom workloads.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleDownloadTemplate('xlsx')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Download formatted sample Excel sheet"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Sample Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => handleDownloadTemplate('csv')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Download CSV template"
          >
            <Download className="h-3.5 w-3.5 text-blue-600" />
            <span>Sample CSV</span>
          </button>

          {onNavigateToLeads && (
            <button
              onClick={onNavigateToLeads}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <span>View CRM Leads</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl px-4 p-1 shadow-2xs gap-2 overflow-x-auto">
        {[
          { id: 'import', label: '1. Excel Upload & Preview', icon: Upload },
          { id: 'manual', label: '2. Manual Lead Entry (Type Directly)', icon: Edit3 },
          {
            id: 'distribute',
            label: `3. Distribute Leads ${importResult ? `(${importResult.imported_count} Ready)` : unassignedLeads.length > 0 ? `(${unassignedLeads.length} Unassigned)` : ''}`,
            icon: Users
          },
          { id: 'workload', label: '4. Employee Workload', icon: TrendingUp },
          { id: 'history', label: '5. Distribution History', icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXCEL UPLOAD & PREVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Upload Drop Zone Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Upload className="h-4 w-4 text-emerald-600" />
                  <span>Upload Spreadsheet File</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  <span>{fileName ? 'Choose Another File' : 'Choose Excel / CSV File'}</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Visual Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                fileName
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/50'
              }`}
            >
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {fileName ? (
                    <span className="text-emerald-700 font-black">{fileName}</span>
                  ) : (
                    'Click to upload or drag & drop your Excel sheet here'
                  )}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  18 standard lead fields mapped automatically (Name, Phone, Email, City, Debt Amount, Loan Type, etc.)
                </p>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {previewLoading && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-xs font-bold text-slate-700">Validating rows & checking duplicate phone/email in CRM...</p>
              <p className="text-[11px] text-slate-400">Comparing with existing canonical database records</p>
            </div>
          )}

          {/* PREVIEW & VALIDATION SUMMARY */}
          {previewData && !previewLoading && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Rows</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{previewData.totalRows}</div>
                  <span className="text-[10px] text-slate-500">Rows in spreadsheet</span>
                </div>

                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Valid Leads</span>
                  </span>
                  <div className="text-2xl font-black text-emerald-800 mt-1">{previewData.validCount}</div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Ready for canonical import</span>
                </div>

                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Duplicates Blocked</span>
                  </span>
                  <div className="text-2xl font-black text-amber-800 mt-1">{previewData.duplicateCount}</div>
                  <span className="text-[10px] text-amber-700 font-semibold">Existing phone or email</span>
                </div>

                <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Invalid Rows</span>
                  </span>
                  <div className="text-2xl font-black text-rose-800 mt-1">{previewData.invalidCount}</div>
                  <span className="text-[10px] text-rose-700 font-semibold">Missing required fields</span>
                </div>
              </div>

              {/* Action Toolbar & Filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setPreviewFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      previewFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({previewData.totalRows})
                  </button>

                  <button
                    onClick={() => setPreviewFilter('valid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      previewFilter === 'valid'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Valid ({previewData.validCount})
                  </button>

                  <button
                    onClick={() => setPreviewFilter('duplicate')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      previewFilter === 'duplicate'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Duplicates ({previewData.duplicateCount})
                  </button>

                  <button
                    onClick={() => setPreviewFilter('invalid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      previewFilter === 'invalid'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Invalid ({previewData.invalidCount})
                  </button>
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search preview..."
                      value={previewSearch}
                      onChange={e => setPreviewSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {(previewData.duplicateCount > 0 || previewData.invalidCount > 0) && (
                    <button
                      onClick={handleDownloadErrorReport}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs font-bold transition-colors"
                      title="Download Excel error report with reasons"
                    >
                      <Download className="h-3.5 w-3.5 text-amber-700" />
                      <span>Download Error Report</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setFile(null);
                      setFileName('');
                      setPreviewData(null);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleExecuteImport}
                    disabled={previewData.validCount === 0 || loading}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                      previewData.validCount > 0
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                        : 'bg-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Import {previewData.validCount} Valid Leads</span>
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 sticky top-0 z-10 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">City</th>
                        <th className="py-3 px-4">Outstanding Debt</th>
                        <th className="py-3 px-4">Loan Type</th>
                        <th className="py-3 px-4">Validation Status & Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredPreviewRows.map((row, idx) => {
                        const isValid = row.validationStatus === 'valid';
                        const isDup = row.validationStatus === 'duplicate';
                        return (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              isValid
                                ? 'hover:bg-slate-50/70'
                                : isDup
                                ? 'bg-amber-50/40 hover:bg-amber-50/70'
                                : 'bg-rose-50/40 hover:bg-rose-50/70'
                            }`}
                          >
                            <td className="py-3 px-4 font-mono text-slate-400">{row.rowNumber}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                            <td className="py-3 px-4 font-mono font-semibold">{row.phone}</td>
                            <td className="py-3 px-4 text-slate-500">{row.email || '—'}</td>
                            <td className="py-3 px-4">{row.city || '—'}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {row.total_debt ? `₹${Number(row.total_debt).toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-700">
                                {row.loan_type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    isValid
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isDup
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {isValid ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  ) : isDup ? (
                                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                                  ) : (
                                    <XCircle className="h-3 w-3 text-rose-600" />
                                  )}
                                  <span>{isValid ? 'Valid' : isDup ? 'Duplicate' : 'Invalid'}</span>
                                </span>
                                <span className="text-[11px] text-slate-500 truncate max-w-xs" title={row.validationReason}>
                                  {row.validationReason}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANUAL MULTI-LEAD ENTRY (TYPE DIRECTLY) */}
      {/* ========================================================================= */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  Manual Entry Studio
                </span>
                <span className="text-xs text-slate-400">• Direct CRM Creation & Employee Assignment</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-emerald-600" />
                <span>Type Leads Manually ({manualRows.length} Rows)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Type individual lead rows directly, paste tabular data from clipboard, and either assign them immediately to employees or queue them for smart distribution.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Paste tabular text copied from Excel or CSV"
              >
                <Clipboard className="h-3.5 w-3.5 text-blue-600" />
                <span>Paste from Clipboard</span>
              </button>

              <button
                type="button"
                onClick={handleAddManualRow}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Row</span>
              </button>

              <button
                type="button"
                onClick={() => handleExecuteManualSave(false)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Create leads and send directly to Equal/Custom distribution screen"
              >
                <Shuffle className="h-3.5 w-3.5" />
                <span>Send to Smart Distribution</span>
              </button>

              <button
                type="button"
                onClick={() => handleExecuteManualSave(true)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                title="Create leads with selected employee assignments and immediately make them available in Employee CRM"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save & Assign to Employee CRM</span>
              </button>
            </div>
          </div>

          {/* Quick Bulk Assign Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700">Quick Assign All Rows to Employee:</span>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={defaultBulkEmployeeId}
                onChange={e => handleApplyBulkEmployee(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 min-w-[200px]"
              >
                <option value="">Choose Employee for all rows...</option>
                {employeesWorkload.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.emp_or_mgr_id}) • {emp.department_name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setManualRows([
                    {
                      id: 'row-1',
                      name: '',
                      phone: '',
                      email: '',
                      city: '',
                      total_debt: 500000,
                      monthly_income: 45000,
                      loan_type: 'Credit Card & Personal Loan',
                      employment_status: 'Employed',
                      employee_id: defaultBulkEmployeeId || '',
                      remarks: ''
                    }
                  ]);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
              >
                Clear All Rows
              </button>
            </div>
          </div>

          {/* Manual Entry Editable Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3 min-w-[180px]">Full Name *</th>
                    <th className="py-3 px-3 min-w-[150px]">Phone Number *</th>
                    <th className="py-3 px-3 min-w-[180px]">Email Address</th>
                    <th className="py-3 px-3 min-w-[120px]">City / Location</th>
                    <th className="py-3 px-3 min-w-[130px]">Total Debt (₹)</th>
                    <th className="py-3 px-3 min-w-[160px]">Loan Type</th>
                    <th className="py-3 px-3 min-w-[200px] text-emerald-800">Assign To Employee (Direct CRM)</th>
                    <th className="py-3 px-3 min-w-[180px]">Remarks</th>
                    <th className="py-3 px-3 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {manualRows.map((row, idx) => {
                    const isNameValid = !!row.name.trim();
                    const isPhoneValid = !!row.phone.trim() && row.phone.replace(/[^0-9]/g, '').length >= 10;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ramesh Sharma"
                            value={row.name}
                            onChange={e => handleUpdateManualRow(row.id, 'name', e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                              isNameValid
                                ? 'border-slate-200 bg-white focus:border-emerald-500'
                                : 'border-amber-300 bg-amber-50/30 focus:border-amber-500'
                            }`}
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            required
                            placeholder="+91 9876543210"
                            value={row.phone}
                            onChange={e => handleUpdateManualRow(row.id, 'phone', e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs ${
                              isPhoneValid
                                ? 'border-slate-200 bg-white focus:border-emerald-500'
                                : 'border-amber-300 bg-amber-50/30 focus:border-amber-500'
                            }`}
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="email"
                            placeholder="name@example.com"
                            value={row.email}
                            onChange={e => handleUpdateManualRow(row.id, 'email', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            placeholder="e.g. Mumbai"
                            value={row.city}
                            onChange={e => handleUpdateManualRow(row.id, 'city', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="0"
                            placeholder="500000"
                            value={row.total_debt || ''}
                            onChange={e => handleUpdateManualRow(row.id, 'total_debt', parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={row.loan_type}
                            onChange={e => handleUpdateManualRow(row.id, 'loan_type', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:border-emerald-500"
                          >
                            <option value="Credit Card & Personal Loan">Credit Card & Personal Loan</option>
                            <option value="Credit Card Only">Credit Card Only</option>
                            <option value="Personal Loan Only">Personal Loan Only</option>
                            <option value="Business Loan">Business Loan</option>
                            <option value="Multiple Unsecured Loans">Multiple Unsecured Loans</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={row.employee_id}
                            onChange={e => handleUpdateManualRow(row.id, 'employee_id', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/40 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:bg-white"
                          >
                            <option value="">Unassigned (Queue for Distribution)</option>
                            {employeesWorkload.map(emp => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} ({emp.emp_or_mgr_id})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            placeholder="e.g. Urgent debt resolution"
                            value={row.remarks}
                            onChange={e => handleUpdateManualRow(row.id, 'remarks', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveManualRow(row.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Add Row Button */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddManualRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-emerald-600" />
                <span>Add Another Row</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleExecuteManualSave(false)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 text-xs font-bold hover:bg-indigo-100"
                >
                  Send to Distribution Pool ({manualRows.length} Leads)
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteManualSave(true)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                >
                  Save & Assign Directly to Employee CRM
                </button>
              </div>
            </div>
          </div>

          {/* PASTE MODAL */}
          <Modal
            isOpen={isPasteModalOpen}
            onClose={() => setIsPasteModalOpen(false)}
            title="Paste Leads from Clipboard / Spreadsheet"
            subtitle="Copy multiple rows from Excel or Google Sheets and paste them directly below."
            maxWidth="lg"
          >
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tab-separated or Comma-separated Rows (Name, Phone, Email, City, Debt...)
                </label>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder={`Rahul Verma\t9876543210\trahul@example.com\tMumbai\t500000\tCredit Card\nPooja Sharma\t9811223344\tpooja@example.com\tDelhi\t750000\tPersonal Loan`}
                  className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePasteParse}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Parse & Fill Table Rows
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SMART DISTRIBUTION SCREEN */}
      {/* ========================================================================= */}
      {activeTab === 'distribute' && (
        <div className="space-y-6">
          {/* Distribution Success Banner */}
          {distributionSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-xs animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 text-[10px] font-mono font-bold">
                      {distributionSuccess.distribution_number}
                    </span>
                    <h3 className="text-base font-black text-emerald-900 mt-1">
                      {distributionSuccess.total_leads} Leads Successfully Assigned!
                    </h3>
                    <p className="text-xs text-emerald-700">
                      Employees can now immediately see their assigned leads in their Employee CRM workspace.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDistributionSuccess(null)}
                  className="text-emerald-500 hover:text-emerald-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-emerald-200/80">
                {distributionSuccess.summary.map(s => (
                  <div key={s.employee_id} className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <p className="text-[11px] font-bold text-slate-800 truncate">{s.employee_name}</p>
                    <p className="text-lg font-black text-emerald-700 mt-0.5">+{s.count} Leads</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distribution Header Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                {importResult ? 'Import Batch Ready' : 'Unassigned Leads Pool'}
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                Distribute {activeLeadsToDistributeCount} Leads to Team Employees
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {importResult
                  ? `Batch: ${importResult.import_number} (${importResult.imported_count} newly imported leads)`
                  : `${unassignedLeads.length} unassigned leads available in canonical database pool`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadWorkloadAndUnassigned}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Refresh workload and unassigned pool"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setIsConfirmOpen(true)}
                disabled={
                  activeLeadsToDistributeCount === 0 ||
                  selectedEmployeeIds.length === 0 ||
                  (distributionMode === 'custom' && remainingCustomLeads !== 0)
                }
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                  activeLeadsToDistributeCount > 0 &&
                  selectedEmployeeIds.length > 0 &&
                  (distributionMode === 'equal' || remainingCustomLeads === 0)
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : 'bg-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Confirm & Distribute {activeLeadsToDistributeCount} Leads</span>
              </button>
            </div>
          </div>

          {/* Mode & Method Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mode 1 vs Mode 2 */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Distribution Mode
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDistributionMode('equal')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    distributionMode === 'equal'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Equal Distribution</span>
                    {distributionMode === 'equal' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    System splits {activeLeadsToDistributeCount} leads equally (
                    {selectedEmployeeIds.length > 0
                      ? `${Math.floor(activeLeadsToDistributeCount / selectedEmployeeIds.length)} leads/emp + remainder`
                      : 'select employees'}
                    )
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDistributionMode('custom')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    distributionMode === 'custom'
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Custom Distribution</span>
                    {distributionMode === 'custom' && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Manually enter specific quantity for each employee with exact sum verification.
                  </p>
                </button>
              </div>

              {/* Custom Mode Live Validation Bar */}
              {distributionMode === 'custom' && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                    remainingCustomLeads === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <span>
                    Total: <strong>{activeLeadsToDistributeCount}</strong> | Assigned:{' '}
                    <strong>{totalCustomAssigned}</strong> | Remaining:{' '}
                    <strong>{remainingCustomLeads}</strong>
                  </span>
                  <span className="text-[11px] font-bold">
                    {remainingCustomLeads === 0 ? '✅ Ready to Assign' : '⚠️ Must match available count'}
                  </span>
                </div>
              )}
            </div>

            {/* Assignment Ordering Method: Sequential vs Random */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Assignment Ordering Method
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssignmentMethod('sequential')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    assignmentMethod === 'sequential'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ListOrdered className="h-4 w-4 text-indigo-600" />
                      <span>Sequential</span>
                    </span>
                    {assignmentMethod === 'sequential' && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Assigns leads in ordered batch sequence (Lead 1..N).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAssignmentMethod('random')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    assignmentMethod === 'random'
                      ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Shuffle className="h-4 w-4 text-purple-600" />
                      <span>Random Shuffle</span>
                    </span>
                    {assignmentMethod === 'random' && <CheckCircle2 className="h-4 w-4 text-purple-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Randomizes lead order while preserving exact employee quota.
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Employee Selection & Workload Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="select-all-emp"
                  checked={
                    employeesWorkload.length > 0 && selectedEmployeeIds.length === employeesWorkload.length
                  }
                  onChange={handleSelectAllEmployees}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="select-all-emp" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Select All Employees ({selectedEmployeeIds.length} of {employeesWorkload.length} selected)
                </label>
              </div>

              <span className="text-[11px] text-slate-400">
                {isManager ? 'Authorized Team Members Only' : 'All Active Employees'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Select</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department / Manager</th>
                    <th className="py-3 px-4 text-center">New Leads</th>
                    <th className="py-3 px-4 text-center">Active Leads</th>
                    <th className="py-3 px-4 text-center">Follow-ups</th>
                    <th className="py-3 px-4 text-center">Total Assigned</th>
                    <th className="py-3 px-6 text-right">
                      {distributionMode === 'custom' ? 'Custom Assigned Count' : 'Equal Share'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {employeesWorkload.map((emp, idx) => {
                    const isSelected = selectedEmployeeIds.includes(emp.id);

                    // Calculate equal share
                    let equalShare = 0;
                    if (isSelected && selectedEmployeeIds.length > 0) {
                      const base = Math.floor(activeLeadsToDistributeCount / selectedEmployeeIds.length);
                      const rem = activeLeadsToDistributeCount % selectedEmployeeIds.length;
                      const empIndex = selectedEmployeeIds.indexOf(emp.id);
                      equalShare = base + (empIndex < rem ? 1 : 0);
                    }

                    return (
                      <tr
                        key={emp.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-slate-50/50 opacity-60'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleEmployee(emp.id)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                              {emp.profile_image ? (
                                <img src={emp.profile_image} alt={emp.name} className="h-full w-full object-cover" />
                              ) : (
                                emp.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{emp.name}</p>
                              <span className="font-mono text-[10px] text-slate-400">{emp.emp_or_mgr_id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{emp.department_name}</p>
                          <p className="text-[10px] text-slate-400">Mgr: {emp.manager_name}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                            {emp.new_leads}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                            {emp.active_leads}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[11px]">
                            {emp.follow_ups}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          {emp.total_assigned}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          {distributionMode === 'custom' ? (
                            <div className="inline-flex items-center space-x-1.5 justify-end">
                              <input
                                type="number"
                                min="0"
                                max={activeLeadsToDistributeCount}
                                disabled={!isSelected}
                                value={customCounts[emp.id] !== undefined ? customCounts[emp.id] : ''}
                                onChange={e => handleCustomCountChange(emp.id, e.target.value)}
                                placeholder="0"
                                className="w-20 px-2.5 py-1 text-center font-bold text-xs rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:opacity-50"
                              />
                              <span className="text-[10px] text-slate-400">leads</span>
                            </div>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-xl text-xs font-black ${
                                isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              +{equalShare} Leads
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CONFIRMATION MODAL */}
          <Modal
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            title="Confirm Bulk Lead Distribution"
            subtitle={`Assigning ${activeLeadsToDistributeCount} leads to ${selectedEmployeeIds.length} selected employees.`}
            maxWidth="lg"
          >
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Leads to Assign:</span>
                  <strong className="text-slate-900">{activeLeadsToDistributeCount}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Distribution Mode:</span>
                  <strong className="text-slate-900 capitalize">{distributionMode} Distribution</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assignment Ordering:</span>
                  <strong className="text-slate-900 capitalize">{assignmentMethod}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Quota Breakdown by Employee:</span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-white">
                  {selectedEmployeeIds.map((empId, idx) => {
                    const emp = employeesWorkload.find(e => e.id === empId);
                    let count = 0;
                    if (distributionMode === 'equal') {
                      const base = Math.floor(activeLeadsToDistributeCount / selectedEmployeeIds.length);
                      const rem = activeLeadsToDistributeCount % selectedEmployeeIds.length;
                      count = base + (idx < rem ? 1 : 0);
                    } else {
                      count = customCounts[empId] || 0;
                    }
                    return (
                      <div key={empId} className="flex justify-between items-center px-2 py-1 bg-slate-50 rounded-lg">
                        <span className="font-semibold text-slate-800">{emp?.name}</span>
                        <span className="font-black text-emerald-700">+{count} Leads</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDistribution}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Confirm Distribution
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EMPLOYEE WORKLOAD OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'workload' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span>Employee Workload & Capacity Matrix</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time visibility into each team member's active pipeline, follow-ups, and converted clients to help make balanced distribution decisions.
              </p>
            </div>

            <button
              onClick={loadWorkloadAndUnassigned}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Matrix</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeesWorkload.map(emp => (
              <div key={emp.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                  <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm overflow-hidden shrink-0">
                    {emp.profile_image ? (
                      <img src={emp.profile_image} alt={emp.name} className="h-full w-full object-cover" />
                    ) : (
                      emp.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{emp.name}</h3>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span className="font-mono">{emp.emp_or_mgr_id}</span>
                      <span>•</span>
                      <span>{emp.department_name}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">New Leads</span>
                    <span className="text-lg font-black text-blue-900">{emp.new_leads}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 block">Active Pipeline</span>
                    <span className="text-lg font-black text-indigo-900">{emp.active_leads}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                    <span className="text-[10px] uppercase font-bold text-purple-700 block">Follow-ups</span>
                    <span className="text-lg font-black text-purple-900">{emp.follow_ups}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Converted Clients</span>
                    <span className="text-lg font-black text-emerald-900">{emp.converted_clients}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Total Assigned Lifetime:</span>
                  <span className="font-black text-slate-900">{emp.total_assigned} Leads</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DISTRIBUTION HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                <span>Bulk Distribution & Assignment Audit Logs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every bulk distribution record is permanently stored with timestamps, mode, operator, and employee breakdown.
              </p>
            </div>

            <button
              onClick={loadHistory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh History</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {historyList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No past distribution logs found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {historyList.map(dist => (
                  <div key={dist.id} className="p-6 hover:bg-slate-50/50 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold">
                          {dist.distribution_number}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {dist.total_leads} Leads Distributed across {dist.employee_count} Employees
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                          {dist.distribution_mode} mode
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase">
                          {dist.assignment_method}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        By <strong className="text-slate-700">{dist.distributed_by_name}</strong> ({dist.distributed_by_role}) • {dist.created_at}
                      </div>
                    </div>

                    {/* Breakdown Badges */}
                    {dist.summary && dist.summary.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {dist.summary.map((s: any, idx: number) => (
                          <div
                            key={idx}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800 font-semibold"
                          >
                            <span>{s.employee_name}:</span>
                            <span className="font-bold text-emerald-700">+{s.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REASSIGNMENT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isReassignOpen}
        onClose={() => setIsReassignOpen(false)}
        title={`Reassign Lead ${reassignLeadNumber}`}
        subtitle="Transfer lead ownership while permanently preserving lead ID and created_at."
        maxWidth="md"
      >
        <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Target Employee *</label>
            <select
              required
              value={reassignTargetEmpId}
              onChange={e => setReassignTargetEmpId(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            >
              <option value="">Select Employee</option>
              {employeesWorkload.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.emp_or_mgr_id}) • {emp.department_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Reassignment Reason / Note</label>
            <textarea
              rows={2}
              value={reassignReason}
              onChange={e => setReassignReason(e.target.value)}
              placeholder="e.g. Workload balancing, specialized consultation"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReassignOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
            >
              Confirm Reassignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
