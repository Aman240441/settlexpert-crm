import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Phone,
  FileCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function AgreementsPage({
  user,
  onAddAgreement,
  onEditAgreement,
  onViewAgreement,
  onDeleteAgreement
}) {
  const currentUser = user || JSON.parse(localStorage.getItem('crm_user') || 'null');
  const [agreements, setAgreements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', page);
      params.append('limit', limit);

      if (currentUser && (currentUser.role === 'EMPLOYEE' || currentUser.isImpersonated)) {
        params.append('assigned_to', currentUser.id || currentUser.name);
      }

      const token = localStorage.getItem('crm_token');
      const res = await fetch(`/api/agreements?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      setAgreements(json.data || []);
      setPagination(json.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch agreements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, [page, limit]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setPage(1);
    fetchAgreements();
  };

  return (
    <div className="page-content">
      {/* Top Heading */}
      <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Agreement List</h2>
        <button className="btn-dark" onClick={onAddAgreement}>
          <Plus size={13} />
          <span>Add Agreement</span>
        </button>
      </div>

      {/* Main Agreement Card Container */}
      <div className="section-green-box" style={{ border: '1px solid #e5e7eb', borderRadius: '6px' }}>
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '13px',
          color: '#111827'
        }}>
          <FileCheck size={15} color="#15803d" />
          <span>Agreement List</span>
        </div>

        {/* Top Controls: entries select + search */}
        <div style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4b5563' }}>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="text"
              placeholder="Search agreement, client, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '12px',
                outline: 'none',
                minWidth: '200px'
              }}
            />
            <button type="submit" className="btn-primary-green" style={{ padding: '4px 10px', fontSize: '11px' }}>
              <Search size={12} />
              <span>Search</span>
            </button>
            {searchTerm && (
              <button
                type="button"
                className="btn-pill-toggle"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                  setTimeout(() => fetchAgreements(), 10);
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Dense Table matching Screenshot 4 */}
        <div className="table-responsive" style={{ border: 'none', borderTop: '1px solid #e5e7eb' }}>
          <table className="dense-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ width: '220px' }}>User Info</th>
                <th style={{ width: '130px' }}>Phone</th>
                <th>Loan Details</th>
                <th style={{ width: '90px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agreements.length > 0 ? (
                agreements.map((ag, idx) => (
                  <tr key={ag.id}>
                    <td>{((page - 1) * limit) + idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <strong style={{ fontSize: '12.5px', color: '#111827' }}>{ag.client_name}</strong>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>{ag.email}</span>
                        {ag.pan && <span style={{ fontSize: '10.5px', color: '#9ca3af' }}>PAN: {ag.pan}</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#374151' }}>
                        <Phone size={11} color="#6b7280" />
                        <span>{ag.phone}</span>
                      </div>
                    </td>
                    <td>
                      <div className="loan-details-block" style={{ fontSize: '11.5px', lineHeight: 1.5 }}>
                        <div><strong style={{ color: '#1e293b' }}>Lender:</strong> <span style={{ color: '#475569' }}>{ag.lenders?.map(l => l.name || l.lender_name).filter(Boolean).join(', ') || ag.lender || '—'}</span></div>
                        <div><strong style={{ color: '#1e293b' }}>Loan:</strong> <span style={{ color: '#475569' }}>{ag.lenders?.map(l => l.amount || l.loan_amount).filter(Boolean).join(', ') || (ag.loan_amount ? `₹ ${Number(ag.loan_amount).toLocaleString('en-IN')}` : (ag.service_fee ? `₹ ${Number(ag.service_fee).toLocaleString('en-IN')}` : '—'))}</span></div>
                        <div><strong style={{ color: '#1e293b' }}>Type:</strong> <span style={{ color: '#475569' }}>{ag.lenders?.map(l => l.type || l.loan_type).filter(Boolean).join(', ') || ag.loan_type || 'Personal Loan'}</span></div>
                      </div>
                    </td>
                    <td>
                      <div className="action-btn-group">
                        <button className="btn-action-icon view" title="View Agreement" onClick={() => onViewAgreement(ag)}>
                          <Eye size={12} />
                        </button>
                        <button className="btn-action-icon edit" title="Edit Agreement" onClick={() => onEditAgreement(ag)}>
                          <Edit2 size={12} />
                        </button>
                        <button className="btn-action-icon delete" title="Delete Agreement" onClick={() => onDeleteAgreement(ag.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                    {loading ? 'Loading Agreements...' : 'No Agreements Found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        <div style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #e5e7eb',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <span>
            Showing {agreements.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, pagination.total)} of {pagination.total} entries
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn-pill-toggle"
              style={{ padding: '3px 10px' }}
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <button
              className="btn-pill-toggle"
              style={{ padding: '3px 10px' }}
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
