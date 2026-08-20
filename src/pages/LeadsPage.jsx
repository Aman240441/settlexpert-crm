import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Filter,
  Download,
  Eye,
  Edit2,
  SquarePen,
  FileText,
  CalendarCheck,
  PhoneCall,
  UserCheck,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function LeadsPage({
  user,
  initialStatus = 'All',
  onAddLead,
  onEditLead,
  onViewLead,
  onDeleteLead,
  onConvertLead,
  onCreateAgreement,
  onFollowUp
}) {
  const [leads, setLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus || 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusCounts, setStatusCounts] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialStatus) {
      setStatusFilter(initialStatus);
      setPagination(p => ({ ...p, page: 1 }));
    }
  }, [initialStatus]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      // Employee data isolation
      if (user && user.role === 'EMPLOYEE') {
        params.append('assigned_to', user.name);
      }

      const token = localStorage.getItem('crm_token');
      const res = await fetch(`/api/leads?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      setLeads(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 });
      setStatusCounts(data.statusCounts || {});
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, pagination.page]);

  const handleFilterSubmit = (e) => {
    e?.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchLeads();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(leads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleToggleLead = (id) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const exportLeadsCSV = () => {
    const headers = ["#", "Lead ID", "Assigned Consultant", "Lead Name", "Email", "Phone", "City", "Total Outstanding", "Monthly Income", "Loan Type", "Default Status", "Harassment Calls", "Date & Time", "Lead Status"];
    const rows = leads.map((l, i) => [
      i + 1,
      l.lead_id || '',
      `"${l.assigned_consultant || ''}"`,
      `"${l.name || ''}"`,
      `"${l.email || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.city || ''}"`,
      `"${l.outstanding_amount || ''}"`,
      l.monthly_income || 0,
      `"${l.loan_type || ''}"`,
      `"${l.default_status || ''}"`,
      `"${l.harassment_calls || ''}"`,
      `"${l.created_at || ''}"`,
      `"${l.lead_status || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'SettleXpert_Leads.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statuses = ['New', 'Contacted', 'Interested', 'Follow up', 'Converted', 'Not Interested'];

  return (
    <div className="page-content">
      {/* Top Header Row with Breadcrumb, Add Lead button, and Date Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
          <span style={{ color: '#2563eb', fontWeight: 600 }}>Dashboard</span>
          <span style={{ color: '#6b7280' }}>/</span>
          <span style={{ color: '#1f2937', fontWeight: 600 }}>SettleXpert</span>
        </div>

        <button
          className="btn-dark"
          onClick={onAddLead}
          style={{
            background: '#000000',
            color: '#ffffff',
            borderRadius: '9999px',
            padding: '6px 18px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
          }}
        >
          <Plus size={14} />
          <span>Add Lead</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="input-date-pill"
            style={{ width: '130px', cursor: 'pointer', color: fromDate ? '#111827' : '#6b7280' }}
            onClick={(e) => {
              try { e.target.showPicker(); } catch (err) { }
            }}
            title="Filter from date"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="input-date-pill"
            style={{ width: '130px', cursor: 'pointer', color: toDate ? '#111827' : '#6b7280' }}
            onClick={(e) => {
              try { e.target.showPicker(); } catch (err) { }
            }}
            title="Filter to date"
          />
          <button
            type="button"
            onClick={exportLeadsCSV}
            title="Download CSV"
            style={{
              background: '#22c55e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Status Filter Pills Row */}
      <div className="status-pill-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button
          className={`status-pill-btn ${statusFilter === 'All' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('All'); setPagination(p => ({ ...p, page: 1 })); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#3b82f6', display: 'inline-block' }}></span>
          All ({statusCounts.All || 0})
        </button>
        <button
          className={`status-pill-btn ${statusFilter === 'New' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('New'); setPagination(p => ({ ...p, page: 1 })); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#3b82f6', display: 'inline-block' }}></span>
          New ({statusCounts.New || 0})
        </button>
        <button
          className={`status-pill-btn ${statusFilter === 'Contacted' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('Contacted'); setPagination(p => ({ ...p, page: 1 })); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}
        >
          <PhoneCall size={12} color="#dc2626" />
          Contacted ({statusCounts.Contacted || 0})
        </button>
        <button
          className={`status-pill-btn ${statusFilter === 'Interested' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('Interested'); setPagination(p => ({ ...p, page: 1 })); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ea580c' }}
        >
          <span style={{ fontSize: '12px' }}>📢</span>
          Interested ({statusCounts.Interested || 0})
        </button>
        <button
          className={`status-pill-btn ${statusFilter === 'Follow up' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('Follow up'); setPagination(p => ({ ...p, page: 1 })); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2563eb' }}
        >
          <Clock size={12} color="#2563eb" />
          Follow up ({statusCounts['Follow up'] || 0})
        </button>
        <button
          className={`status-pill-btn ${statusFilter === 'Converted' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('Converted'); setPagination(p => ({ ...p, page: 1 })); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ca8a04' }}
        >
          <UserCheck size={12} color="#ca8a04" />
          Converted ({statusCounts.Converted || 0})
        </button>
        <button
          className={`status-pill-btn ${statusFilter === 'Not Interested' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('Not Interested'); setPagination(p => ({ ...p, page: 1 })); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}
        >
          <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '11px' }}>✕</span>
          Not Interested ({statusCounts['Not Interested'] || 0})
        </button>
      </div>

      {/* Filter Bar with Search, Date Pills & Filter button */}
      <form className="filter-bar" onSubmit={handleFilterSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-search-pill"
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="dd-mm-yyyy"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="input-date-pill"
            style={{ width: '150px', paddingRight: '26px' }}
          />
          <Calendar size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="dd-mm-yyyy"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="input-date-pill"
            style={{ width: '150px', paddingRight: '26px' }}
          />
          <Calendar size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
        </div>
        <button
          type="submit"
          className="btn-primary-green"
          style={{ background: '#15803d', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, cursor: 'pointer' }}
        >
          <span>Filter</span>
        </button>
        {(searchTerm || fromDate || toDate) && (
          <button
            type="button"
            className="btn-pill-toggle"
            onClick={() => {
              setSearchTerm('');
              setFromDate('');
              setToDate('');
              setPagination(p => ({ ...p, page: 1 }));
              setTimeout(() => fetchLeads(), 10);
            }}
          >
            Clear
          </button>
        )}
      </form>

      {/* Dense Leads Table matching exact column layout */}
      <div className="table-responsive" style={{ background: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <table className="dense-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#fafafa', color: '#374151', textAlign: 'left' }}>
              <th style={{ width: '28px', padding: '10px 8px' }}>
                <input
                  type="checkbox"
                  checked={selectedLeads.length === leads.length && leads.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}># <span style={{ color: '#9ca3af', fontSize: '10px' }}>⇅</span></th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>Assigned Consultant Name <span style={{ color: '#9ca3af', fontSize: '10px' }}>⇅</span></th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>Lead Name <span style={{ color: '#9ca3af', fontSize: '10px' }}>⇅</span></th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>Email</th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>Phone</th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>City</th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>Total Outstanding Amount <span style={{ color: '#9ca3af', fontSize: '10px' }}>⇅</span></th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>Monthly Income <span style={{ color: '#9ca3af', fontSize: '10px' }}>⇅</span></th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>Loan Type</th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>Default Status</th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>Harassment Calls</th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>Date & Time <span style={{ color: '#9ca3af', fontSize: '10px' }}>⇅</span></th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>Lead Status <span style={{ color: '#9ca3af', fontSize: '10px' }}>⇅</span></th>
              <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>Actions <span style={{ color: '#9ca3af', fontSize: '10px' }}>⇅</span></th>
            </tr>
          </thead>
          <tbody>
            {leads.length > 0 ? (
              leads.map((lead, idx) => (
                <tr
                  key={lead.id}
                  style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.15s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '10px 8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => handleToggleLead(lead.id)}
                    />
                  </td>
                  <td style={{ padding: '10px 8px', color: '#6b7280' }}>{((pagination.page - 1) * pagination.limit) + idx + 1}</td>
                  <td style={{ padding: '10px 8px' }}>{lead.assigned_consultant || 'Dhruv'}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 600, color: '#111827' }}>
                    {lead.name}
                  </td>
                  <td style={{ padding: '10px 8px', color: '#4b5563' }}>{lead.email}</td>
                  <td style={{ padding: '10px 8px', color: '#4b5563' }}>{lead.phone}</td>
                  <td style={{ padding: '10px 8px', color: '#4b5563' }}>{lead.city}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ color: '#0284c7', fontWeight: 500 }}>
                      {lead.outstanding_amount || '₹1,00,000 - ₹5,00,000'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>{lead.monthly_income ? `₹${parseFloat(lead.monthly_income).toLocaleString('en-IN')}` : '0'}</td>
                  <td style={{ padding: '10px 8px', color: '#6b7280' }}>{lead.loan_type}</td>
                  <td style={{ padding: '10px 8px' }}>{lead.default_status}</td>
                  <td style={{ padding: '10px 8px' }}>{lead.harassment_calls}</td>
                  <td style={{ padding: '10px 8px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {lead.created_at ? new Date(lead.created_at).toLocaleString() : ''}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      fontWeight: 600,
                      color: lead.lead_status === 'Converted' ? '#15803d' : lead.lead_status === 'Not Interested' ? '#b91c1c' : '#0284c7'
                    }}>
                      {lead.lead_status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 8px' }} onClick={(e) => e.stopPropagation()}>
                    <div className="action-btn-group" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {/* 1. Create Assignment / Agreement */}
                      <button
                        className="btn-action-custom assignment"
                        title="Create Assignment / Agreement"
                        onClick={() => onCreateAgreement ? onCreateAgreement(lead) : onConvertLead?.(lead)}
                        style={{
                          width: '28px',
                          height: '28px',
                          background: '#ffffff',
                          border: '1px solid #d1d5db',
                          borderRadius: '5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#374151',
                          padding: 0,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <FileText size={13} />
                      </button>

                      {/* 2. Follow-up */}
                      <button
                        className="btn-action-custom followup"
                        title="Schedule Follow-up"
                        onClick={() => onFollowUp ? onFollowUp(lead) : onEditLead(lead)}
                        style={{
                          width: '28px',
                          height: '28px',
                          background: '#ffffff',
                          border: '1.5px solid #f59e0b',
                          borderRadius: '5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#f59e0b',
                          padding: 0,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <CalendarCheck size={14} />
                      </button>

                      {/* 3. Edit */}
                      <button
                        className="btn-action-custom edit"
                        title="Edit Lead"
                        onClick={() => onEditLead(lead)}
                        style={{
                          width: '28px',
                          height: '28px',
                          background: '#ffffff',
                          border: '1.5px solid #00a6ff',
                          borderRadius: '5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#00a6ff',
                          padding: 0,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <SquarePen size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="15" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  {loading ? 'Loading Leads...' : 'No Leads Found Matching Current Filters'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
        <span>Showing {leads.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn-action-icon"
            disabled={pagination.page <= 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontWeight: 600 }}>{pagination.page}</span>
          <button
            className="btn-action-icon"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
