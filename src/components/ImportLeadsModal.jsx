import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X, FileSpreadsheet, UploadCloud, UserCheck, AlertTriangle,
  CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, RefreshCw,
  Eye, Check, Shield, Layers, HelpCircle, Download, Users, Shuffle
} from 'lucide-react';

const CRM_FIELDS = [
  { key: 'name', label: 'Lead Name', required: true, aliases: ['name', 'full name', 'lead name', 'customer name', 'client name', 'contact name'] },
  { key: 'phone', label: 'Phone Number', required: true, aliases: ['phone', 'mobile', 'mobile number', 'phone number', 'contact', 'cell', 'tel'] },
  { key: 'email', label: 'Email Address', required: false, aliases: ['email', 'email id', 'email address', 'mail'] },
  { key: 'loan_type', label: 'Loan Type', required: false, aliases: ['loan type', 'type', 'service', 'product', 'loan'] },
  { key: 'lender', label: 'Lender / Bank', required: false, aliases: ['lender', 'bank', 'bank name', 'financer', 'nbfc', 'institution'] },
  { key: 'outstanding_amount', label: 'Loan / Outstanding Amount', required: false, aliases: ['amount', 'loan amount', 'outstanding', 'outstanding amount', 'debt', 'total debt', 'balance'] },
  { key: 'city', label: 'City', required: false, aliases: ['city', 'location', 'town', 'state', 'address'] },
  { key: 'source', label: 'Source', required: false, aliases: ['source', 'lead source', 'channel', 'campaign'] },
  { key: 'monthly_income', label: 'Monthly Income', required: false, aliases: ['income', 'monthly income', 'salary', 'monthly salary'] },
  { key: 'notes', label: 'Notes / Remarks', required: false, aliases: ['notes', 'remarks', 'remark', 'comments', 'comment', 'description'] }
];

export default function ImportLeadsModal({ isOpen, onClose, employees = [], onImportSuccess, existingLeads = [] }) {
  const [step, setStep] = useState(1); // 1: Mode & Upload, 2: Column Mapping, 3: Preview & Validation, 4: Confirmation, 5: Result
  const [distributionMode, setDistributionMode] = useState('single'); // 'single' | 'equal' | 'custom_counts' | 'manual'
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [customCounts, setCustomCounts] = useState({});
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [duplicateAction, setDuplicateAction] = useState('skip'); // 'skip' | 'update'
  const [validationStats, setValidationStats] = useState({ total: 0, valid: 0, duplicates: 0, invalid: 0 });
  const [validatedRows, setValidatedRows] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const activeEmployees = employees.filter(e => e.status === 'active');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDistributionMode('single');
      setSelectedEmpId('');
      setSelectedEmpIds(activeEmployees.map(e => e.id));
      setCustomCounts({});
      setFile(null);
      setFileName('');
      setRawHeaders([]);
      setRawRows([]);
      setColumnMapping({});
      setDuplicateAction('skip');
      setImportResult(null);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedEmployee = activeEmployees.find(e => String(e.id) === String(selectedEmpId));

  // Calculate sum of custom counts
  const totalAllocatedCustom = Object.values(customCounts).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
  const remainingCustom = Math.max(0, rawRows.length - totalAllocatedCustom);

  // Quick auto-split for custom counts
  const handleAutoSplit = () => {
    if (activeEmployees.length === 0 || rawRows.length === 0) return;
    const base = Math.floor(rawRows.length / activeEmployees.length);
    let rem = rawRows.length % activeEmployees.length;
    const newCounts = {};
    activeEmployees.forEach(emp => {
      newCounts[emp.id] = base + (rem > 0 ? 1 : 0);
      if (rem > 0) rem--;
    });
    setCustomCounts(newCounts);
  };

  const handleClearCounts = () => {
    setCustomCounts({});
  };

  const handleCustomCountChange = (empId, val) => {
    const num = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setCustomCounts(prev => ({
      ...prev,
      [empId]: num
    }));
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Name': 'Rahul Sharma',
        'Phone': '9876543210',
        'Email': 'rahul.sharma@example.com',
        'Loan Type': 'Personal Loan',
        'Lender': 'HDFC Bank',
        'Loan Amount': '500000',
        'City': 'Delhi',
        'Source': 'Website',
        'Monthly Income': '45000',
        'Notes': 'Interested in 50% debt settlement'
      },
      {
        'Name': 'Amit Kumar',
        'Phone': '9876543211',
        'Email': 'amit.kumar@example.com',
        'Loan Type': 'Credit Card',
        'Lender': 'SBI Card',
        'Loan Amount': '150000',
        'City': 'Noida',
        'Source': 'Direct Call',
        'Monthly Income': '30000',
        'Notes': 'Needs urgent harassment relief'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads Template');
    XLSX.writeFile(wb, 'SettleXpert_Lead_Import_Template.xlsx');
  };

  // Handle File Upload
  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFileName(uploadedFile.name);
    setFile(uploadedFile);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!data || data.length < 2) {
          setErrorMsg('The uploaded file appears to be empty or has no data rows.');
          return;
        }

        const headers = (data[0] || []).map(h => (h || '').toString().trim()).filter(Boolean);
        const rows = data.slice(1).filter(r => r && r.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''));

        setRawHeaders(headers);
        setRawRows(rows);

        // Auto-detect mappings
        const initialMapping = {};
        headers.forEach(h => {
          const lower = h.toLowerCase().trim();
          const matched = CRM_FIELDS.find(f => f.aliases.includes(lower) || lower.includes(f.key));
          if (matched) {
            initialMapping[h] = matched.key;
          }
        });
        setColumnMapping(initialMapping);
      } catch (err) {
        console.error('File parsing error:', err);
        setErrorMsg('Failed to parse file. Please upload a valid .xlsx, .xls, or .csv file.');
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // Validation
  const handleProceedToPreview = () => {
    const mappedValues = Object.values(columnMapping);
    if (!mappedValues.includes('name')) {
      setErrorMsg('Please map the "Lead Name" column.');
      return;
    }

    setErrorMsg('');

    // Pre-build allocation queue for custom_counts
    const allocationQueue = [];
    if (distributionMode === 'custom_counts') {
      activeEmployees.forEach(emp => {
        const count = parseInt(customCounts[emp.id], 10) || 0;
        for (let k = 0; k < count; k++) {
          allocationQueue.push(emp.id);
        }
      });
    }

    let validCount = 0;
    let dupCount = 0;
    let invCount = 0;

    const validated = rawRows.map((row, idx) => {
      const rowObj = {};
      rawHeaders.forEach((header, colIdx) => {
        const fieldKey = columnMapping[header];
        if (fieldKey) {
          const rawVal = row[colIdx];
          if (fieldKey === 'monthly_income') {
            // Preserve native JS numbers from XLSX (numeric cells come as numbers already).
            // For text cells formatted as "25,000" or "₹ 25,000", strip commas/currency/spaces
            // so that parseFloat on the backend gets the correct value (e.g. 25000, not 25).
            if (typeof rawVal === 'number') {
              rowObj[fieldKey] = rawVal; // pass the number directly
            } else if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
              // Strip ₹, commas, and whitespace; keep digits and decimal point
              rowObj[fieldKey] = String(rawVal).replace(/[₹,\s]/g, '').trim();
            } else {
              rowObj[fieldKey] = '0';
            }
          } else {
            rowObj[fieldKey] = rawVal !== undefined ? String(rawVal).trim() : '';
          }
        }
      });

      const name = rowObj.name || '';
      const phone = (rowObj.phone || '').replace(/[^0-9+]/g, '');
      const email = (rowObj.email || '').toLowerCase();

      let status = 'valid';
      let error = '';

      if (!name) {
        status = 'invalid';
        error = 'Missing lead name';
        invCount++;
      } else if (!phone && !email) {
        status = 'invalid';
        error = 'Missing both phone & email';
        invCount++;
      } else {
        const isDup = existingLeads.some(l => 
          (phone && phone.length >= 7 && l.phone && l.phone.includes(phone)) ||
          (email && email.includes('@') && l.email && l.email.toLowerCase() === email)
        );

        if (isDup) {
          status = 'duplicate';
          error = 'Duplicate phone/email in CRM';
          dupCount++;
        } else {
          validCount++;
        }
      }

      // Initial assignment
      let assignedToId = null;
      if (distributionMode === 'single') {
        assignedToId = selectedEmpId ? parseInt(selectedEmpId, 10) : null;
      } else if (distributionMode === 'equal') {
        const empList = selectedEmpIds.length > 0 ? selectedEmpIds : activeEmployees.map(e => e.id);
        assignedToId = empList[idx % empList.length];
      } else if (distributionMode === 'custom_counts') {
        assignedToId = idx < allocationQueue.length ? allocationQueue[idx] : null;
      } else if (distributionMode === 'manual') {
        assignedToId = activeEmployees[idx % activeEmployees.length]?.id;
      }

      return {
        rowNumber: idx + 1,
        data: rowObj,
        assigned_to: assignedToId,
        status,
        error
      };
    });

    setValidatedRows(validated);
    setValidationStats({
      total: rawRows.length,
      valid: validCount,
      duplicates: dupCount,
      invalid: invCount
    });

    setStep(3);
  };

  // Change individual row assigned employee (for manual distribution mode)
  const handleRowEmployeeChange = (rowIdx, newEmpId) => {
    setValidatedRows(prev => {
      const updated = [...prev];
      updated[rowIdx] = { ...updated[rowIdx], assigned_to: parseInt(newEmpId) };
      return updated;
    });
  };

  // Execute Import
  const handleExecuteImport = async () => {
    setImportLoading(true);
    setErrorMsg('');

    try {
      const leadsToImport = validatedRows.map(r => ({
        ...r.data,
        assigned_to: r.assigned_to
      }));

      const token = localStorage.getItem('crm_token');

      const payload = {
        distribution_mode: distributionMode,
        filename: fileName || 'imported_leads.xlsx',
        duplicate_action: duplicateAction,
        leads: leadsToImport
      };

      if (distributionMode === 'single') {
        payload.employee_id = selectedEmpId ? parseInt(selectedEmpId, 10) : undefined;
      } else if (distributionMode === 'equal') {
        payload.employee_ids = selectedEmpIds;
      } else if (distributionMode === 'custom_counts') {
        payload.custom_counts = customCounts;
      }

      const res = await fetch('/api/admin/leads/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Import API returned unexpected response (${res.status}): ${text.slice(0, 150)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to import leads');
      }

      setImportResult(data);
      setStep(5);
    } catch (err) {
      console.error('Import execution error:', err);
      setErrorMsg(err.message || 'An error occurred while importing leads');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: '840px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header">
          <div className="admin-modal-header-left">
            <FileSpreadsheet size={20} className="admin-modal-icon" style={{ color: '#34d399' }} />
            <h3>Excel Lead Import & Team Distribution</h3>
          </div>
          <button className="admin-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', borderBottom: '1px solid #334155', background: '#0f172a' }}>
          {[
            { num: 1, label: '1. Mode & Upload' },
            { num: 2, label: '2. Column Mapping' },
            { num: 3, label: '3. Preview & Validation' },
            { num: 4, label: '4. Confirmation' },
            { num: 5, label: '5. Complete' }
          ].map(s => (
            <div
              key={s.num}
              style={{
                flex: 1,
                padding: '9px 4px',
                textAlign: 'center',
                fontSize: '11.5px',
                fontWeight: step === s.num ? 700 : 500,
                color: step === s.num ? '#818cf8' : step > s.num ? '#34d399' : '#64748b',
                borderBottom: step === s.num ? '2px solid #818cf8' : 'none',
                background: step === s.num ? 'rgba(129,140,248,0.06)' : 'transparent'
              }}
            >
              {s.label}
            </div>
          ))}
        </div>

        {errorMsg && <div className="admin-modal-error">{errorMsg}</div>}

        <div className="admin-modal-form">
          {/* STEP 1: DISTRIBUTION MODE & UPLOAD */}
          {step === 1 && (
            <div>
              {/* Distribution Mode Selection */}
              <div style={{ marginBottom: '18px', background: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0', marginBottom: '10px' }}>
                  1. Lead Distribution Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 10px',
                      borderRadius: '6px',
                      background: distributionMode === 'single' ? 'rgba(129,140,248,0.15)' : '#1e293b',
                      border: `1px solid ${distributionMode === 'single' ? '#818cf8' : '#334155'}`,
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      color: '#e2e8f0'
                    }}
                  >
                    <input
                      type="radio"
                      name="distMode"
                      checked={distributionMode === 'single'}
                      onChange={() => setDistributionMode('single')}
                      style={{ accentColor: '#818cf8' }}
                    />
                    <span>All to One</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 10px',
                      borderRadius: '6px',
                      background: distributionMode === 'equal' ? 'rgba(52,211,153,0.15)' : '#1e293b',
                      border: `1px solid ${distributionMode === 'equal' ? '#34d399' : '#334155'}`,
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      color: '#e2e8f0'
                    }}
                  >
                    <input
                      type="radio"
                      name="distMode"
                      checked={distributionMode === 'equal'}
                      onChange={() => setDistributionMode('equal')}
                      style={{ accentColor: '#34d399' }}
                    />
                    <span>Equal Split</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 10px',
                      borderRadius: '6px',
                      background: distributionMode === 'custom_counts' ? 'rgba(56,189,248,0.18)' : '#1e293b',
                      border: `1px solid ${distributionMode === 'custom_counts' ? '#38bdf8' : '#334155'}`,
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: distributionMode === 'custom_counts' ? '#38bdf8' : '#e2e8f0'
                    }}
                  >
                    <input
                      type="radio"
                      name="distMode"
                      checked={distributionMode === 'custom_counts'}
                      onChange={() => setDistributionMode('custom_counts')}
                      style={{ accentColor: '#38bdf8' }}
                    />
                    <span>Type Counts</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 10px',
                      borderRadius: '6px',
                      background: distributionMode === 'manual' ? 'rgba(168,85,247,0.15)' : '#1e293b',
                      border: `1px solid ${distributionMode === 'manual' ? '#a855f7' : '#334155'}`,
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      color: '#e2e8f0'
                    }}
                  >
                    <input
                      type="radio"
                      name="distMode"
                      checked={distributionMode === 'manual'}
                      onChange={() => setDistributionMode('manual')}
                      style={{ accentColor: '#a855f7' }}
                    />
                    <span>Per-Row</span>
                  </label>
                </div>

                {/* Sub-selectors for Single Mode */}
                {distributionMode === 'single' && (
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>
                      Select Active Employee:
                    </label>
                    <select
                      value={selectedEmpId}
                      onChange={e => setSelectedEmpId(e.target.value)}
                      className="admin-select-filter"
                      style={{ width: '100%', padding: '8px 10px' }}
                    >
                      <option value="">-- Choose Employee --</option>
                      {activeEmployees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} {emp.designation ? `— ${emp.designation}` : ''} ({emp.employee_id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sub-selectors for Equal Mode */}
                {distributionMode === 'equal' && (
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>
                      Selected Active Employees for Round-Robin Distribution ({selectedEmpIds.length} chosen):
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {activeEmployees.map(emp => (
                        <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', background: '#1e293b', padding: '4px 8px', borderRadius: '4px', border: '1px solid #334155', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedEmpIds.includes(emp.id)}
                            onChange={() => {
                              setSelectedEmpIds(prev => prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id]);
                            }}
                            style={{ accentColor: '#34d399' }}
                          />
                          <span>{emp.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-selectors for Custom Type Counts Mode */}
                {distributionMode === 'custom_counts' && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #334155' }}>
                    {/* Header with counter */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', background: '#1e293b', padding: '8px 12px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        File Leads: <strong style={{ color: '#ffffff' }}>{rawRows.length}</strong> | Allocated: <strong style={{ color: '#38bdf8' }}>{totalAllocatedCustom}</strong>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: (rawRows.length > 0 && totalAllocatedCustom === rawRows.length) ? '#34d399' : (totalAllocatedCustom > rawRows.length) ? '#f87171' : '#fbbf24' }}>
                        {rawRows.length === 0 ? 'Upload file first' : totalAllocatedCustom === rawRows.length ? '✓ All Leads Allocated' : totalAllocatedCustom > rawRows.length ? `Overallocated by ${totalAllocatedCustom - rawRows.length}` : `${rawRows.length - totalAllocatedCustom} Remaining`}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <button
                        type="button"
                        onClick={handleAutoSplit}
                        disabled={rawRows.length === 0}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          background: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '4px',
                          color: '#38bdf8',
                          cursor: rawRows.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        ⚡ Auto Split Evenly
                      </button>
                      <button
                        type="button"
                        onClick={handleClearCounts}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          background: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '4px',
                          color: '#94a3b8',
                          cursor: 'pointer'
                        }}
                      >
                        Reset All
                      </button>
                    </div>

                    {/* Employee inputs list */}
                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '6px', background: '#020617', padding: '4px' }}>
                      {activeEmployees.map(emp => {
                        const count = customCounts[emp.id] !== undefined ? customCounts[emp.id] : '';
                        const sharePercent = rawRows.length > 0 && count > 0 ? Math.round((count / rawRows.length) * 100) : 0;
                        return (
                          <div
                            key={emp.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              borderBottom: '1px solid rgba(51,65,85,0.4)',
                              background: count > 0 ? 'rgba(56,189,248,0.06)' : 'transparent'
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{emp.name}</div>
                              <div style={{ fontSize: '10.5px', color: '#64748b' }}>{emp.designation || 'Consultant'} ({emp.employee_id})</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {sharePercent > 0 && (
                                <span style={{ fontSize: '10.5px', color: '#38bdf8', background: 'rgba(56,189,248,0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {sharePercent}%
                                </span>
                              )}
                              <input
                                type="number"
                                min="0"
                                max={rawRows.length || 99999}
                                placeholder="0"
                                value={count}
                                onChange={e => handleCustomCountChange(emp.id, e.target.value)}
                                style={{
                                  width: '75px',
                                  padding: '4px 8px',
                                  fontSize: '12.5px',
                                  fontWeight: 600,
                                  textAlign: 'center',
                                  background: '#1e293b',
                                  border: `1px solid ${count > 0 ? '#38bdf8' : '#334155'}`,
                                  borderRadius: '4px',
                                  color: '#ffffff'
                                }}
                              />
                              <span style={{ fontSize: '11px', color: '#64748b' }}>leads</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Section */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0' }}>
                    2. Upload Excel / CSV Spreadsheet (.xlsx, .xls, .csv)
                  </label>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    onClick={handleDownloadTemplate}
                  >
                    <Download size={13} /> <span>Download Excel Template</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #334155',
                    borderRadius: '10px',
                    padding: '24px',
                    textAlign: 'center',
                    background: file ? 'rgba(52,211,153,0.05)' : '#0f172a',
                    borderColor: file ? '#34d399' : '#334155',
                    cursor: 'pointer',
                    transition: 'all .2s'
                  }}
                >
                  <UploadCloud size={32} color={file ? '#34d399' : '#818cf8'} style={{ margin: '0 auto 8px' }} />
                  {file ? (
                    <div>
                      <div style={{ color: '#34d399', fontWeight: 600, fontSize: '13.5px' }}>{fileName}</div>
                      <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '3px' }}>
                        {rawRows.length} data rows detected ({rawHeaders.length} columns)
                      </div>
                      <span style={{ display: 'inline-block', marginTop: '6px', color: '#818cf8', fontSize: '11px', textDecoration: 'underline' }}>
                        Click to change file
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '13px' }}>Click to upload or drag and drop spreadsheet</div>
                      <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '3px' }}>
                        Supports 25, 100, 500, 1000+ lead rows without size restrictions
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-cancel" onClick={onClose}>Cancel</button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={
                    !file ||
                    rawRows.length === 0 ||
                    (distributionMode === 'single' && !selectedEmpId) ||
                    (distributionMode === 'equal' && selectedEmpIds.length === 0) ||
                    (distributionMode === 'custom_counts' && totalAllocatedCustom === 0)
                  }
                  onClick={() => setStep(2)}
                >
                  <span>Next: Map Columns</span> <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: '14px', background: '#0f172a', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>File: <strong style={{ color: '#38bdf8' }}>{fileName}</strong> ({rawRows.length} rows)</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Distribution: <strong style={{ color: '#34d399' }}>{distributionMode.toUpperCase()}</strong></span>
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '8px', marginBottom: '14px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Excel Column</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>→</th>
                      <th style={{ width: '45%' }}>CRM Field</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawHeaders.map((header, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{header}</td>
                        <td style={{ textAlign: 'center', color: '#64748b' }}>→</td>
                        <td>
                          <select
                            value={columnMapping[header] || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setColumnMapping(prev => ({ ...prev, [header]: val }));
                            }}
                            className="admin-select-filter"
                            style={{ width: '100%' }}
                          >
                            <option value="">-- Do Not Import (Ignore) --</option>
                            {CRM_FIELDS.map(f => (
                              <option key={f.key} value={f.key}>
                                {f.label} {f.required ? '*' : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-cancel" onClick={() => setStep(1)}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button type="button" className="admin-btn-primary" onClick={handleProceedToPreview}>
                  <span>Next: Preview & Validate</span> <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION */}
          {step === 3 && (
            <div>
              {/* Stats Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: '#0f172a', padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>Total Rows</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>{validationStats.total}</div>
                </div>
                <div style={{ background: '#0f172a', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(52,211,153,0.3)' }}>
                  <div style={{ fontSize: '10.5px', color: '#34d399' }}>✓ Valid</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399' }}>{validationStats.valid}</div>
                </div>
                <div style={{ background: '#0f172a', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(251,191,36,0.3)' }}>
                  <div style={{ fontSize: '10.5px', color: '#fbbf24' }}>⚠ Duplicates</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fbbf24' }}>{validationStats.duplicates}</div>
                </div>
                <div style={{ background: '#0f172a', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.3)' }}>
                  <div style={{ fontSize: '10.5px', color: '#f87171' }}>✕ Invalid</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f87171' }}>{validationStats.invalid}</div>
                </div>
              </div>

              {/* Duplicate Handling Policy */}
              {validationStats.duplicates > 0 && (
                <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#fbbf24', marginBottom: '4px' }}>
                    Duplicate Policy ({validationStats.duplicates} duplicates detected):
                  </div>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="dupAction"
                        value="skip"
                        checked={duplicateAction === 'skip'}
                        onChange={() => setDuplicateAction('skip')}
                        style={{ accentColor: '#818cf8' }}
                      />
                      <span>Skip Duplicates (Recommended)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="dupAction"
                        value="update"
                        checked={duplicateAction === 'update'}
                        onChange={() => setDuplicateAction('update')}
                        style={{ accentColor: '#818cf8' }}
                      />
                      <span>Update & Reassign to Selected Employee</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Table Preview */}
              <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '8px', marginBottom: '12px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '35px' }}>#</th>
                      <th>Lead Name</th>
                      <th>Phone</th>
                      <th>Amount</th>
                      <th>Assigned To</th>
                      <th>Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validatedRows.slice(0, 50).map((row, i) => (
                      <tr key={i}>
                        <td style={{ color: '#64748b' }}>{row.rowNumber}</td>
                        <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{row.data.name || '—'}</td>
                        <td>{row.data.phone || '—'}</td>
                        <td>{row.data.outstanding_amount || '—'}</td>
                        <td>
                          {distributionMode === 'manual' ? (
                            <select
                              value={row.assigned_to || ''}
                              onChange={e => handleRowEmployeeChange(i, e.target.value)}
                              className="admin-select-filter"
                              style={{ padding: '2px 6px', fontSize: '11px' }}
                            >
                              {activeEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ fontSize: '11.5px', color: '#818cf8', fontWeight: 500 }}>
                              {activeEmployees.find(e => e.id === row.assigned_to)?.name || 'Assigned'}
                            </span>
                          )}
                        </td>
                        <td>
                          {row.status === 'valid' && (
                            <span style={{ color: '#34d399', fontSize: '11px', fontWeight: 600 }}>✓ Valid</span>
                          )}
                          {row.status === 'duplicate' && (
                            <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 600 }}>⚠ {row.error}</span>
                          )}
                          {row.status === 'invalid' && (
                            <span style={{ color: '#f87171', fontSize: '11px', fontWeight: 600 }}>✕ {row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-cancel" onClick={() => setStep(2)}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={validationStats.valid === 0 && duplicateAction === 'skip'}
                  onClick={() => setStep(4)}
                >
                  <span>Next: Confirm Import</span> <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION */}
          {step === 4 && (
            <div>
              <div style={{ textAlign: 'center', padding: '16px 10px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#818cf8' }}>
                  <Shield size={26} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>
                  Confirm Lead Import
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '12.5px', margin: '0 0 18px' }}>
                  Please review the import summary before committing records to the CRM Leads database.
                </p>

                <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '14px 18px', maxWidth: '440px', margin: '0 auto 20px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(51,65,85,0.4)', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Distribution Mode</span>
                    <strong style={{ color: '#818cf8' }}>{distributionMode.toUpperCase()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(51,65,85,0.4)', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Target Employee(s)</span>
                    <strong style={{ color: '#e2e8f0' }}>
                      {distributionMode === 'single' ? selectedEmployee?.name : distributionMode === 'custom_counts' ? `${Object.keys(customCounts).filter(k => customCounts[k] > 0).length} Team Members (Custom Counts)` : `${activeEmployees.length} Team Members`}
                    </strong>
                  </div>
                  {distributionMode === 'custom_counts' && (
                    <div style={{ padding: '6px 0', borderBottom: '1px solid rgba(51,65,85,0.4)', fontSize: '11.5px' }}>
                      <div style={{ color: '#818cf8', fontWeight: 600, marginBottom: '4px' }}>Custom Lead Split:</div>
                      {activeEmployees.filter(e => (customCounts[e.id] || 0) > 0).map(e => (
                        <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', padding: '2px 0' }}>
                          <span>{e.name}</span>
                          <strong style={{ color: '#38bdf8' }}>{customCounts[e.id]} leads</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(51,65,85,0.4)', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Total Rows in File</span>
                    <strong style={{ color: '#e2e8f0' }}>{validationStats.total}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(51,65,85,0.4)', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Valid Leads to Import</span>
                    <strong style={{ color: '#34d399' }}>{validationStats.valid}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Duplicates ({duplicateAction === 'skip' ? 'Skip' : 'Update'})</span>
                    <strong style={{ color: '#fbbf24' }}>{validationStats.duplicates}</strong>
                  </div>
                </div>

                <div className="admin-modal-actions" style={{ justifyContent: 'center' }}>
                  <button type="button" className="admin-btn-cancel" onClick={() => setStep(3)}>
                    <ArrowLeft size={14} /> Back to Preview
                  </button>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    disabled={importLoading}
                    onClick={handleExecuteImport}
                  >
                    <Check size={15} />
                    <span>{importLoading ? 'Importing Leads...' : 'Confirm & Import Leads'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: RESULT COMPLETE */}
          {step === 5 && importResult && (
            <div style={{ textAlign: 'center', padding: '16px 10px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#34d399' }}>
                <CheckCircle2 size={30} />
              </div>

              <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>
                Import Completed Successfully!
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '12.5px', margin: '0 0 18px' }}>
                {importResult.message}
              </p>

              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '14px 18px', maxWidth: '460px', margin: '0 auto 20px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(51,65,85,0.4)', fontSize: '12px' }}>
                  <span style={{ color: '#64748b' }}>Batch ID</span>
                  <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{importResult.batch_id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(51,65,85,0.4)', fontSize: '12px' }}>
                  <span style={{ color: '#64748b' }}>Successfully Imported</span>
                  <strong style={{ color: '#34d399' }}>{importResult.imported_count} leads</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(51,65,85,0.4)', fontSize: '12px' }}>
                  <span style={{ color: '#64748b' }}>Duplicates Skipped</span>
                  <span style={{ color: '#fbbf24' }}>{importResult.skipped_count} leads</span>
                </div>
                {importResult.distribution_summary && Object.keys(importResult.distribution_summary).length > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(51,65,85,0.4)' }}>
                    <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600, marginBottom: '4px' }}>Team Distribution Breakdown:</div>
                    {Object.entries(importResult.distribution_summary).map(([name, count]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#cbd5e1' }}>
                        <span>{name}</span>
                        <strong>{count} leads</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => {
                    onImportSuccess({ batchId: importResult.batch_id });
                    onClose();
                  }}
                >
                  <Eye size={14} /> <span>View Imported Leads</span>
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => {
                    onImportSuccess();
                    onClose();
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
