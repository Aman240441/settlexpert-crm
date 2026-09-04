import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Users,
  UserCheck,
  FileSignature,
  CreditCard,
  Scale,
  Clock,
  CheckSquare,
  Activity,
  LogOut,
  ArrowLeftRight,
  Shield,
  Briefcase,
  Layers,
  Menu,
  Maximize2,
  ChevronDown,
  ChevronRight,
  User as UserIcon,
  FileSpreadsheet,
  Calendar,
  Mail,
  Phone,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ManagerDashboardView } from './ManagerDashboardView';
import { ManagerTeamView } from './ManagerTeamView';
import { ManagerLeadsView } from './ManagerLeadsView';
import { ManagerClientsView } from './ManagerClientsView';
import { ManagerAgreementsView } from './ManagerAgreementsView';
import { ManagerFollowUpsView } from './ManagerFollowUpsView';
import { ManagerTasksView } from './ManagerTasksView';
import { ManagerPaymentsVerificationView } from './ManagerPaymentsVerificationView';
import { ManagerPaymentManagementView } from './ManagerPaymentManagementView';
import { ManagerAdvocatesView } from './ManagerAdvocatesView';
import { ManagerActivityView } from './ManagerActivityView';
import { NotificationBell } from '../common/NotificationBell';
import { LeadImportDistributionView } from '../leads/LeadImportDistributionView';
import { ClientOnboardingMainView } from '../crm/ClientOnboardingMainView';

interface ManagerWorkspaceProps {
  onSwitchToAdmin?: () => void;
}

export const ManagerWorkspace: React.FC<ManagerWorkspaceProps> = ({ onSwitchToAdmin }) => {
  const { user, logout } = useAuth();
  const [managerContext, setManagerContext] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teamOpen, setTeamOpen] = useState(true);
  const [crmOpen, setCrmOpen] = useState(true);
  const [financeOpen, setFinanceOpen] = useState(true);
  const [legalOpen, setLegalOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        setLoading(true);
        const res = await api.getManagerContext();
        setManagerContext(res);
      } catch (err) {
        console.error('Failed to load manager context', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, []);

  const managerType = (managerContext?.managerType || 'LEGAL').toUpperCase();
  const isFinance = managerType === 'FIN' || managerType === 'FINANCE' || managerType === 'COLLECTION';
  const isLegal = managerType === 'LEGAL';
  const isHR = managerType === 'HR';

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  const profileRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800 flex font-sans antialiased">
      {/* Sidebar - Signature Sage Green CRM Theme */}
      <aside
        className={`bg-[#cadbc8] border-r border-[#b5cbb3] transition-all duration-300 flex flex-col shrink-0 z-[500] ${sidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Top Logo */}
        <div className="h-20 flex items-center px-5 border-b border-[#b5cbb3]/60">
          {sidebarOpen ? (
            <img
              src="/logo.png"
              alt="SettleXpert"
              className="h-11 max-h-11 w-auto max-w-[210px] object-contain mix-blend-multiply"
            />
          ) : (
            <img
              src="/logo.png"
              alt="SettleXpert"
              className="h-10 w-10 object-contain mx-auto mix-blend-multiply"
            />
          )}
        </div>

        {/* Sidebar Menu Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto text-xs font-semibold">
          {/* Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'dashboard'
              ? 'bg-[#111827] text-white shadow-md'
              : 'text-slate-700 hover:bg-[#b8ccb6] hover:text-slate-900'
              }`}
          >
            <Gauge className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="font-bold">Dashboard</span>}
          </button>

          {/* Team Management */}
          <div>
            <button
              onClick={() => {
                setTeamOpen(!teamOpen);
                setActiveTab('team');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'team'
                ? 'bg-[#111827] text-white shadow-md'
                : 'text-slate-700 hover:bg-[#b8ccb6] hover:text-slate-900'
                }`}
            >
              <div className="flex items-center space-x-3">
                <Users className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>My Team</span>}
              </div>
              {sidebarOpen && (
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${teamOpen ? 'rotate-0' : '-rotate-90'}`}
                />
              )}
            </button>
            {sidebarOpen && teamOpen && (
              <div className="pl-9 pr-2 py-1 space-y-1">
                <button
                  onClick={() => setActiveTab('team')}
                  className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${activeTab === 'team'
                    ? 'bg-[#e2ede0] text-[#166534] font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Employees & Quotas
                </button>
              </div>
            )}
          </div>

          {/* CRM Management (Leads, Clients, Agreements) */}
          {!isHR && (
            <div>
              <button
                onClick={() => {
                  setCrmOpen(!crmOpen);
                  if (activeTab !== 'leads' && activeTab !== 'clients' && activeTab !== 'agreements') {
                    setActiveTab('clients');
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'leads' || activeTab === 'clients' || activeTab === 'agreements' || activeTab === 'follow-ups' || activeTab === 'onboarding-form'
                  ? 'bg-[#111827] text-white shadow-md'
                  : 'text-slate-700 hover:bg-[#b8ccb6] hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <UserCheck className="h-4 w-4 shrink-0" />
                  {sidebarOpen && <span>CRM Control</span>}
                </div>
                {sidebarOpen && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${crmOpen ? 'rotate-0' : '-rotate-90'}`}
                  />
                )}
              </button>
              {sidebarOpen && crmOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1">
                  <button
                    onClick={() => setActiveTab('clients')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${activeTab === 'clients'
                      ? 'bg-[#e2ede0] text-[#166534] font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Clients & Cases
                  </button>
                  <button
                    onClick={() => setActiveTab('leads')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${activeTab === 'leads'
                      ? 'bg-[#e2ede0] text-[#166534] font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Leads Pipeline
                  </button>
                  <button
                    onClick={() => setActiveTab('lead-import-distribution')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all flex items-center justify-between ${activeTab === 'lead-import-distribution'
                      ? 'bg-[#e2ede0] text-[#166534] font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <span>Import & Distribute</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Excel</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('agreements')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${activeTab === 'agreements'
                      ? 'bg-[#e2ede0] text-[#166534] font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Agreements
                  </button>
                  <button
                    onClick={() => setActiveTab('onboarding-form')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${activeTab === 'onboarding-form'
                      ? 'bg-[#e2ede0] text-[#166534] font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Onboarding Forms
                  </button>
                  <button
                    onClick={() => setActiveTab('follow-ups')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${activeTab === 'follow-ups'
                      ? 'bg-[#e2ede0] text-[#166534] font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Follow-ups Monitor
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Legal Advocate Control */}
          {(isLegal || user?.role === 'admin') && (
            <div>
              <button
                onClick={() => {
                  setLegalOpen(!legalOpen);
                  setActiveTab('advocates');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'advocates'
                  ? 'bg-[#111827] text-white shadow-md'
                  : 'text-slate-700 hover:bg-[#b8ccb6] hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Scale className="h-4 w-4 shrink-0" />
                  {sidebarOpen && <span>Legal Counsel</span>}
                </div>
                {sidebarOpen && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${legalOpen ? 'rotate-0' : '-rotate-90'}`}
                  />
                )}
              </button>
              {sidebarOpen && legalOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1">
                  <button
                    onClick={() => setActiveTab('advocates')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${activeTab === 'advocates'
                      ? 'bg-[#e2ede0] text-[#166534] font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Empanelled Advocates
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Finance Verification */}
          {(isFinance || user?.role === 'admin') && (
            <div>
              <button
                onClick={() => {
                  setFinanceOpen(!financeOpen);
                  if (activeTab !== 'payments' && activeTab !== 'verification') {
                    setActiveTab('payments');
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'payments' || activeTab === 'verification'
                  ? 'bg-[#111827] text-white shadow-md'
                  : 'text-slate-700 hover:bg-[#b8ccb6] hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-4 w-4 shrink-0" />
                  {sidebarOpen && <span>Payment & Finance</span>}
                </div>
                {sidebarOpen && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${financeOpen ? 'rotate-0' : '-rotate-90'}`}
                  />
                )}
              </button>
              {sidebarOpen && financeOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1">
                  <button
                    onClick={() => setActiveTab('payments')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${activeTab === 'payments'
                      ? 'bg-[#e2ede0] text-[#166534] font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Payment Management
                  </button>
                  <button
                    onClick={() => setActiveTab('verification')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${activeTab === 'verification'
                      ? 'bg-[#e2ede0] text-[#166534] font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Payment Verification
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tasks & Activity */}
          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'tasks'
              ? 'bg-[#111827] text-white shadow-md'
              : 'text-slate-700 hover:bg-[#b8ccb6] hover:text-slate-900'
              }`}
          >
            <CheckSquare className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Tasks & Notes</span>}
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'activity'
              ? 'bg-[#111827] text-white shadow-md'
              : 'text-slate-700 hover:bg-[#b8ccb6] hover:text-slate-900'
              }`}
          >
            <Activity className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Activity Stream</span>}
          </button>
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-3 border-t border-[#b5cbb3]/60 text-center">
            <span className="text-[10px] text-slate-600 font-medium">Settl Expert v1.0 • {managerType} Manager</span>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f9fafb]">
        {/* Top Header Bar */}
        <header className="h-14 bg-[#cadbc8] border-b border-[#b5cbb3] px-4 flex items-center justify-between shrink-0">
          {/* Left: Hamburger & Welcome Back */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-[#b8ccb6] text-slate-700 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-800 tracking-tight">
                Welcome Back!
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/70 border border-[#a8c0a6] text-[#166534] text-[10px] font-bold uppercase">
                {managerType} Manager Panel
              </span>
            </div>
          </div>

          {/* Right: Notifications, Fullscreen & User Profile */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <NotificationBell onViewClient={(clientId) => { setActiveTab('clients'); }} />

            {/* Admin Switcher */}
            {user?.role === 'admin' && onSwitchToAdmin && (
              <button
                onClick={onSwitchToAdmin}
                className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-[#a8c0a6] text-slate-800 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Admin Mode</span>
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-[#b8ccb6] text-slate-700 transition-colors hidden sm:block"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            {/* Profile Menu Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2.5 p-1 pl-1.5 rounded-xl hover:bg-[#b8ccb6] transition-colors cursor-pointer"
                aria-label="Manager profile menu"
                aria-expanded={showProfileMenu}
              >
                <div className="h-9 w-9 rounded-xl bg-[#15803d] text-white flex items-center justify-center font-black text-xs shadow-xs overflow-hidden border border-emerald-600/30">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'M'}</span>
                  )}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                    {user?.name || 'Manager'}
                  </span>
                  <span className="text-[10px] text-emerald-800 font-semibold leading-tight truncate max-w-[130px]">
                    {user?.designation || user?.manager_type_name || `${managerType} Manager`}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
              </button>

              {/* Profile Dropdown Popup */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-0 z-[100] animate-in fade-in zoom-in-95 duration-100 overflow-hidden text-left">
                  {/* Header Banner with Profile Picture & Info */}
                  <div className="p-4 bg-gradient-to-br from-emerald-800 via-[#15803d] to-teal-800 text-white relative">
                    <div className="flex items-center space-x-3.5">
                      <div className="h-14 w-14 rounded-2xl bg-white/15 border-2 border-white/40 text-white flex items-center justify-center font-black text-xl shadow-lg overflow-hidden shrink-0">
                        {user?.profile_image ? (
                          <img src={user.profile_image} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'M'}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-white truncate leading-tight">{user?.name}</h4>
                        <p className="text-[11px] text-emerald-200 font-bold truncate mt-0.5">
                          {user?.designation || user?.manager_type_name || `${managerType} Manager`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/40 border border-emerald-300/40 text-[10px] font-bold text-white tracking-wide font-mono">
                            {user?.emp_or_mgr_id || 'ID: —'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold text-white uppercase tracking-wider">
                            {managerType} Manager
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Details List */}
                  <div className="p-3.5 space-y-2.5 text-xs text-slate-700 bg-slate-50/50 border-b border-slate-100">
                    {/* Designation */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Briefcase className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Designation</span>
                      </span>
                      <span className="font-bold text-slate-800 truncate max-w-[160px]">
                        {user?.designation || user?.manager_type_name || `${managerType} Manager`}
                      </span>
                    </div>

                    {/* Joining Date */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Joining Date</span>
                      </span>
                      <span className="font-bold text-slate-800 font-mono">
                        {user?.joining_date ? new Date(user.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '04 Sep 2026'}
                      </span>
                    </div>

                    {/* Department */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Department</span>
                      </span>
                      <span className="font-bold text-slate-800 truncate max-w-[160px]">
                        {user?.department_name || `${managerType} Department`}
                      </span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Mail className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Email</span>
                      </span>
                      <span className="font-medium text-slate-800 truncate max-w-[160px]" title={user?.email}>
                        {user?.email}
                      </span>
                    </div>

                    {/* Phone */}
                    {user?.phone && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                          <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Phone</span>
                        </span>
                        <span className="font-medium text-slate-800 font-mono">
                          {user.phone}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-2 space-y-1">
                    {onSwitchToAdmin && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onSwitchToAdmin();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Switch to Master Admin</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <ManagerDashboardView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'team' && <ManagerTeamView />}
          {activeTab === 'leads' && (
            <ManagerLeadsView onNavigateToImport={() => setActiveTab('lead-import-distribution')} />
          )}
          {activeTab === 'lead-import-distribution' && (
            <LeadImportDistributionView isManager={true} onNavigateToLeads={() => setActiveTab('leads')} />
          )}
          {activeTab === 'clients' && <ManagerClientsView managerType={managerType} />}
          {activeTab === 'agreements' && <ManagerAgreementsView />}
          {activeTab === 'onboarding-form' && <ClientOnboardingMainView userRole="manager" />}
          {activeTab === 'payments' && <ManagerPaymentManagementView />}
          {activeTab === 'verification' && <ManagerPaymentsVerificationView />}
          {activeTab === 'advocates' && <ManagerAdvocatesView />}
          {activeTab === 'follow-ups' && <ManagerFollowUpsView />}
          {activeTab === 'tasks' && <ManagerTasksView />}
          {activeTab === 'activity' && <ManagerActivityView />}
        </main>
      </div>
    </div>
  );
};
