import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, User, Mail, Phone, Building2, Briefcase, Shield,
  Calendar, Radio, Users, FileText, DollarSign, TrendingUp,
  Target, BarChart3, Activity, CheckCircle2, Clock, AlertCircle,
  FolderOpen, UserX, ArrowUpRight, Copy, Save, History, Check,
  ChevronLeft, ChevronRight, Sparkles, Filter, AlertTriangle, Layers,
  ExternalLink, Edit3, ShieldCheck, Eye, EyeOff, Download, Maximize2, X
} from 'lucide-react';

export default function AdminEmployeeDetailPage({ employee, onBack, onOpenCRM, onEditEmployee }) {
  const [activeTab, setActiveTab] = useState('targets'); // 'targets' | 'leads' | 'activity'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingTarget, setSavingTarget] = useState(false);
  const [toast, setToast] = useState(null);

  // Aadhaar decryption state
  const [revealedAadhaar, setRevealedAadhaar] = useState(null);
  const [aadhaarFrontDoc, setAadhaarFrontDoc] = useState(null);
  const [aadhaarBackDoc, setAadhaarBackDoc] = useState(null);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [decryptingAadhaar, setDecryptingAadhaar] = useState(false);

  // Image zoom lightbox modal
  const [zoomModal, setZoomModal] = useState(null);

  // Month state (YYYY-MM)
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  // Target form state
  const [targetForm, setTargetForm] = useState({
    lead_target: '',
    conversion_target: '',
    client_target: '',
    agreement_target: '',
    followup_target: '',
    collection_target: ''
  });
  const [targetHistory, setTargetHistory] = useState([]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (employee?.id) {
      fetchPerformance();
      fetchTargetHistory();
      // Preload docs if available
      if (employee.aadhaar_front_document) setAadhaarFrontDoc(employee.aadhaar_front_document);
      if (employee.aadhaar_back_document) setAadhaarBackDoc(employee.aadhaar_back_document);
    }
  }, [employee?.id, selectedMonth]);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('crm_token');
      const res = await fetch(`/api/admin/employees/${employee.id}/performance?month=${selectedMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const perfData = await res.json();
        setData(perfData);

        // Populate target form with existing target if set
        if (perfData.target && perfData.target.is_set) {
          setTargetForm({
            lead_target: perfData.target.lead_target || '',
            conversion_target: perfData.target.conversion_target || '',
            client_target: perfData.target.client_target || '',
            agreement_target: perfData.target.agreement_target || '',
            followup_target: perfData.target.followup_target || '',
            collection_target: perfData.target.collection_target || ''
          });
        } else {
          setTargetForm({
            lead_target: '',
            conversion_target: '',
            client_target: '',
            agreement_target: '',
            followup_target: '',
            collection_target: ''
          });
        }
      }
    } catch (err) {
      console.error('Fetch performance error:', err);
    }
    setLoading(false);
  };

  const fetchTargetHistory = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const res = await fetch(`/api/admin/targets/history/${employee.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const hist = await res.json();
        setTargetHistory(hist.data || []);
      }
    } catch (err) {
      console.error('Fetch target history error:', err);
    }
  };

  const handleToggleAadhaar = async () => {
    if (showAadhaar) {
      setShowAadhaar(false);
      return;
    }

    if (revealedAadhaar) {
      setShowAadhaar(true);
      return;
    }

    setDecryptingAadhaar(true);
    try {
      const token = localStorage.getItem('crm_token');
      const res = await fetch(`/api/admin/employees/${employee.id}/aadhaar`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setRevealedAadhaar(d.aadhaar_number || '—');
        if (d.aadhaar_front_document) setAadhaarFrontDoc(d.aadhaar_front_document);
        if (d.aadhaar_back_document) setAadhaarBackDoc(d.aadhaar_back_document);
        setShowAadhaar(true);
        showToast('Aadhaar decrypted & verified (Logged to audit trail)');
      } else {
        showToast('Failed to decrypt Aadhaar information', 'error');
      }
    } catch (err) {
      showToast('Error decrypting Aadhaar', 'error');
    } finally {
      setDecryptingAadhaar(false);
    }
  };

  const handleSaveTarget = async (e) => {
    if (e) e.preventDefault();
    setSavingTarget(true);

    try {
      const token = localStorage.getItem('crm_token');
      const res = await fetch(`/api/admin/employees/${employee.id}/targets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          lead_target: parseInt(targetForm.lead_target, 10) || 0,
          conversion_target: parseInt(targetForm.conversion_target, 10) || 0,
          client_target: parseInt(targetForm.client_target, 10) || 0,
          agreement_target: parseInt(targetForm.agreement_target, 10) || 0,
          followup_target: parseInt(targetForm.followup_target, 10) || 0,
          collection_target: parseFloat(targetForm.collection_target) || 0
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to save targets');

      showToast(`Targets for ${getMonthLabel(selectedMonth)} saved successfully!`, 'success');
      await fetchPerformance();
      await fetchTargetHistory();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingTarget(false);
    }
  };

  const handleCopyPreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const prevTarget = targetHistory.find(t => t.month === prevMonthKey);
    if (!prevTarget) {
      showToast(`No configured targets found for previous month (${getMonthLabel(prevMonthKey)})`, 'error');
      return;
    }

    setTargetForm({
      lead_target: prevTarget.lead_target || '',
      conversion_target: prevTarget.conversion_target || '',
      client_target: prevTarget.client_target || '',
      agreement_target: prevTarget.agreement_target || '',
      followup_target: prevTarget.followup_target || '',
      collection_target: prevTarget.collection_target || ''
    });

    showToast(`Copied targets from ${getMonthLabel(prevMonthKey)}. Review and click Save!`, 'success');
  };

  const handleMonthChange = (direction) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, (month - 1) + direction, 1);
    const newMonthKey = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthKey);
  };

  const getMonthLabel = (monthKey) => {
    if (!monthKey) return '';
    const [year, month] = monthKey.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatCurrency = (n) => {
    if (!n) return '₹0';
    return '₹' + Number(n).toLocaleString('en-IN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Target Achieved': return { bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.3)' };
      case 'On Track': return { bg: 'rgba(56,189,248,0.15)', text: '#38bdf8', border: 'rgba(56,189,248,0.3)' };
      case 'Needs Attention': return { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', border: 'rgba(251,191,36,0.3)' };
      case 'Critical': return { bg: 'rgba(248,113,113,0.15)', text: '#f87171', border: 'rgba(248,113,113,0.3)' };
      default: return { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' };
    }
  };

  const getActionIcon = (action) => {
    const map = {
      'LOGIN': <Shield size={13} color="#818cf8" />,
      'CREATE': <CheckCircle2 size={13} color="#34d399" />,
      'UPDATE': <Activity size={13} color="#f59e0b" />,
      'DELETE': <AlertCircle size={13} color="#f87171" />,
      'CONVERT': <TrendingUp size={13} color="#3b82f6" />,
      'PAYMENT': <DollarSign size={13} color="#10b981" />,
      'LEAD_ASSIGN': <User size={13} color="#818cf8" />,
      'LEAD_REASSIGN': <TrendingUp size={13} color="#f59e0b" />,
      'TARGET_CREATED': <Target size={13} color="#34d399" />,
      'TARGET_UPDATED': <Target size={13} color="#38bdf8" />,
      'OPEN_EMPLOYEE_CRM': <ExternalLink size={13} color="#10b981" />,
      'VIEW_AADHAAR_DOCUMENT': <ShieldCheck size={13} color="#f59e0b" />
    };
    return map[action] || <Clock size={13} color="#94a3b8" />;
  };

  const getActionLabel = (action) => {
    const map = {
      'LOGIN': 'Logged in',
      'CREATE': 'Created record',
      'UPDATE': 'Updated record',
      'DELETE': 'Deleted record',
      'CONVERT': 'Lead converted to client',
      'PAYMENT': 'Payment recorded',
      'LEAD_ASSIGN': 'Lead assigned',
      'LEAD_REASSIGN': 'Lead reassigned',
      'CREATE_EMPLOYEE': 'Employee created',
      'LEAD_IMPORT': 'Leads imported',
      'TARGET_CREATED': 'Target configured',
      'TARGET_UPDATED': 'Target updated',
      'OPEN_EMPLOYEE_CRM': 'Opened CRM Workspace',
      'VIEW_AADHAAR_DOCUMENT': 'Viewed Decrypted Aadhaar Document'
    };
    return map[action] || action;
  };

  const emp = data?.employee || employee;
  const metrics = data?.metrics || {};
  const leads = metrics.leads || {};
  const clients = metrics.clients || {};
  const agreements = metrics.agreements || {};
  const collections = metrics.collections || {};
  const perfScore = metrics.performance_score || 0;
  const tva = data?.targetVsActual || {};
  const aging = data?.leadAging || {};
  const trends = data?.trends || [];
  const recentLeads = data?.recent_leads || [];
  const activities = data?.recent_activities || [];

  return (
    <div className="admin-detail-page">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: toast.type === 'success' ? '#065f46' : '#991b1b', color: '#fff', padding: '10px 18px', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: toast.type === 'success' ? '1px solid #10b981' : '1px solid #f87171' }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} color="#34d399" /> : <AlertCircle size={16} color="#f87171" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Quick Action Buttons */}
      <div className="admin-detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
        <div>
          <button className="admin-back-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to Employees</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
            {/* Profile Avatar */}
            {emp.profile_photo ? (
              <div
                style={{ width: '54px', height: '54px', borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #38bdf8', flexShrink: 0, cursor: 'pointer' }}
                onClick={() => setZoomModal({ title: `${emp.name} — Profile Photo`, src: emp.profile_photo })}
                title="Click to view photo"
              >
                <img src={emp.profile_photo} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '2.5px solid #475569', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f8fafc', fontSize: '20px', fontWeight: 800 }}>
                {emp.name?.charAt(0)?.toUpperCase()}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>{emp.name}</h1>
                <span className="admin-badge-id" style={{ fontSize: '12px', padding: '3px 8px' }}>{emp.employee_id || 'SE-000'}</span>
                <span className={`admin-status-badge ${emp.status === 'active' ? 'active' : 'inactive'}`}>
                  {emp.employment_status === 'probation' ? 'On Probation' : emp.status === 'active' ? 'Active Staff' : 'Inactive'}
                </span>
              </div>
              <p className="admin-detail-subtitle" style={{ margin: '3px 0 0' }}>
                {emp.designation || 'Financial Consultant'} • {emp.department || 'Sales & Recoveries'}
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons & Month Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* OPEN CRM BUTTON */}
          <button
            type="button"
            className="admin-btn-primary"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(16,185,129,0.35)', fontWeight: 700 }}
            onClick={() => onOpenCRM && onOpenCRM(emp)}
            title={`Directly open CRM workspace for ${emp.name}`}
          >
            <ExternalLink size={16} />
            <span>Open CRM</span>
          </button>

          {/* EDIT PROFILE BUTTON */}
          <button
            type="button"
            className="admin-btn-secondary"
            style={{ fontSize: '13px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => onEditEmployee && onEditEmployee(emp)}
          >
            <Edit3 size={15} color="#38bdf8" />
            <span>Edit Profile</span>
          </button>

          {/* Month Selector Bar */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
            <button
              type="button"
              className="admin-btn-secondary"
              style={{ padding: '3px 6px', minWidth: '28px' }}
              onClick={() => handleMonthChange(-1)}
              title="Previous Month"
            >
              <ChevronLeft size={15} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} color="#38bdf8" />
              <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#f8fafc', minWidth: '110px', textAlign: 'center' }}>
                {getMonthLabel(selectedMonth)}
              </span>
            </div>

            <button
              type="button"
              className="admin-btn-secondary"
              style={{ padding: '3px 6px', minWidth: '28px' }}
              onClick={() => handleMonthChange(1)}
              title="Next Month"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ==================== EMPLOYEE INFORMATION & DOCUMENTS CARD ==================== */}
      <div className="admin-section-card" style={{ marginBottom: '20px', background: 'linear-gradient(180deg, #1e293b, #111827)', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>Employee Information & Verified Documents</h3>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>🔒 Encrypted Aadhaar Vault</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Left Column: Contact & Professional Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Email Address</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', wordBreak: 'break-all' }}>{emp.email || '—'}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Contact Phone</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{emp.phone || '—'}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Department</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{emp.department || 'Sales'}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Designation</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{emp.designation || 'Consultant'}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Joining Date</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Employment Status</span>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: emp.status === 'active' ? '#34d399' : '#f87171' }}>
                {emp.employment_status === 'probation' ? 'On Probation' : emp.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Right Column: Aadhaar Number & Front/Back Documents */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Aadhaar Card Number
                </span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace', letterSpacing: '1px', marginTop: '2px' }}>
                  {showAadhaar && revealedAadhaar ? (
                    <span style={{ color: '#38bdf8' }}>
                      {revealedAadhaar.length === 12
                        ? `${revealedAadhaar.slice(0, 4)} ${revealedAadhaar.slice(4, 8)} ${revealedAadhaar.slice(8, 12)}`
                        : revealedAadhaar}
                    </span>
                  ) : (
                    <span>{emp.aadhaar_number || 'XXXX XXXX 1234'}</span>
                  )}
                </div>
              </div>

              {/* Reveal / Hide Eye Button */}
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ fontSize: '11.5px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleToggleAadhaar}
                disabled={decryptingAadhaar}
              >
                {decryptingAadhaar ? (
                  <span>Decrypting...</span>
                ) : showAadhaar ? (
                  <><EyeOff size={14} /> <span>Hide</span></>
                ) : (
                  <><Eye size={14} color="#38bdf8" /> <span>Show Full</span></>
                )}
              </button>
            </div>

            {/* Document Thumbnails */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              {/* Front Document */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1' }}>Aadhaar Front</span>
                  {aadhaarFrontDoc && (
                    <span style={{ fontSize: '9px', background: 'rgba(52,211,153,0.2)', color: '#34d399', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>✓ VERIFIED</span>
                  )}
                </div>

                {aadhaarFrontDoc ? (
                  <div>
                    <div
                      style={{ height: '75px', borderRadius: '4px', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #334155' }}
                      onClick={() => setZoomModal({ title: `${emp.name} — Aadhaar Card (Front)`, src: aadhaarFrontDoc })}
                    >
                      <img src={aadhaarFrontDoc} alt="Aadhaar Front" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{ fontSize: '10.5px', padding: '3px 6px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        onClick={() => setZoomModal({ title: `${emp.name} — Aadhaar Front`, src: aadhaarFrontDoc })}
                      >
                        <Maximize2 size={11} /> <span>Zoom</span>
                      </button>
                      <a
                        href={aadhaarFrontDoc}
                        download={`Aadhaar_Front_${emp.employee_id || 'SE'}.png`}
                        className="admin-btn-secondary"
                        style={{ fontSize: '10.5px', padding: '3px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Download Document"
                      >
                        <Download size={11} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '75px', border: '1px dashed #475569', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '11px' }}>
                    No Document
                  </div>
                )}
              </div>

              {/* Back Document */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1' }}>Aadhaar Back</span>
                  {aadhaarBackDoc && (
                    <span style={{ fontSize: '9px', background: 'rgba(52,211,153,0.2)', color: '#34d399', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>✓ VERIFIED</span>
                  )}
                </div>

                {aadhaarBackDoc ? (
                  <div>
                    <div
                      style={{ height: '75px', borderRadius: '4px', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #334155' }}
                      onClick={() => setZoomModal({ title: `${emp.name} — Aadhaar Card (Back)`, src: aadhaarBackDoc })}
                    >
                      <img src={aadhaarBackDoc} alt="Aadhaar Back" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{ fontSize: '10.5px', padding: '3px 6px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        onClick={() => setZoomModal({ title: `${emp.name} — Aadhaar Back`, src: aadhaarBackDoc })}
                      >
                        <Maximize2 size={11} /> <span>Zoom</span>
                      </button>
                      <a
                        href={aadhaarBackDoc}
                        download={`Aadhaar_Back_${emp.employee_id || 'SE'}.png`}
                        className="admin-btn-secondary"
                        style={{ fontSize: '10.5px', padding: '3px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Download Document"
                      >
                        <Download size={11} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '75px', border: '1px dashed #475569', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '11px' }}>
                    No Document
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #334155', margin: '20px 0 16px', paddingBottom: '10px' }}>
        <button
          type="button"
          className={`admin-btn-${activeTab === 'targets' ? 'primary' : 'secondary'}`}
          style={{ padding: '7px 16px', fontSize: '13px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setActiveTab('targets')}
        >
          <Target size={15} /> <span>Targets & Monthly Performance</span>
        </button>
        <button
          type="button"
          className={`admin-btn-${activeTab === 'leads' ? 'primary' : 'secondary'}`}
          style={{ padding: '7px 16px', fontSize: '13px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setActiveTab('leads')}
        >
          <FolderOpen size={15} /> <span>Assigned Leads & Aging ({leads.assigned || 0})</span>
        </button>
        <button
          type="button"
          className={`admin-btn-${activeTab === 'activity' ? 'primary' : 'secondary'}`}
          style={{ padding: '7px 16px', fontSize: '13px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setActiveTab('activity')}
        >
          <Activity size={15} /> <span>Activity Timeline & Audit Trail</span>
        </button>
      </div>

      {loading ? (
        <div className="admin-detail-loading" style={{ padding: '50px 0' }}>
          <div className="admin-spinner"></div>
          <p>Calculating {getMonthLabel(selectedMonth)} metrics from CRM database...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: TARGETS & MONTHLY PERFORMANCE */}
          {activeTab === 'targets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Top Row: Overall Score & Month Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Performance Score Card */}
                <div className="admin-section-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                        {getMonthLabel(selectedMonth)} Performance
                      </span>
                      <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', margin: '4px 0 0' }}>
                        {perfScore}%
                      </h2>
                    </div>
                    <div style={{ padding: '8px 12px', borderRadius: '8px', background: perfScore >= 80 ? 'rgba(52,211,153,0.15)' : perfScore >= 50 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)', color: perfScore >= 80 ? '#34d399' : perfScore >= 50 ? '#fbbf24' : '#f87171', fontWeight: 700, fontSize: '12.5px' }}>
                      {perfScore >= 80 ? '🏆 High Achiever' : perfScore >= 50 ? '⚡ Average' : '⚠️ Needs Push'}
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#cbd5e1', marginBottom: '6px' }}>
                      <span>Target Achievement Score</span>
                      <span style={{ fontWeight: 700 }}>{perfScore}% / 100%</span>
                    </div>
                    <div className="admin-perf-score-bar" style={{ height: '8px', background: '#0f172a' }}>
                      <div
                        className="admin-perf-score-fill"
                        style={{
                          width: `${Math.min(perfScore, 100)}%`,
                          background: perfScore >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : perfScore >= 50 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Monthly CRM Output Numbers */}
                <div className="admin-section-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Leads Contacted</span>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>{leads.contacted || 0}</div>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Assigned: {leads.assigned || 0}</span>
                  </div>

                  <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Conversions</span>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>{leads.converted || 0}</div>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Rate: {leads.conversion_rate || 0}%</span>
                  </div>

                  <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Agreements</span>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#818cf8', marginTop: '2px' }}>{agreements.count || 0}</div>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Loans: {formatCurrency(agreements.total_loan_amount)}</span>
                  </div>

                  <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Fee Collections</span>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>{formatCurrency(collections.this_month)}</div>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Total: {formatCurrency(collections.total_received)}</span>
                  </div>
                </div>
              </div>

              {/* Target vs Actual Breakdown Table */}
              <div className="admin-section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 className="admin-section-title" style={{ margin: 0 }}>
                    Target vs Actual Breakdown — {getMonthLabel(selectedMonth)}
                  </h3>
                  {tva.summary && (
                    <span className="admin-badge-id" style={{ fontSize: '11px' }}>
                      {tva.summary.achieved_count} of {tva.summary.total_metrics} Targets Achieved
                    </span>
                  )}
                </div>

                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Target</th>
                        <th>Actual</th>
                        <th>Achievement %</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(tva.rows || []).map((row, idx) => {
                        const style = getStatusColor(row.status);
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: '#f8fafc' }}>{row.metric}</td>
                            <td style={{ fontWeight: 700 }}>
                              {row.metric.includes('Collection') ? formatCurrency(row.target) : row.target}
                            </td>
                            <td style={{ fontWeight: 700, color: '#38bdf8' }}>
                              {row.metric.includes('Collection') ? formatCurrency(row.actual) : row.actual}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="admin-perf-bar" style={{ width: '80px' }}>
                                  <div
                                    className="admin-perf-fill"
                                    style={{
                                      width: `${Math.min(row.achievement_pct, 100)}%`,
                                      background: style.text
                                    }}
                                  ></div>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>{row.achievement_pct}%</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Set Monthly Target Form & 6-Month Trend Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Form to Set / Update Monthly Targets */}
                <div className="admin-section-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 className="admin-section-title" style={{ margin: 0 }}>Configure Monthly Targets</h3>
                      <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '2px 0 0' }}>
                        Set performance quotas for {getMonthLabel(selectedMonth)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={handleCopyPreviousMonth}
                      title="Copy previous month targets"
                    >
                      <Copy size={12} />
                      <span>Copy Previous</span>
                    </button>
                  </div>

                  <form onSubmit={handleSaveTarget} className="admin-form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div className="admin-form-group">
                      <label style={{ fontSize: '11.5px' }}>Leads Contacted Target</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 50"
                        value={targetForm.lead_target}
                        onChange={(e) => setTargetForm(p => ({ ...p, lead_target: e.target.value }))}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label style={{ fontSize: '11.5px' }}>Conversions Target</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 10"
                        value={targetForm.conversion_target}
                        onChange={(e) => setTargetForm(p => ({ ...p, conversion_target: e.target.value }))}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label style={{ fontSize: '11.5px' }}>New Clients Target</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 8"
                        value={targetForm.client_target}
                        onChange={(e) => setTargetForm(p => ({ ...p, client_target: e.target.value }))}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label style={{ fontSize: '11.5px' }}>Agreements Target</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 6"
                        value={targetForm.agreement_target}
                        onChange={(e) => setTargetForm(p => ({ ...p, agreement_target: e.target.value }))}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label style={{ fontSize: '11.5px' }}>Follow-ups Target</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 30"
                        value={targetForm.followup_target}
                        onChange={(e) => setTargetForm(p => ({ ...p, followup_target: e.target.value }))}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label style={{ fontSize: '11.5px' }}>Fee Collection Target (₹)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 150000"
                        value={targetForm.collection_target}
                        onChange={(e) => setTargetForm(p => ({ ...p, collection_target: e.target.value }))}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
                      <button
                        type="submit"
                        className="admin-btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '9px 0', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                        disabled={savingTarget}
                      >
                        <Save size={15} />
                        <span>{savingTarget ? 'Saving...' : `Save Targets for ${getMonthLabel(selectedMonth)}`}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* 6-Month Performance Trend Chart */}
                <div className="admin-section-card">
                  <h3 className="admin-section-title" style={{ marginBottom: '14px' }}>6-Month Performance Trend</h3>
                  {trends.length === 0 ? (
                    <div className="admin-empty-state" style={{ padding: '24px' }}>
                      <BarChart3 size={30} color="#475569" />
                      <p>No historical trends available yet</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {trends.map((tr, idx) => (
                        <div key={idx} style={{ background: '#0f172a', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, fontSize: '12.5px', color: tr.month === selectedMonth ? '#38bdf8' : '#f8fafc' }}>
                              {getMonthLabel(tr.month)} {tr.month === selectedMonth ? '(Selected)' : ''}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: tr.score >= 80 ? '#34d399' : tr.score >= 50 ? '#fbbf24' : '#f87171' }}>
                              {tr.score}% Score
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                            <span>Conversions: {tr.converted}</span>
                            <span>Agreements: {tr.agreements}</span>
                            <span>Collected: {formatCurrency(tr.collections)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Target History Audit Trail */}
              {targetHistory.length > 0 && (
                <div className="admin-section-card">
                  <h3 className="admin-section-title" style={{ marginBottom: '12px' }}>Target History Log</h3>
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Leads Target</th>
                          <th>Conversions</th>
                          <th>Clients</th>
                          <th>Agreements</th>
                          <th>Collection Target</th>
                          <th>Configured By</th>
                          <th>Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {targetHistory.map((th, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 700, color: '#38bdf8' }}>{getMonthLabel(th.month)}</td>
                            <td>{th.lead_target}</td>
                            <td>{th.conversion_target}</td>
                            <td>{th.client_target}</td>
                            <td>{th.agreement_target}</td>
                            <td style={{ fontWeight: 600, color: '#34d399' }}>{formatCurrency(th.collection_target)}</td>
                            <td style={{ fontSize: '11.5px' }}>{th.set_by_name || 'Admin'}</td>
                            <td style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {th.updated_at ? new Date(th.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASSIGNED LEADS & AGING */}
          {activeTab === 'leads' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Aging Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '11.5px', color: '#34d399', fontWeight: 600 }}>Fresh (0 - 3 Days)</span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{aging.fresh_0_3 || 0}</div>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>High conversion potential</span>
                </div>

                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '11.5px', color: '#38bdf8', fontWeight: 600 }}>Active (4 - 7 Days)</span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{aging.active_4_7 || 0}</div>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>In pipeline discussion</span>
                </div>

                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '11.5px', color: '#fbbf24', fontWeight: 600 }}>Aging (8 - 14 Days)</span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{aging.aging_8_14 || 0}</div>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>Follow-up required</span>
                </div>

                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '11.5px', color: '#f87171', fontWeight: 600 }}>Stale (15+ Days)</span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{aging.stale_15_plus || 0}</div>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>Reassignment recommended</span>
                </div>
              </div>

              {/* Assigned Leads Table */}
              <div className="admin-section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 className="admin-section-title" style={{ margin: 0 }}>Assigned Leads ({recentLeads.length})</h3>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    style={{ fontSize: '11.5px', padding: '4px 10px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    onClick={() => onOpenCRM && onOpenCRM(emp)}
                  >
                    <ExternalLink size={12} />
                    <span>View in CRM Workspace</span>
                  </button>
                </div>

                {recentLeads.length === 0 ? (
                  <div className="admin-empty-state" style={{ padding: '24px' }}>
                    <FolderOpen size={30} color="#475569" />
                    <p>No assigned leads found for this employee</p>
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Lead ID</th>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>City</th>
                          <th>Status</th>
                          <th>Assigned Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentLeads.map((lead) => (
                          <tr key={lead.id}>
                            <td><span className="admin-badge-id">{lead.lead_id || `LD-${lead.id}`}</span></td>
                            <td style={{ fontWeight: 600, color: '#f8fafc' }}>{lead.name}</td>
                            <td>{lead.phone || '—'}</td>
                            <td>{lead.city || '—'}</td>
                            <td>
                              <span className="admin-badge-id" style={{ fontSize: '11px' }}>
                                {lead.lead_status || 'New'}
                              </span>
                            </td>
                            <td style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITY & AUDIT TRAIL */}
          {activeTab === 'activity' && (
            <div className="admin-section-card">
              <h3 className="admin-section-title">Audit Log & Event History</h3>
              {activities.length === 0 ? (
                <div className="admin-empty-state" style={{ padding: '24px' }}>
                  <Activity size={30} color="#475569" />
                  <p>No activity records found for this employee</p>
                </div>
              ) : (
                <div className="admin-activity-list">
                  {activities.map((act, i) => (
                    <div key={i} className="admin-activity-item">
                      <div className="admin-activity-icon">
                        {getActionIcon(act.action)}
                      </div>
                      <div className="admin-activity-info">
                        <span className="admin-activity-action">{getActionLabel(act.action)}</span>
                        <span className="admin-activity-detail">{act.details}</span>
                      </div>
                      <span className="admin-activity-time">
                        {act.created_at ? new Date(act.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Image Zoom Lightbox Modal */}
      {zoomModal && (
        <div className="admin-modal-overlay" onClick={() => setZoomModal(null)} style={{ zIndex: 10000 }}>
          <div className="admin-modal" style={{ maxWidth: '820px', width: '94vw', background: '#0f172a', border: '1px solid #334155' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ background: '#1e293b' }}>
              <div className="admin-modal-header-left">
                <ShieldCheck size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '15px' }}>{zoomModal.title}</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setZoomModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ maxHeight: '70vh', overflow: 'auto', display: 'flex', justifyContent: 'center', background: '#020617', borderRadius: '8px', padding: '10px', border: '1px solid #1e293b', width: '100%' }}>
                <img src={zoomModal.src} alt={zoomModal.title} style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '16px', gap: '10px' }}>
                <a
                  href={zoomModal.src}
                  download="Document.png"
                  className="admin-btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '6px 14px' }}
                >
                  <Download size={14} />
                  <span>Download Full Resolution</span>
                </a>
                <button type="button" className="admin-btn-primary" onClick={() => setZoomModal(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
