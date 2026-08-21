import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  UserMinus,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  IndianRupee,
  Eye,
  SquarePen,
  Landmark,
  Trash2,
  Target
} from 'lucide-react';

const formatINR = (val) => {
  if (val === undefined || val === null) return '₹0';
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  return '₹' + num.toLocaleString('en-IN');
};

export default function DashboardPage({
  user,
  onNavigate,
  onNavigateLeads,
  onNavigateClients,
  onEditClient,
  onViewClient,
  onAddLender,
  onDeleteClient,
  onPayClient
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('August, 2026');
  const [monthlyTarget, setMonthlyTarget] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (user && (user.role === 'EMPLOYEE' || user.isFiltered)) {
        params.append('assigned_to', user.filterName || user.name);
      }
      const url = params.toString() ? `/api/dashboard/summary?${params.toString()}` : '/api/dashboard/summary';
      const token = localStorage.getItem('crm_token');
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyTarget = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      if (!token) return;
      const res = await fetch('/api/employee/monthly-target', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMonthlyTarget(json);
      }
    } catch (err) {
      console.error('Failed to fetch employee monthly target:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchMonthlyTarget();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        Loading CRM Dashboard...
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const pipeline = data?.leadPipeline || {};
  const business = data?.businessSummary || {};
  const userWise = data?.userWiseSummary || [];
  const advocateWise = data?.advocateWiseSummary || [];
  const activeClients = data?.activeClientsList || [];

  return (
    <div className="page-content">
      {/* Top Heading */}
      <div className="dashboard-heading">
        <h1>Welcome to CRM Dashboard</h1>
        <p>Overview of your business performance</p>
      </div>

      {/* Employee Monthly Target Card */}
      {user && user.role === 'EMPLOYEE' && (
        <div className="section-green-box" style={{ marginBottom: '20px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
          <div className="section-green-header" style={{ background: '#1e40af', padding: '10px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={16} />
              <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>
                MONTHLY TARGET — {monthlyTarget?.month_label || 'AUGUST 2026'}
              </span>
            </div>
            <span className="realtime-tag" style={{ background: monthlyTarget?.target_set ? (monthlyTarget?.status === 'Target Achieved' ? '#16a34a' : '#2563eb') : '#64748b' }}>
              {monthlyTarget?.target_set ? (monthlyTarget?.status || 'Active Target') : 'Target Not Set'}
            </span>
          </div>

          <div style={{ padding: '16px 20px', background: '#ffffff' }}>
            {!monthlyTarget?.target_set ? (
              <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11.5px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Collection Target
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#9ca3af' }}>
                    Target Not Set
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#6b7280', background: '#f3f4f6', padding: '8px 14px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  ℹ️ Admin has not assigned a collection target for this month.
                </div>
              </div>
            ) : (
              <div>
                {/* 4 Metric Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Collection Target
                    </span>
                    <strong style={{ fontSize: '20px', color: '#1e293b' }}>
                      {formatINR(monthlyTarget.collection_target)}
                    </strong>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px' }}>
                    <span style={{ fontSize: '11.5px', color: '#166534', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Collected
                    </span>
                    <strong style={{ fontSize: '20px', color: '#15803d' }}>
                      {formatINR(monthlyTarget.collected)}
                    </strong>
                  </div>

                  <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '12px 14px' }}>
                    <span style={{ fontSize: '11.5px', color: '#854d0e', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Remaining
                    </span>
                    <strong style={{ fontSize: '20px', color: '#a16207' }}>
                      {formatINR(monthlyTarget.remaining)}
                    </strong>
                  </div>

                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 14px' }}>
                    <span style={{ fontSize: '11.5px', color: '#1e40af', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Achievement
                    </span>
                    <strong style={{ fontSize: '20px', color: monthlyTarget.achievement >= 100 ? '#15803d' : (monthlyTarget.achievement >= 80 ? '#2563eb' : '#d97706') }}>
                      {monthlyTarget.achievement}%
                    </strong>
                  </div>
                </div>

                {/* Progress Bar with target vs actual comparison */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>
                    <span>{formatINR(monthlyTarget.collected)} / {formatINR(monthlyTarget.collection_target)}</span>
                    <span style={{ color: monthlyTarget.achievement >= 100 ? '#15803d' : (monthlyTarget.achievement >= 80 ? '#2563eb' : '#d97706') }}>
                      {monthlyTarget.achievement}%
                    </span>
                  </div>
                  <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(monthlyTarget.achievement || 0, 100)}%`,
                        background: monthlyTarget.achievement >= 100 ? '#16a34a' : (monthlyTarget.achievement >= 80 ? '#2563eb' : (monthlyTarget.achievement >= 50 ? '#eab308' : '#ef4444')),
                        borderRadius: '5px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 11 KPI Cards */}
      <div className="kpi-grid">
        <div
          className="kpi-card"
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
          onClick={() => onNavigateLeads ? onNavigateLeads() : onNavigate?.('leads')}
          title="Click to view Leads"
        >
          <div className="kpi-top">
            <span className="kpi-label">TOTAL LEADS</span>
            <Users size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value">{kpis.totalLeads ?? 0}</div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateClients?.('Active')}>
          <div className="kpi-top">
            <span className="kpi-label">TOTAL CLIENTS</span>
            <UserCheck size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value">{kpis.totalClients ?? 0}</div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateLeads?.('Converted')}>
          <div className="kpi-top">
            <span className="kpi-label">CONVERSION</span>
            <TrendingUp size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value blue">{kpis.conversion || '0.0%'}</div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateClients?.('Active')}>
          <div className="kpi-top">
            <span className="kpi-label">ACTIVE CLIENTS</span>
            <UserCheck size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value green">{kpis.activeClients ?? 0}</div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateClients?.('Dropped')}>
          <div className="kpi-top">
            <span className="kpi-label">TOTAL DROPPED</span>
            <UserMinus size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value red">{kpis.totalDroppedClients ?? 0}</div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateClients?.('Active')}>
          <div className="kpi-top">
            <span className="kpi-label">THIS MO EXPECTED</span>
            <Calendar size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value">{formatINR(kpis.thisMonthExpected)}</div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateClients?.('Active')}>
          <div className="kpi-top">
            <span className="kpi-label">NEXT MO EXPECTED</span>
            <Calendar size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value">{formatINR(kpis.nextMonthExpected)}</div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate?.('receipts')}>
          <div className="kpi-top">
            <span className="kpi-label">THIS MO COLLECTION</span>
            <DollarSign size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value green">{formatINR(kpis.thisMonthCollection)}</div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateClients?.('Active')}>
          <div className="kpi-top">
            <span className="kpi-label">THIS MO PENDING</span>
            <Clock size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value red">{formatINR(kpis.thisMonthPending)}</div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateClients?.('Dropped')}>
          <div className="kpi-top">
            <span className="kpi-label">THIS MO DROP</span>
            <AlertCircle size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value red">{formatINR(kpis.thisMonthDrop)}</div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateClients?.('Dropped')}>
          <div className="kpi-top">
            <span className="kpi-label">THIS MO DROPPED</span>
            <UserMinus size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value red">{kpis.thisMonthDroppedClients ?? 0}</div>
        </div>
      </div>

      {/* Lead Pipeline Summary */}
      <div className="pipeline-bar">
        <div className="pipeline-item" style={{ cursor: 'pointer' }} onClick={() => onNavigateLeads?.('New')}>
          <span className="pipe-title">New</span>
          <span className="pipe-num">{pipeline['New'] ?? 0}</span>
        </div>
        <div className="pipeline-item" style={{ cursor: 'pointer' }} onClick={() => onNavigateLeads?.('Contacted')}>
          <span className="pipe-title">Contacted</span>
          <span className="pipe-num">{pipeline['Contacted'] ?? 0}</span>
        </div>
        <div className="pipeline-item" style={{ cursor: 'pointer' }} onClick={() => onNavigateLeads?.('Interested')}>
          <span className="pipe-title">Interested</span>
          <span className="pipe-num">{pipeline['Interested'] ?? 0}</span>
        </div>
        <div className="pipeline-item" style={{ cursor: 'pointer' }} onClick={() => onNavigateLeads?.('Follow up')}>
          <span className="pipe-title">Follow Up</span>
          <span className="pipe-num">{pipeline['Follow Up'] ?? 0}</span>
        </div>
        <div className="pipeline-item" style={{ cursor: 'pointer' }} onClick={() => onNavigateLeads?.('Converted')}>
          <span className="pipe-title">Converted</span>
          <span className="pipe-num">{pipeline['Converted'] ?? 0}</span>
        </div>
        <div className="pipeline-item" style={{ cursor: 'pointer' }} onClick={() => onNavigateLeads?.('Not Interested')}>
          <span className="pipe-title">Not Interested</span>
          <span className="pipe-num">{pipeline['Not Interested'] ?? 0}</span>
        </div>
      </div>

      {/* Business Summary */}
      <div className="section-green-box">
        <div className="section-green-header">
          <span>Business Summary</span>
          <span className="realtime-tag">Real-time</span>
        </div>
        <div className="business-summary-content">
          <div className="business-top-metrics">
            <span>Total Clients: <strong>{business.totalClients ?? 0}</strong></span>
            <span>Currently Active: <strong>{business.currentlyActive ?? 0}</strong></span>
            <span>Dropped: <strong>{business.dropped ?? 0}</strong></span>
          </div>

          <div className="monthly-blocks-grid">
            {(business.months || []).map((m, idx) => (
              <div className="month-card" key={idx}>
                <h4>{m.month}</h4>
                <div className="month-metric-row">
                  <span>Target:</span>
                  <span>{formatINR(m.target)}</span>
                </div>
                <div className="month-metric-row">
                  <span>Collection:</span>
                  <span className="text-collection-green">{formatINR(m.collection)}</span>
                </div>
                <div className="month-metric-row">
                  <span>Drop:</span>
                  <span className="text-drop-red">{formatINR(m.drop)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Wise Summary */}
      <div className="section-green-box">
        <div className="section-green-header">
          <span>User Wise Summary</span>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="August, 2026">August, 2026</option>
            <option value="July, 2026">July, 2026</option>
            <option value="June, 2026">June, 2026</option>
          </select>
        </div>
        <div className="table-responsive">
          <table className="dense-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Allocated</th>
                <th>City</th>
                <th>New Clients</th>
                <th>New Client Collection</th>
                <th>Active Client</th>
                <th>Dropped</th>
                <th>Dropped Amount</th>
                <th>Total Target</th>
                <th>Current Month Collection</th>
                <th>To Be Collected</th>
                <th>Next Month Expected</th>
              </tr>
            </thead>
            <tbody>
              {userWise.length > 0 ? (
                userWise.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.s_no}</td>
                    <td><strong>{row.allocated}</strong></td>
                    <td>{row.city}</td>
                    <td>{row.new_clients}</td>
                    <td>{formatINR(row.new_client_collection)}</td>
                    <td>{row.active_client}</td>
                    <td>{row.dropped}</td>
                    <td>{formatINR(row.dropped_amount)}</td>
                    <td>{formatINR(row.total_target)}</td>
                    <td className="text-collection-green">{formatINR(row.current_month_collection)}</td>
                    <td className="text-drop-red">{formatINR(row.to_be_collected)}</td>
                    <td>{formatINR(row.next_month_expected)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                    No Data Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advocate Wise Summary */}
      <div className="section-green-box">
        <div className="section-green-header">
          <span>Advocate Wise Summary</span>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="August, 2026">August, 2026</option>
            <option value="July, 2026">July, 2026</option>
            <option value="June, 2026">June, 2026</option>
          </select>
        </div>
        <div className="table-responsive">
          <table className="dense-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Advocate</th>
                <th>Address</th>
                <th>New Clients</th>
                <th>New Client Collection</th>
                <th>Active Client</th>
                <th>Dropped</th>
                <th>Dropped Amount</th>
                <th>Current Month Collection</th>
                <th>To Be Collected</th>
                <th>Next Month Expected</th>
              </tr>
            </thead>
            <tbody>
              {advocateWise.length > 0 ? (
                advocateWise.map((adv, idx) => (
                  <tr key={idx}>
                    <td>{adv.s_no}</td>
                    <td><strong>{adv.advocate}</strong></td>
                    <td>{adv.address}</td>
                    <td>{adv.new_clients}</td>
                    <td>{formatINR(adv.new_client_collection)}</td>
                    <td>{adv.active_client}</td>
                    <td>{adv.dropped}</td>
                    <td>{formatINR(adv.dropped_amount)}</td>
                    <td className="text-collection-green">{formatINR(adv.current_month_collection)}</td>
                    <td className="text-drop-red">{formatINR(adv.to_be_collected)}</td>
                    <td>{formatINR(adv.next_month_expected)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                    No Data Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Clients Table */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Active Clients</h3>
        </div>
        <div className="table-responsive">
          <table className="dense-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>City</th>
                <th>Total Outstanding</th>
                <th>SX Service Fee</th>
                <th>Fees Date</th>
                <th>Fees Status</th>
                <th>Pending Amount</th>
                <th>Received Amount</th>
                <th>Case Status</th>
                <th>Assigned Consultant</th>
                <th>Assigned Advocate</th>
                <th style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeClients.length > 0 ? (
                activeClients.map((client, idx) => (
                  <tr key={client.id || idx}>
                    <td>{idx + 1}</td>
                    <td><strong>{client.name}</strong></td>
                    <td>{client.phone}</td>
                    <td>{client.city}</td>
                    <td><span className="badge-outstanding-blue">50,000 - 1,00,000</span></td>
                    <td>{formatINR(client.service_fee)}</td>
                    <td>{client.fees_date}</td>
                    <td>
                      <span className={client.fees_status === 'Paid' ? 'badge-paid' : 'badge-pending'}>
                        {client.fees_status}
                      </span>
                    </td>
                    <td className={client.pending_amount > 0 ? 'cell-pending-red' : ''}>
                      {formatINR(client.pending_amount)}
                    </td>
                    <td className="cell-received-green">
                      {formatINR(client.received_amount)}
                    </td>
                    <td>
                      <span className={client.case_status === 'Active' ? 'badge-active' : 'badge-closed'}>
                        {client.case_status}
                      </span>
                    </td>
                    <td>{client.assigned_consultant || 'Dhruv'}</td>
                    <td>{client.assigned_advocate || 'Adv Sparsh Gupta'}</td>
                    <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        {/* 1. VIEW DETAILS */}
                        <button
                          type="button"
                          title="View Details"
                          aria-label="View Details"
                          onClick={() => onViewClient && onViewClient(client)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            border: '1px solid #bfdbfe',
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 150ms ease',
                            padding: 0
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#dbeafe';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#eff6ff';
                          }}
                        >
                          <Eye size={15} />
                        </button>

                        {/* 2. EDIT CLIENT */}
                        <button
                          type="button"
                          title="Edit Client"
                          aria-label="Edit Client"
                          onClick={() => onEditClient && onEditClient(client)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            border: '1px solid #fde68a',
                            background: '#fffbeb',
                            color: '#d97706',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 150ms ease',
                            padding: 0
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fef3c7';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fffbeb';
                          }}
                        >
                          <SquarePen size={15} />
                        </button>

                        {/* 3. ADD LENDER */}
                        <button
                          type="button"
                          title="Add Lender"
                          aria-label="Add Lender"
                          onClick={() => onAddLender && onAddLender(client)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            border: '1px solid #bbf7d0',
                            background: '#f0fdf4',
                            color: '#15803d',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 150ms ease',
                            padding: 0
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#dcfce7';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f0fdf4';
                          }}
                        >
                          <Landmark size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="14" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                    No Active Clients Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
