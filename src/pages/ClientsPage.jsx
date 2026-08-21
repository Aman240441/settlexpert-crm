import React, { useState, useEffect } from 'react';
import {
  Plus,
  Download,
  Eye,
  SquarePen,
  Landmark,
  Mail,
  ChevronLeft,
  ChevronRight,
  IndianRupee
} from 'lucide-react';
import AddLenderModal from '../components/AddLenderModal';

const formatINR = (val) => {
  if (val === undefined || val === null) return '₹ 0';
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  return '₹ ' + num.toLocaleString('en-IN');
};

export default function ClientsPage({
  user,
  initialCaseStatus = 'Active',
  onAddClient,
  onEditClient,
  onViewClient,
  onAddLender,
  onPayClient,
  onOpenBulkMail
}) {
  const [clients, setClients] = useState([]);
  const [caseStatus, setCaseStatus] = useState(initialCaseStatus || 'Active');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [filterType, setFilterType] = useState('Month Wise'); // 'All Data', 'Month Wise', 'Date Wise'
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('August, 2026');
  const [selectedClients, setSelectedClients] = useState([]);
  const [lenderModal, setLenderModal] = useState({ isOpen: false, client: null });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  useEffect(() => {
    if (initialCaseStatus) {
      setCaseStatus(initialCaseStatus);
      setPagination(p => ({ ...p, page: 1 }));
    }
  }, [initialCaseStatus]);

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams();
      params.append('case_status', caseStatus);
      if (searchTerm) params.append('search', searchTerm);
      if (dateFilter) params.append('date', dateFilter);

      // Employee data isolation / Manager filter
      if (user && (user.role === 'EMPLOYEE' || user.isFiltered)) {
        params.append('assigned_to', user.filterName || user.name);
      }

      const token = localStorage.getItem('crm_token');
      const res = await fetch(`/api/clients?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setClients(json.data || []);
        setPagination(json.pagination || { page: 1, limit: 50, total: json.data?.length || 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [caseStatus, searchTerm, dateFilter]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedClients(clients.map(c => c.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleToggleClient = (id) => {
    setSelectedClients(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const exportCSV = () => {
    const headers = [
      "#", "Client ID", "Name", "Phone", "Email", "City",
      "SX Fee", "Fees Date", "Fees Status", "Pending Amount",
      "Total Received Amount", "This Month Received", "Case Status",
      "Assigned Consultant Name", "Assigned Advocate Name"
    ];
    const rows = clients.map((c, i) => [
      i + 1,
      c.client_id || '',
      `"${c.name || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${c.city || ''}"`,
      c.service_fee || 0,
      `"${c.fees_date || ''}"`,
      `"${c.fees_status || ''}"`,
      c.pending_amount || 0,
      c.received_amount || 0,
      c.this_month_received || 0,
      `"${c.case_status || ''}"`,
      `"${c.assigned_consultant || ''}"`,
      `"${c.assigned_advocate || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'SettleXpert_Clients.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-content" style={{ padding: '14px 16px', background: '#f8faf9', minHeight: '100vh', boxSizing: 'border-box' }}>

      {/* 1. Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '12px' }}>
        <span style={{ color: '#2563eb', fontWeight: 600 }}>Dashboard</span>
        <span style={{ color: '#9ca3af' }}>/</span>
        <span style={{ color: '#111827', fontWeight: 600 }}>Clients</span>
      </div>

      {/* 2. Top Header Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Left: Active / Closed status pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setCaseStatus('Active')}
            style={{
              background: caseStatus === 'Active' ? '#09090b' : '#ffffff',
              color: caseStatus === 'Active' ? '#ffffff' : '#374151',
              border: '1px solid ' + (caseStatus === 'Active' ? '#09090b' : '#d1d5db'),
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>
            <span>Active</span>
          </button>

          <button
            type="button"
            onClick={() => setCaseStatus('Closed')}
            style={{
              background: caseStatus === 'Closed' ? '#09090b' : '#ffffff',
              color: caseStatus === 'Closed' ? '#ffffff' : '#374151',
              border: '1px solid ' + (caseStatus === 'Closed' ? '#09090b' : '#d1d5db'),
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
            <span>Closed</span>
          </button>
        </div>

        {/* Center: Add Client Button */}
        <div>
          <button
            type="button"
            onClick={onAddClient}
            style={{
              background: '#bbf7d0',
              color: '#14532d',
              border: '1px solid #86efac',
              borderRadius: '20px',
              padding: '4px 16px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            <Plus size={12} />
            <span>Add Client</span>
          </button>
        </div>

        {/* Right: Month Wise (with Dropdown), Month selector, Export button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

          {/* Month Wise dropdown container */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              style={{
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{filterType}</span>
            </button>

            {/* Dropdown Menu (Exact match with user screenshot) */}
            {isFilterDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 2px)',
                  left: 0,
                  background: '#ffffff',
                  border: '1px solid #475569',
                  borderRadius: '1px',
                  minWidth: '120px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  overflow: 'hidden'
                }}
              >
                {['All Data', 'Month Wise', 'Date Wise'].map((opt) => {
                  const isSelected = filterType === opt;
                  return (
                    <div
                      key={opt}
                      onClick={() => {
                        setFilterType(opt);
                        setIsFilterDropdownOpen(false);
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        background: isSelected ? '#1d64d8' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#0f172a',
                        borderBottom: opt !== 'Date Wise' ? '1px solid #f1f5f9' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      {opt}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {filterType === 'Month Wise' && (
            <input
              type="month"
              defaultValue="2026-07"
              onChange={(e) => {
                if (!e.target.value) return;
                const [y, m] = e.target.value.split('-');
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const formatted = `${monthNames[parseInt(m, 10) - 1]}, ${y}`;
                setSelectedMonth(formatted);
              }}
              style={{
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                try { e.target.showPicker(); } catch (err) { }
              }}
            />
          )}

          {filterType === 'Date Wise' && (
            <input
              type="date"
              defaultValue="2026-08-07"
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                try { e.target.showPicker(); } catch (err) { }
              }}
            />
          )}

          <button
            type="button"
            onClick={exportCSV}
            style={{
              background: '#15803d',
              color: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              padding: '4px 14px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Download size={11} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 3. Search & Date Filter Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPagination(p => ({ ...p, page: 1 }));
          }}
          style={{
            width: '200px',
            padding: '5px 12px',
            borderRadius: '20px',
            border: '1px solid #86efac',
            fontSize: '11px',
            outline: 'none',
            background: '#ffffff'
          }}
        />

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPagination(p => ({ ...p, page: 1 }));
          }}
          style={{
            width: '130px',
            padding: '5px 10px',
            borderRadius: '20px',
            border: '1px solid #86efac',
            fontSize: '11px',
            outline: 'none',
            background: '#ffffff',
            cursor: 'pointer',
            color: dateFilter ? '#111827' : '#6b7280'
          }}
          onClick={(e) => {
            try { e.target.showPicker(); } catch (err) { }
          }}
        />
      </div>

      {/* 4. Full-Width Responsive Clients Table (ZERO Horizontal Scrollbar) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        overflowX: 'hidden',
        width: '100%',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '10px',
          textAlign: 'left',
          tableLayout: 'fixed'
        }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontSize: '9.5px', height: '34px' }}>
              <th style={{ width: '22px', padding: '4px 2px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedClients.length === clients.length && clients.length > 0}
                  onChange={handleSelectAll}
                  style={{ transform: 'scale(0.85)' }}
                />
              </th>
              <th style={{ width: '22px', padding: '4px 2px', fontWeight: 600 }}># ↑↓</th>
              <th style={{ width: '48px', padding: '4px 3px', fontWeight: 600 }}>Client Id ↑↓</th>
              <th style={{ width: '88px', padding: '4px 3px', fontWeight: 600 }}>Name ↑↓</th>
              <th style={{ width: '74px', padding: '4px 3px', fontWeight: 600 }}>Phone</th>
              <th style={{ width: '135px', padding: '4px 3px', fontWeight: 600 }}>Email</th>
              <th style={{ width: '68px', padding: '4px 3px', fontWeight: 600 }}>City</th>
              <th style={{ width: '62px', padding: '4px 3px', fontWeight: 600 }}>SX Fee ↑↓</th>
              <th style={{ width: '64px', padding: '4px 3px', fontWeight: 600 }}>Fees Date ↑↓</th>
              <th style={{ width: '56px', padding: '4px 3px', fontWeight: 600 }}>Fees Status ↑↓</th>
              <th style={{ width: '58px', padding: '4px 3px', fontWeight: 600 }}>Pending Amount ↑↓</th>
              <th style={{ width: '65px', padding: '4px 3px', fontWeight: 600 }}>TotalReceived Amount ↑↓</th>
              <th style={{ width: '65px', padding: '4px 3px', fontWeight: 600 }}>This Month Received ↑↓</th>
              <th style={{ width: '48px', padding: '4px 2px', fontWeight: 600, textAlign: 'center' }}>Case Status</th>
              <th style={{ width: '45px', padding: '4px 3px', fontWeight: 600 }}>Assigned Consultant Name</th>
              <th style={{ width: '85px', padding: '4px 3px', fontWeight: 600 }}>Assigned Advocate Name</th>
              <th style={{ width: '68px', padding: '4px 2px', fontWeight: 600, textAlign: 'center' }}>Actions ↑↓</th>
            </tr>
          </thead>
          <tbody>
            {clients.length > 0 ? (
              clients.map((c, idx) => (
                <tr key={c.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa', height: '32px' }}>
                  <td style={{ padding: '4px 2px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(c.id)}
                      onChange={() => handleToggleClient(c.id)}
                      style={{ transform: 'scale(0.85)' }}
                    />
                  </td>
                  <td style={{ padding: '4px 2px', color: '#6b7280' }}>{idx + 1}</td>
                  <td style={{ padding: '4px 3px', color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.client_id}
                  </td>
                  <td style={{ padding: '4px 3px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.name}>
                    {c.name}
                  </td>
                  <td style={{ padding: '4px 3px', color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.phone}
                  </td>
                  <td style={{ padding: '4px 3px', color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.email}>
                    {c.email}
                  </td>
                  <td style={{ padding: '4px 3px', color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.city}>
                    {c.city}
                  </td>
                  <td style={{ padding: '4px 3px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {parseFloat(c.service_fee || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '4px 3px', color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.fees_date || '07 Aug 2026'}
                  </td>

                  {/* Fees Status Column */}
                  <td style={{
                    padding: '4px 3px',
                    background: c.fees_status === 'Paid' ? '#def7ec' : '#fde8e8',
                    color: c.fees_status === 'Paid' ? '#057a55' : '#e02424',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {c.fees_status || (c.pending_amount > 0 ? 'Pending' : 'Paid')}
                  </td>

                  {/* Pending Amount Column */}
                  <td style={{
                    padding: '4px 3px',
                    background: c.pending_amount > 0 ? '#fde8e8' : '#def7ec',
                    color: c.pending_amount > 0 ? '#e02424' : '#057a55',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatINR(c.pending_amount)}
                  </td>

                  {/* TotalReceived Amount */}
                  <td style={{
                    padding: '4px 3px',
                    background: '#def7ec',
                    color: '#057a55',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatINR(c.received_amount)}
                  </td>

                  {/* This Month Received */}
                  <td style={{
                    padding: '4px 3px',
                    background: '#def7ec',
                    color: '#057a55',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatINR(c.this_month_received)}
                  </td>

                  {/* Case Status */}
                  <td style={{ padding: '4px 2px', textAlign: 'center' }}>
                    <span style={{
                      background: '#15803d',
                      color: '#ffffff',
                      borderRadius: '10px',
                      padding: '1px 6px',
                      fontSize: '9px',
                      fontWeight: 600,
                      display: 'inline-block'
                    }}>
                      {c.case_status || 'Active'}
                    </span>
                  </td>

                  <td style={{ padding: '4px 3px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.assigned_consultant || 'Dhruv'}
                  </td>
                  <td style={{ padding: '4px 3px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.assigned_advocate}>
                    {c.assigned_advocate || 'Adv Kalia Sudharani'}
                  </td>

                  {/* Action Buttons: 3 Icons (View, Edit, Add Lender) */}
                  <td style={{ padding: '4px 2px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <button
                        type="button"
                        onClick={() => onViewClient ? onViewClient(c) : onEditClient?.(c)}
                        title="View Details"
                        style={{
                          width: '19px',
                          height: '19px',
                          background: '#ffffff',
                          border: '1px solid #38bdf8',
                          borderRadius: '3px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#0284c7',
                          padding: 0
                        }}
                      >
                        <Eye size={10} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditClient ? onEditClient(c) : onViewClient?.(c)}
                        title="Edit Client"
                        style={{
                          width: '19px',
                          height: '19px',
                          background: '#ffffff',
                          border: '1px solid #fbbf24',
                          borderRadius: '3px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#d97706',
                          padding: 0
                        }}
                      >
                        <SquarePen size={10} />
                      </button>

                      {/* Add Lender Button */}
                      <button
                        type="button"
                        onClick={() => onAddLender ? onAddLender(c) : setLenderModal({ isOpen: true, client: c })}
                        title="Add Lender"
                        style={{
                          width: '19px',
                          height: '19px',
                          background: '#ffffff',
                          border: '1px solid #818cf8',
                          borderRadius: '3px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#4f46e5',
                          padding: 0
                        }}
                      >
                        <Landmark size={10} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="17" style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  No Clients Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Bottom Controls: Send Bulk Mail & Pagination */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '14px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Send Bulk Mail Button */}
        <button
          type="button"
          onClick={() => onOpenBulkMail(selectedClients)}
          style={{
            background: '#09090b',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 16px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          <Mail size={12} />
          <span>Send Bulk Mail {selectedClients.length > 0 ? `(${selectedClients.length})` : ''}</span>
        </button>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            style={{
              background: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              padding: '2px 5px',
              cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
              color: '#374151'
            }}
          >
            <ChevronLeft size={12} />
          </button>

          <span style={{
            background: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '3px',
            padding: '2px 7px',
            fontSize: '10.5px',
            fontWeight: 600
          }}>
            {pagination.page}
          </span>

          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            style={{
              background: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              padding: '2px 5px',
              cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
              color: '#374151'
            }}
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Add Lender Modal */}
      <AddLenderModal
        isOpen={lenderModal.isOpen}
        client={lenderModal.client}
        onClose={() => setLenderModal({ isOpen: false, client: null })}
        onSave={(clientId, updatedLenders) => {
          setClients(prev => prev.map(cl => cl.id === clientId ? { ...cl, lenders: updatedLenders } : cl));
        }}
      />

    </div>
  );
}
