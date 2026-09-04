import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { ManagersView } from './components/organization/ManagersView';
import { EmployeesView } from './components/organization/EmployeesView';
import { DepartmentsView } from './components/organization/DepartmentsView';
import { TeamsView } from './components/organization/TeamsView';
import { ManagerTypesView } from './components/organization/ManagerTypesView';
import { RolesPermissionsView } from './components/organization/RolesPermissionsView';
import { AdvocatesView } from './components/advocates/AdvocatesView';
import { FeePlansView } from './components/finance/FeePlansView';
import { PaymentsView } from './components/finance/PaymentsView';
import { LeadsView } from './components/crm/LeadsView';
import { ClientsView } from './components/crm/ClientsView';
import { AgreementsView } from './components/crm/AgreementsView';
import { ClientOnboardingMainView } from './components/crm/ClientOnboardingMainView';
import { OperationsView } from './components/operations/OperationsView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { AdminSettingsView } from './components/settings/AdminSettingsView';
import { StaffDirectory } from './components/staff/StaffDirectory';
import { LeadImportDistributionView } from './components/leads/LeadImportDistributionView';
import { EmployeeWorkspace } from './components/employee/EmployeeWorkspace';
import { ManagerWorkspace } from './components/manager/ManagerWorkspace';
import { AdvocateWorkspace } from './components/advocate/AdvocateWorkspace';
import { Briefcase, Shield, Layers, Scale } from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentSection, setCurrentSection] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'admin' | 'manager' | 'employee' | 'advocate'>('admin');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            Initializing Settl Expert...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Advocates land directly in the Advocate CRM Workspace
  if (user.role === 'advocate' || (user.role === 'admin' && viewMode === 'advocate')) {
    return (
      <AdvocateWorkspace
        onSwitchToAdmin={user.role === 'admin' ? () => setViewMode('admin') : undefined}
      />
    );
  }

  // Managers land directly in the Manager Work Center
  if (user.role === 'manager' || (user.role === 'admin' && viewMode === 'manager')) {
    return (
      <ManagerWorkspace
        onSwitchToAdmin={user.role === 'admin' ? () => setViewMode('admin') : undefined}
      />
    );
  }

  // Employees land directly in the Employee CRM Workspace
  if (user.role === 'employee' || (user.role === 'admin' && viewMode === 'employee')) {
    return (
      <EmployeeWorkspace
        onSwitchToAdmin={user.role === 'admin' ? () => setViewMode('admin') : undefined}
      />
    );
  }

  const handleOpenCRMFromStaff = (role: string, staff: any) => {
    if (role === 'advocate') {
      setViewMode('advocate');
    } else if (role === 'manager') {
      setViewMode('manager');
    } else {
      setViewMode('employee');
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <AdminDashboard onNavigate={setCurrentSection} />;
      case 'staff-directory':
      case 'staff':
        return <StaffDirectory onOpenCRM={handleOpenCRMFromStaff} />;
      case 'managers':
        return <ManagersView />;
      case 'employees':
        return <EmployeesView />;
      case 'departments':
        return <DepartmentsView />;
      case 'teams':
        return <TeamsView />;
      case 'manager-types':
        return <ManagerTypesView />;
      case 'roles-permissions':
        return <RolesPermissionsView />;
      case 'advocates':
      case 'advocate-assignments':
        return <AdvocatesView />;
      case 'fee-plans':
        return <FeePlansView />;
      case 'payments':
        return <PaymentsView initialTab="all" />;
      case 'verification':
        return <PaymentsView initialTab="verification" />;
      case 'collections':
      case 'client-fees':
        return <PaymentsView initialTab="collections" />;
      case 'leads':
        return <LeadsView onNavigateToImport={() => setCurrentSection('lead-import-distribution')} />;
      case 'lead-import-distribution':
      case 'lead-import':
        return <LeadImportDistributionView onNavigateToLeads={() => setCurrentSection('leads')} />;
      case 'clients':
        return <ClientsView />;
      case 'agreements':
        return <AgreementsView />;
      case 'onboarding-form':
      case 'onboarding-forms':
        return <ClientOnboardingMainView userRole="admin" />;
      case 'tasks':
        return <OperationsView initialTab="tasks" />;
      case 'follow-ups':
        return <OperationsView initialTab="follow-ups" />;
      case 'documents':
        return <OperationsView initialTab="documents" />;
      case 'escalations':
        return <OperationsView initialTab="escalations" />;
      case 'reports':
        return <ReportsView />;
      case 'audit':
        return <AuditLogsView />;
      case 'settings':
        return <AdminSettingsView />;
      default:
        return <AdminDashboard onNavigate={setCurrentSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800 flex font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onNavigate={setCurrentSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-72'
          }`}
      >
        <Header
          currentSection={currentSection}
          onNavigate={setCurrentSection}
          extraActions={
            user.role === 'admin' ? (
              <div className="flex items-center space-x-2 mr-2">
                <button
                  onClick={() => setViewMode('advocate')}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-[#a8c0a6] text-purple-700 text-xs font-bold transition-all shadow-2xs"
                  title="Preview Advocate Legal CRM"
                >
                  <Scale className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Advocate CRM</span>
                </button>
                <button
                  onClick={() => setViewMode('manager')}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-[#a8c0a6] text-indigo-700 text-xs font-bold transition-all shadow-2xs"
                  title="Preview Manager Work Center"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Manager Panel</span>
                </button>
                <button
                  onClick={() => setViewMode('employee')}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-[#a8c0a6] text-blue-700 text-xs font-bold transition-all shadow-2xs"
                  title="Preview Employee CRM"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Employee CRM</span>
                </button>
              </div>
            ) : null
          }
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};
