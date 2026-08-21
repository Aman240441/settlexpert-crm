import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import ClientsPage from './pages/ClientsPage';
import AgreementsPage from './pages/AgreementsPage';
import CreateAgreementPage from './pages/CreateAgreementPage';
import FollowUpPage from './pages/FollowUpPage';
import EditLeadPage from './pages/EditLeadPage';
import ClientDetailsPage from './pages/ClientDetailsPage';
import EditClientPage from './pages/EditClientPage';
import AddClientPage from './pages/AddClientPage';
import AddLenderPage from './pages/AddLenderPage';
import LoginPage from './pages/LoginPage';
import AdminPanelPage from './pages/AdminPanelPage';
import AdminEmployeeDetailPage from './pages/AdminEmployeeDetailPage';
import LeadModal from './components/LeadModal';
import ClientModal from './components/ClientModal';
import AgreementModal from './components/AgreementModal';
import AgreementPreviewModal from './components/AgreementPreviewModal';
import BulkMailModal from './components/BulkMailModal';
import RecordPaymentModal from './components/RecordPaymentModal';
import ConvertLeadModal from './components/ConvertLeadModal';
import FollowUpModal from './components/FollowUpModal';
import CreateEmployeeModal from './components/CreateEmployeeModal';
import { CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Eye, ArrowLeft } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'leads', 'clients', 'agreements', 'create_agreement', 'view_agreement', 'follow_up', 'edit_lead', 'client_details', 'edit_client', 'add_lender', 'add_client'
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [createAgreementLead, setCreateAgreementLead] = useState(null);
  const [editingAgreement, setEditingAgreement] = useState(null);
  const [selectedViewAgreement, setSelectedViewAgreement] = useState(null);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [editLeadData, setEditLeadData] = useState(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState(null);
  const [editClientData, setEditClientData] = useState(null);
  const [selectedLenderClient, setSelectedLenderClient] = useState(null);

  // Admin panel state
  const [adminViewEmployee, setAdminViewEmployee] = useState(null);
  const [crmViewEmployee, setCrmViewEmployee] = useState(null);
  const [editEmployeeModalTarget, setEditEmployeeModalTarget] = useState(null);

  // Modals state
  const [leadFilterStatus, setLeadFilterStatus] = useState('All');
  const [clientFilterStatus, setClientFilterStatus] = useState('Active');
  const [clientReturnPage, setClientReturnPage] = useState('clients');
  const [managerPortalMode, setManagerPortalMode] = useState(user?.role === 'ADMIN');
  const [managerFilterEmp, setManagerFilterEmp] = useState(null);
  const [employeesList, setEmployeesList] = useState([]);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
      fetch('/api/admin/employees', { headers: authHeaders() })
        .then(r => r.json())
        .then(d => setEmployeesList(d.data || []))
        .catch(() => {});
    }
  }, [user?.id, user?.role]);

  const [leadModal, setLeadModal] = useState({ isOpen: false, lead: null, isViewOnly: false });
  const [followUpModal, setFollowUpModal] = useState({ isOpen: false, lead: null });
  const [clientModal, setClientModal] = useState({ isOpen: false, client: null, isViewOnly: false });
  const [agreementModal, setAgreementModal] = useState({ isOpen: false, agreement: null, isViewOnly: false });
  const [agreementPreviewModal, setAgreementPreviewModal] = useState({ isOpen: false, agreement: null });
  const [bulkMailModal, setBulkMailModal] = useState({ isOpen: false, selectedClients: [] });
  const [recordPaymentModal, setRecordPaymentModal] = useState({ isOpen: false, client: null });
  const [convertLeadModal, setConvertLeadModal] = useState({ isOpen: false, lead: null });

  // Key to force refresh page data when mutations occur
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Capacitor Android Hardware Back Button Support
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.App) {
      const AppPlugin = window.Capacitor.Plugins.App;
      const listener = AppPlugin.addListener('backButton', ({ canGoBack }) => {
        if (leadModal.isOpen) {
          setLeadModal({ isOpen: false, lead: null, isViewOnly: false });
        } else if (clientModal.isOpen) {
          setClientModal({ isOpen: false, client: null, isViewOnly: false });
        } else if (agreementModal.isOpen) {
          setAgreementModal({ isOpen: false, agreement: null, isViewOnly: false });
        } else if (agreementPreviewModal.isOpen) {
          setAgreementPreviewModal({ isOpen: false, agreement: null });
        } else if (recordPaymentModal.isOpen) {
          setRecordPaymentModal({ isOpen: false, client: null });
        } else if (convertLeadModal.isOpen) {
          setConvertLeadModal({ isOpen: false, lead: null });
        } else if (followUpModal.isOpen) {
          setFollowUpModal({ isOpen: false, lead: null });
        } else if (bulkMailModal.isOpen) {
          setBulkMailModal({ isOpen: false, selectedClients: [] });
        } else if (adminViewEmployee) {
          setAdminViewEmployee(null);
        } else if (currentPage !== 'dashboard') {
          setCurrentPage('dashboard');
        } else {
          AppPlugin.exitApp();
        }
      });
      return () => {
        if (listener && typeof listener.then === 'function') {
          listener.then(h => h.remove());
        }
      };
    }
  }, [leadModal, clientModal, agreementModal, agreementPreviewModal, recordPaymentModal, convertLeadModal, followUpModal, bulkMailModal, adminViewEmployee, currentPage]);

  const handleLogout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setUser(null);
    setAdminViewEmployee(null);
    setCrmViewEmployee(null);
    setManagerFilterEmp(null);
    showToast('Logged out successfully');
  };

  const authHeaders = () => {
    const token = localStorage.getItem('crm_token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  const handleOpenCRM = async (emp) => {
    try {
      await fetch(`/api/admin/employees/${emp.id}/audit`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'OPEN_EMPLOYEE_CRM', details: `${user.role === 'ADMIN' ? 'Admin' : 'Manager'} opened CRM workspace for ${emp.name} (${emp.employee_id})` })
      });
    } catch (e) {
      console.error('Failed to log Open CRM audit:', e);
    }
    setCrmViewEmployee(emp);
    setAdminViewEmployee(null);
    setManagerPortalMode(false);
    setCurrentPage('dashboard');
    showToast(`Opened CRM workspace as ${emp.name}`);
  };

  // ================= LEAD ACTIONS =================
  const handleSaveLead = async (formData) => {
    try {
      const leadId = formData.id || leadModal.lead?.id;
      const isEdit = !!leadId;
      const url = isEdit ? `/api/leads/${leadId}` : '/api/leads';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = { ...formData };
      const targetEmp = crmViewEmployee || managerFilterEmp;
      if (!isEdit && targetEmp) {
        payload.assigned_to = targetEmp.id;
        payload.assigned_consultant = targetEmp.name;
      }

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save lead');
      }
      setLeadModal({ isOpen: false, lead: null, isViewOnly: false });
      setRefreshKey(k => k + 1);
      showToast(isEdit ? 'Lead updated successfully' : 'Lead created successfully');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to delete lead');
      setRefreshKey(k => k + 1);
      showToast('Lead deleted successfully');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ================= CLIENT ACTIONS =================
  const handleSaveClient = async (formData) => {
    try {
      const clientId = formData.id || clientModal.client?.id;
      const isEdit = !!clientId;
      const url = isEdit ? `/api/clients/${clientId}` : '/api/clients';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = { ...formData };
      const targetEmp = crmViewEmployee || managerFilterEmp;
      if (!isEdit && targetEmp) {
        payload.assigned_to = targetEmp.id;
        payload.assigned_consultant = targetEmp.name;
      }

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save client');
      setClientModal({ isOpen: false, client: null, isViewOnly: false });
      setRefreshKey(k => k + 1);
      showToast(isEdit ? 'Client updated successfully' : 'Client created successfully');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to delete client');
      setRefreshKey(k => k + 1);
      showToast('Client deleted successfully');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ================= AGREEMENT ACTIONS =================
  const handleSaveAgreement = async (formData) => {
    try {
      const isEdit = Boolean(formData.id);
      const url = isEdit ? `/api/agreements/${formData.id}` : '/api/agreements';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to save agreement');
      setAgreementModal({ isOpen: false, agreement: null, isViewOnly: false });
      setRefreshKey(k => k + 1);
      showToast(isEdit ? 'Agreement updated successfully' : 'Agreement created successfully');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteAgreement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this agreement?')) return;
    try {
      const res = await fetch(`/api/agreements/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to delete agreement');
      setRefreshKey(k => k + 1);
      showToast('Agreement deleted successfully');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ================= PAYMENT ACTIONS =================
  const handleRecordPayment = async (paymentData) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(paymentData)
      });
      if (!res.ok) throw new Error('Failed to record payment');
      setRecordPaymentModal({ isOpen: false, client: null });
      setRefreshKey(k => k + 1);
      showToast('Payment recorded successfully');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ================= LEAD CONVERSION =================
  const handleConvertLead = async (convertData) => {
    try {
      const { leadId, ...rest } = convertData;
      const res = await fetch(`/api/leads/${leadId}/convert`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(rest)
      });
      if (!res.ok) throw new Error('Failed to convert lead');
      setConvertLeadModal({ isOpen: false, lead: null });
      setRefreshKey(k => k + 1);
      showToast('Lead converted to client successfully');
      setCurrentPage('clients');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ================= BULK MAIL =================
  const handleSendBulkMail = async ({ subject, message }) => {
    try {
      const res = await fetch('/api/mail/send-bulk', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          client_ids: bulkMailModal.selectedClients,
          subject,
          message
        })
      });
      const data = await res.json();
      setBulkMailModal({ isOpen: false, selectedClients: [] });
      showToast(data.message || 'Bulk mail dispatched successfully');
    } catch (err) {
      showToast('Failed to send mail', 'error');
    }
  };

  // ================= RENDER =================
  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  // ================= ADMIN / MANAGER PORTAL ROUTING =================
  if (((user.role === 'ADMIN' && managerPortalMode) || (user.role === 'MANAGER' && managerPortalMode)) && !crmViewEmployee) {
    if (adminViewEmployee) {
      return (
        <div className="admin-layout">
          <div className="admin-main" style={{ width: '100%' }}>
            <div className="admin-content-area" style={{ padding: '24px 32px' }}>
              <AdminEmployeeDetailPage
                employee={adminViewEmployee}
                user={user}
                onBack={() => setAdminViewEmployee(null)}
                onOpenCRM={handleOpenCRM}
                onEditEmployee={user.role === 'ADMIN' ? (emp) => setEditEmployeeModalTarget(emp) : null}
              />
              {user.role === 'ADMIN' && (
                <CreateEmployeeModal
                  isOpen={Boolean(editEmployeeModalTarget)}
                  employee={editEmployeeModalTarget}
                  onClose={() => setEditEmployeeModalTarget(null)}
                  onSave={(updated) => {
                    setEditEmployeeModalTarget(null);
                    setAdminViewEmployee(prev => ({ ...prev, ...updated }));
                    showToast('Employee profile updated!');
                  }}
                />
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <AdminPanelPage
        user={user}
        onLogout={handleLogout}
        onViewEmployee={(emp) => setAdminViewEmployee(emp)}
        onOpenCRM={(emp) => {
          setManagerPortalMode(false);
          handleOpenCRM(emp);
        }}
      />
    );
  }

  const effectiveUser = crmViewEmployee
    ? { ...crmViewEmployee, role: 'EMPLOYEE', isImpersonated: true, originalRole: user.role }
    : managerFilterEmp
    ? { ...managerFilterEmp, role: user.role, isFiltered: true, filterName: managerFilterEmp.name }
    : { ...user, isManagerAll: true };

  // ================= FULL CRM WORKSPACE =================
  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        user={user}
        onToggleViewMode={() => setManagerPortalMode(prev => !prev)}
      />

      <div className="main-wrapper">
        {crmViewEmployee && (
          <div className="crm-admin-context-banner">
            <div className="crm-admin-banner-left">
              <div className="crm-admin-banner-avatar">
                {crmViewEmployee.profile_photo ? (
                  <img src={crmViewEmployee.profile_photo} alt={crmViewEmployee.name} />
                ) : (
                  <span>{crmViewEmployee.name?.charAt(0)?.toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="crm-admin-banner-title">
                  Viewing CRM Workspace as: <strong>{crmViewEmployee.name}</strong>
                  <span className="crm-admin-banner-badge">{crmViewEmployee.employee_id || 'SE-000'}</span>
                </div>
              </div>
            </div>
            <div className="crm-admin-banner-actions">
              <button
                type="button"
                className="crm-admin-btn-back-profile"
                onClick={() => {
                  setAdminViewEmployee(crmViewEmployee);
                  setCrmViewEmployee(null);
                }}
              >
                View Profile
              </button>
              <button
                type="button"
                className="crm-admin-btn-exit"
                onClick={() => setCrmViewEmployee(null)}
              >
                {user.role === 'ADMIN' ? 'Return to Admin Panel' : 'Exit Employee Workspace'}
              </button>
            </div>
          </div>
        )}

        <Header
          user={effectiveUser}
          onLogout={handleLogout}
          toggleSidebar={() => setIsMobileOpen(!isMobileOpen)}
          employees={employeesList}
          selectedEmployee={crmViewEmployee || managerFilterEmp}
          onSelectEmployee={(emp) => {
            setCrmViewEmployee(null);
            setManagerFilterEmp(emp);
            setRefreshKey(k => k + 1);
            showToast(emp ? `Filtered CRM to ${emp.name}` : 'Showing all team CRM records');
          }}
          onToggleViewMode={() => setManagerPortalMode(prev => !prev)}
        />

        {currentPage === 'dashboard' && (
          <DashboardPage
            key={refreshKey}
            user={effectiveUser}
            onNavigate={(page) => setCurrentPage(page)}
            onNavigateLeads={(filter) => {
              setLeadFilterStatus(filter || 'All');
              setCurrentPage('leads');
            }}
            onNavigateClients={(status) => {
              setClientFilterStatus(status || 'Active');
              setCurrentPage('clients');
            }}
            onEditClient={(c) => {
              setEditClientData(c);
              setClientReturnPage('dashboard');
              setCurrentPage('edit_client');
            }}
            onViewClient={(c) => {
              setSelectedClientDetails(c);
              setClientReturnPage('dashboard');
              setCurrentPage('client_details');
            }}
            onAddLender={(c) => {
              setSelectedLenderClient(c);
              setClientReturnPage('dashboard');
              setCurrentPage('add_lender');
            }}
            onDeleteClient={user.role === 'ADMIN' ? handleDeleteClient : undefined}
            onPayClient={(c) => setRecordPaymentModal({ isOpen: true, client: c })}
          />
        )}

        {currentPage === 'leads' && (
          <LeadsPage
            key={`${refreshKey}-${leadFilterStatus}`}
            user={effectiveUser}
            initialStatus={leadFilterStatus}
            onAddLead={() => setLeadModal({ isOpen: true, lead: null, isViewOnly: false })}
            onEditLead={(l) => {
              setEditLeadData(l);
              setCurrentPage('edit_lead');
            }}
            onViewLead={(l) => setLeadModal({ isOpen: true, lead: l, isViewOnly: true })}
            onFollowUp={(l) => {
              setFollowUpLead(l);
              setCurrentPage('follow_up');
            }}
            onCreateAgreement={(l) => {
              setCreateAgreementLead(l);
              setCurrentPage('create_agreement');
            }}
            onDeleteLead={user.role === 'ADMIN' ? handleDeleteLead : undefined}
            onConvertLead={(l) => setConvertLeadModal({ isOpen: true, lead: l })}
          />
        )}

        {currentPage === 'edit_lead' && (
          <EditLeadPage
            lead={editLeadData}
            onBack={() => setCurrentPage('leads')}
            onSaveLead={async (updatedLead) => {
              try {
                // Always PUT using the lead's existing database ID
                if (!updatedLead.id) {
                  showToast('Error: Lead ID missing — cannot update.', 'error');
                  return;
                }
                const res = await fetch(`/api/leads/${updatedLead.id}`, {
                  method: 'PUT',
                  headers: authHeaders(),
                  body: JSON.stringify(updatedLead)
                });
                if (!res.ok) {
                  const errData = await res.json().catch(() => ({}));
                  throw new Error(errData.error || 'Failed to update lead');
                }

                // If status changed to Converted, trigger conversion ONCE
                // (backend checks for existing client to prevent duplicates)
                if (updatedLead.lead_status === 'Converted') {
                  const convRes = await fetch(`/api/leads/${updatedLead.id}/convert`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                      service_fee: updatedLead.service_fee || 25000,
                      paid_amount: 0,
                      payment_method: 'UPI',
                      notes: `Converted to Client from Lead Edit`
                    })
                  });
                  if (convRes.ok) {
                    setRefreshKey(k => k + 1);
                    setClientFilterStatus('Active');
                    setCurrentPage('clients');
                    showToast(`Lead ${updatedLead.name} converted to Client!`);
                    return;
                  }
                  // If conversion fails (e.g. already converted), still go to leads
                  const convErr = await convRes.json().catch(() => ({}));
                  showToast(convErr.error || 'Lead updated. Conversion skipped (already converted).', 'info');
                } else {
                  showToast('Lead updated successfully');
                }

                setRefreshKey(k => k + 1);
                setCurrentPage('leads');
              } catch (err) {
                showToast(err.message, 'error');
              }
            }}
          />
        )}

        {currentPage === 'follow_up' && (
          <FollowUpPage
            lead={followUpLead}
            onBack={() => setCurrentPage('leads')}
            onSaveFollowUp={async (updatedLead) => {
              try {
                const res = await fetch(`/api/leads/${updatedLead.id}`, {
                  method: 'PUT',
                  headers: authHeaders(),
                  body: JSON.stringify(updatedLead)
                });
                if (!res.ok) throw new Error('Failed to update follow-up');

                // If final status is Converted, automatically convert to Client & open clients tab!
                if (updatedLead.lead_status === 'Converted') {
                  const convRes = await fetch(`/api/leads/${updatedLead.id}/convert`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                      service_fee: 25000,
                      paid_amount: 0,
                      payment_method: 'UPI',
                      notes: `Converted to Client from Follow-up section`
                    })
                  });

                  if (convRes.ok) {
                    setRefreshKey(k => k + 1);
                    setClientFilterStatus('Active');
                    setCurrentPage('clients');
                    showToast(`Lead ${updatedLead.name} converted to Client!`);
                    return;
                  }
                }

                setRefreshKey(k => k + 1);
                showToast('Follow-up saved successfully');
                setCurrentPage('leads');
              } catch (err) {
                showToast(err.message, 'error');
              }
            }}
          />
        )}

        {currentPage === 'clients' && (
          <ClientsPage
            key={`${refreshKey}-${clientFilterStatus}`}
            user={effectiveUser}
            initialCaseStatus={clientFilterStatus}
            onAddClient={() => setCurrentPage('add_client')}
            onEditClient={(c) => {
              setEditClientData(c);
              setClientReturnPage('clients');
              setCurrentPage('edit_client');
            }}
            onViewClient={(c) => {
              setSelectedClientDetails(c);
              setClientReturnPage('clients');
              setCurrentPage('client_details');
            }}
            onAddLender={(c) => {
              setSelectedLenderClient(c);
              setClientReturnPage('clients');
              setCurrentPage('add_lender');
            }}
            onPayClient={(c) => setRecordPaymentModal({ isOpen: true, client: c })}
            onDeleteClient={user.role === 'ADMIN' ? handleDeleteClient : undefined}
            onOpenBulkMail={(selected) => setBulkMailModal({ isOpen: true, selectedClients: selected })}
          />
        )}

        {currentPage === 'add_client' && (
          <AddClientPage
            onBack={() => setCurrentPage('clients')}
            onSaveClient={async (newClient) => {
              await handleSaveClient(newClient);
              setCurrentPage('clients');
            }}
          />
        )}

        {currentPage === 'client_details' && (
          <ClientDetailsPage
            client={selectedClientDetails}
            onBack={() => setCurrentPage(clientReturnPage || 'clients')}
            onEditClient={(c) => {
              setEditClientData(c);
              setCurrentPage('edit_client');
            }}
            onViewAgreement={async (a) => {
              try {
                if (a && a.id) {
                  const token = localStorage.getItem('crm_token');
                  const res = await fetch(`/api/agreements/${a.id}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                  });
                  if (res.ok) {
                    const fresh = await res.json();
                    setAgreementPreviewModal({ isOpen: true, agreement: fresh });
                    return;
                  }
                }
              } catch (e) { }
              setAgreementPreviewModal({ isOpen: true, agreement: a });
            }}
            onCreateAgreement={(c) => {
              setCreateAgreementLead(c);
              setCurrentPage('create_agreement');
            }}
            onEditAgreement={(a) => {
              setCreateAgreementLead({ ...a, isEditAgreement: true });
              setCurrentPage('create_agreement');
            }}
          />
        )}

        {currentPage === 'edit_client' && (
          <EditClientPage
            client={editClientData}
            onBack={() => setCurrentPage(clientReturnPage || 'clients')}
            onSaveClient={async (updatedClient) => {
              await handleSaveClient(updatedClient);
              setRefreshKey(k => k + 1);
              setCurrentPage(clientReturnPage || 'clients');
            }}
          />
        )}

        {currentPage === 'add_lender' && (
          <AddLenderPage
            client={selectedLenderClient}
            onBack={() => setCurrentPage(clientReturnPage || 'clients')}
            onSave={async (clientId, updatedLenders) => {
              showToast('Lender details saved successfully');
              setRefreshKey(k => k + 1);
              setCurrentPage(clientReturnPage || 'clients');
            }}
          />
        )}

        {currentPage === 'agreements' && (
          <AgreementsPage
            key={refreshKey}
            onAddAgreement={() => {
              setCreateAgreementLead(null);
              setCurrentPage('create_agreement');
            }}
            onEditAgreement={(a) => {
              setCreateAgreementLead({ ...a, isEditAgreement: true });
              setCurrentPage('create_agreement');
            }}
            onViewAgreement={async (a) => {
              try {
                if (a && a.id) {
                  const token = localStorage.getItem('crm_token');
                  const res = await fetch(`/api/agreements/${a.id}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                  });
                  if (res.ok) {
                    const fresh = await res.json();
                    setAgreementPreviewModal({ isOpen: true, agreement: fresh });
                    return;
                  }
                }
              } catch (e) { }
              setAgreementPreviewModal({ isOpen: true, agreement: a });
            }}
            onDeleteAgreement={user.role === 'ADMIN' ? handleDeleteAgreement : undefined}
          />
        )}

        {currentPage === 'create_agreement' && (
          <CreateAgreementPage
            lead={createAgreementLead}
            onSave={async (payload) => {
              try {
                const isEdit = Boolean(createAgreementLead?.isEditAgreement && createAgreementLead?.id);
                const url = isEdit ? `/api/agreements/${createAgreementLead.id}` : '/api/agreements';
                const method = isEdit ? 'PUT' : 'POST';
                const res = await fetch(url, {
                  method,
                  headers: authHeaders(),
                  body: JSON.stringify(payload)
                });
                if (!res.ok) {
                  const errorData = await res.json().catch(() => ({}));
                  throw new Error(errorData.error || 'Failed to save agreement');
                }
                setRefreshKey(k => k + 1);
                showToast(isEdit ? 'Agreement updated successfully' : 'Agreement saved & Lead converted to Client successfully!');
                setCurrentPage(isEdit ? 'agreements' : 'clients');
              } catch (err) {
                showToast(err.message, 'error');
              }
            }}
            onCancel={() => setCurrentPage(createAgreementLead?.isEditAgreement ? 'agreements' : 'leads')}
          />
        )}
      </div>

      {/* Modals */}
      <LeadModal
        isOpen={leadModal.isOpen}
        lead={leadModal.lead}
        isViewOnly={leadModal.isViewOnly}
        onClose={() => setLeadModal({ isOpen: false, lead: null, isViewOnly: false })}
        onSave={handleSaveLead}
        onConvertToClient={(l) => {
          setLeadModal({ isOpen: false, lead: null, isViewOnly: false });
          setConvertLeadModal({ isOpen: true, lead: l });
        }}
      />

      <FollowUpModal
        isOpen={followUpModal.isOpen}
        lead={followUpModal.lead}
        onClose={() => setFollowUpModal({ isOpen: false, lead: null })}
        onSave={async (updatedLead) => {
          try {
            const res = await fetch(`/api/leads/${updatedLead.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedLead)
            });
            if (!res.ok) throw new Error('Failed to update follow-up');
            setFollowUpModal({ isOpen: false, lead: null });
            setRefreshKey(k => k + 1);
            showToast('Follow-up scheduled successfully');
          } catch (err) {
            showToast(err.message, 'error');
          }
        }}
      />

      <ClientModal
        isOpen={clientModal.isOpen}
        client={clientModal.client}
        isViewOnly={clientModal.isViewOnly}
        onClose={() => setClientModal({ isOpen: false, client: null, isViewOnly: false })}
        onSave={handleSaveClient}
        onOpenPayModal={(c) => {
          setClientModal({ isOpen: false, client: null, isViewOnly: false });
          setRecordPaymentModal({ isOpen: true, client: c });
        }}
      />

      <AgreementModal
        isOpen={agreementModal.isOpen}
        agreement={agreementModal.agreement}
        isViewOnly={agreementModal.isViewOnly}
        onClose={() => setAgreementModal({ isOpen: false, agreement: null, isViewOnly: false })}
        onSave={handleSaveAgreement}
      />

      <AgreementPreviewModal
        isOpen={agreementPreviewModal.isOpen}
        agreement={agreementPreviewModal.agreement}
        onClose={() => setAgreementPreviewModal({ isOpen: false, agreement: null })}
      />

      <BulkMailModal
        isOpen={bulkMailModal.isOpen}
        selectedCount={bulkMailModal.selectedClients?.length || 0}
        onClose={() => setBulkMailModal({ isOpen: false, selectedClients: [] })}
        onSend={handleSendBulkMail}
      />

      {/* Record Payment / Pay Pending Amount Modal */}
      <RecordPaymentModal
        isOpen={recordPaymentModal.isOpen}
        client={recordPaymentModal.client}
        onClose={() => setRecordPaymentModal({ isOpen: false, client: null })}
        onPaymentSuccess={(msg) => {
          setRefreshKey(k => k + 1);
          showToast(msg, 'success');
        }}
      />

      {/* Convert Lead to Client Modal */}
      <ConvertLeadModal
        isOpen={convertLeadModal.isOpen}
        lead={convertLeadModal.lead}
        onClose={() => setConvertLeadModal({ isOpen: false, lead: null })}
        onConvertSuccess={(msg) => {
          setRefreshKey(k => k + 1);
          showToast(msg, 'success');
          setCurrentPage('clients');
        }}
      />

      {/* Toast Notifications */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 size={15} color="#22c55e" /> : <AlertCircle size={15} color="#ef4444" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
