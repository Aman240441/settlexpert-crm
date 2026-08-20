import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, UserX, AlertCircle, Calculator, Shuffle, CheckCircle2 } from 'lucide-react';

export default function AssignLeadModal({ isOpen, onClose, lead, leads = [], employees = [], onAssigned }) {
  const isBulk = Array.isArray(leads) && leads.length > 0;
  const targetLead = lead || (isBulk ? leads[0] : null);
  const activeEmployees = employees.filter(emp => emp.status === 'active');

  const [bulkMode, setBulkMode] = useState('single'); // 'single' | 'equal' | 'custom_counts'
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [customCounts, setCustomCounts] = useState({});
  const [assignNotes, setAssignNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setAssignNotes('');
      setBulkMode('single');
      setSelectedEmpIds(activeEmployees.map(e => e.id));
      setCustomCounts({});
      if (!isBulk && targetLead) {
        setSelectedEmpId(targetLead.assigned_to || '');
      } else {
        setSelectedEmpId('');
      }
    }
  }, [isOpen, targetLead, isBulk]);

  if (!isOpen) return null;

  const totalSelectedLeads = isBulk ? leads.length : 1;

  // Calculate sum of custom counts
  const totalAllocatedCustom = Object.values(customCounts).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
  const remainingCustom = totalSelectedLeads - totalAllocatedCustom;

  // Quick auto-split for custom counts
  const handleAutoSplit = () => {
    if (activeEmployees.length === 0) return;
    const base = Math.floor(totalSelectedLeads / activeEmployees.length);
    let rem = totalSelectedLeads % activeEmployees.length;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isBulk) {
      if (bulkMode === 'single' && !selectedEmpId) {
        // allowing unassign
      } else if (bulkMode === 'equal' && selectedEmpIds.length === 0) {
        setError('Please select at least one employee for equal distribution');
        return;
      } else if (bulkMode === 'custom_counts') {
        if (totalAllocatedCustom === 0) {
          setError('Please type lead counts for at least one employee');
          return;
        }
        if (totalAllocatedCustom > totalSelectedLeads) {
          setError(`Total allocated leads (${totalAllocatedCustom}) exceeds selected leads (${totalSelectedLeads})`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('crm_token');
      const empIdVal = selectedEmpId ? parseInt(selectedEmpId, 10) : null;

      if (isBulk) {
        const payload = {
          lead_ids: leads.map(l => l.id),
          mode: bulkMode,
          notes: assignNotes
        };

        if (bulkMode === 'single') {
          payload.employee_id = empIdVal;
        } else if (bulkMode === 'equal') {
          payload.employee_ids = selectedEmpIds;
        } else if (bulkMode === 'custom_counts') {
          payload.custom_counts = customCounts;
        }

        const res = await fetch('/api/admin/leads/bulk-assign', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to bulk assign leads');
        onAssigned(data.message);
      } else {
        // Single lead assignment
        const res = await fetch(`/api/admin/leads/${targetLead.id}/assign`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            employee_id: empIdVal,
            notes: assignNotes
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to assign lead');
        onAssigned(data.message);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: isBulk && bulkMode === 'custom_counts' ? '560px' : '480px' }} onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="admin-modal-header-left">
            <UserCheck size={18} className="admin-modal-icon" />
            <h3>{isBulk ? `Assign ${leads.length} Selected Leads` : 'Assign Employee'}</h3>
          </div>
          <button className="admin-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="admin-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-modal-form">
          {!isBulk && targetLead && (
            <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{targetLead.name}</div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '3px' }}>
                Phone: {targetLead.phone || '—'} | City: {targetLead.city || '—'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#818cf8', marginTop: '4px' }}>
                Currently: {targetLead.employee_name || targetLead.assigned_consultant || 'Unassigned'}
              </div>
            </div>
          )}

          {isBulk && (
            <div style={{ marginBottom: '16px' }}>
              {/* Distribution Mode Tabs */}
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                Distribution Method for {leads.length} Leads:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setBulkMode('single')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: bulkMode === 'single' ? 'rgba(129,140,248,0.18)' : '#1e293b',
                    color: bulkMode === 'single' ? '#818cf8' : '#94a3b8',
                    border: `1px solid ${bulkMode === 'single' ? '#818cf8' : '#334155'}`
                  }}
                >
                  Single Employee
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMode('equal')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: bulkMode === 'equal' ? 'rgba(52,211,153,0.18)' : '#1e293b',
                    color: bulkMode === 'equal' ? '#34d399' : '#94a3b8',
                    border: `1px solid ${bulkMode === 'equal' ? '#34d399' : '#334155'}`
                  }}
                >
                  Equal Split
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMode('custom_counts')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: bulkMode === 'custom_counts' ? 'rgba(56,189,248,0.18)' : '#1e293b',
                    color: bulkMode === 'custom_counts' ? '#38bdf8' : '#94a3b8',
                    border: `1px solid ${bulkMode === 'custom_counts' ? '#38bdf8' : '#334155'}`
                  }}
                >
                  Type Counts
                </button>
              </div>
            </div>
          )}

          {/* SINGLE MODE */}
          {(!isBulk || bulkMode === 'single') && (
            <div className="admin-form-group">
              <label>{isBulk ? 'Assign All Selected Leads To *' : 'Assign To Employee *'}</label>
              <select
                value={selectedEmpId}
                onChange={e => setSelectedEmpId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
              >
                <option value="">-- Unassigned (Remove Assignment) --</option>
                {activeEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.designation ? `— ${emp.designation}` : ''} ({emp.employee_id || `ID: ${emp.id}`})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* EQUAL SPLIT MODE */}
          {isBulk && bulkMode === 'equal' && (
            <div className="admin-form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Select Employees for Equal Split ({selectedEmpIds.length} chosen):</span>
                <span style={{ color: '#34d399', fontSize: '11.5px' }}>
                  ≈ {selectedEmpIds.length > 0 ? Math.floor(leads.length / selectedEmpIds.length) : 0} leads each
                </span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', maxHeight: '180px', overflowY: 'auto', padding: '6px', background: '#0f172a', borderRadius: '6px', border: '1px solid #334155' }}>
                {activeEmployees.map(emp => (
                  <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: '#1e293b', padding: '6px 8px', borderRadius: '4px', border: '1px solid #334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedEmpIds.includes(emp.id)}
                      onChange={() => {
                        setSelectedEmpIds(prev => prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id]);
                      }}
                      style={{ accentColor: '#34d399' }}
                    />
                    <span style={{ color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOM TYPE COUNTS MODE */}
          {isBulk && bulkMode === 'custom_counts' && (
            <div className="admin-form-group">
              {/* Counter Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', marginBottom: '10px' }}>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  Selected: <strong style={{ color: '#e2e8f0' }}>{leads.length}</strong> | Allocated: <strong style={{ color: '#38bdf8' }}>{totalAllocatedCustom}</strong>
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: remainingCustom === 0 ? '#34d399' : remainingCustom > 0 ? '#fbbf24' : '#f87171' }}>
                  {remainingCustom === 0 ? '✓ All Leads Allocated' : remainingCustom > 0 ? `${remainingCustom} Remaining` : `Overallocated by ${Math.abs(remainingCustom)}!`}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={handleAutoSplit}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: '11px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    color: '#38bdf8',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Auto Split Evenly
                </button>
                <button
                  type="button"
                  onClick={handleClearCounts}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
              </div>

              {/* Employees Count Inputs */}
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '6px', background: '#0f172a', padding: '4px' }}>
                {activeEmployees.map(emp => {
                  const count = customCounts[emp.id] !== undefined ? customCounts[emp.id] : '';
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
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {emp.name}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                          {emp.designation || 'Consultant'} ({emp.employee_id || `ID: ${emp.id}`})
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          min="0"
                          max={leads.length}
                          placeholder="0"
                          value={count}
                          onChange={e => handleCustomCountChange(emp.id, e.target.value)}
                          style={{
                            width: '70px',
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
                        <span style={{ fontSize: '11px', color: '#64748b', width: '32px' }}>leads</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="admin-form-group">
            <label>Reason / Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Workload balancing, target allocation..."
              value={assignNotes}
              onChange={e => setAssignNotes(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px' }}
            />
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="admin-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn-primary" disabled={loading}>
              <UserCheck size={15} />
              <span>{loading ? 'Assigning...' : isBulk ? `Distribute ${leads.length} Leads` : 'Assign Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
