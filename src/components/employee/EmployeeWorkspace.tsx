import React, { useState } from 'react';
import {
  Gauge,
  Layers,
  UserCheck,
  FileSignature,
  Menu,
  Maximize2,
  ChevronDown,
  ChevronRight,
  LogOut,
  ArrowLeftRight,
  Calendar,
  Mail,
  Phone,
  Building2,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EmployeeDashboardView } from './EmployeeDashboardView';
import { EmployeeLeadsView } from './EmployeeLeadsView';
import { EmployeeClientsView } from './EmployeeClientsView';
import { EmployeeAgreementsView } from './EmployeeAgreementsView';
import { NotificationBell } from '../common/NotificationBell';

interface EmployeeWorkspaceProps {
  onSwitchToAdmin?: () => void;
}

export const EmployeeWorkspace: React.FC<EmployeeWorkspaceProps> = ({ onSwitchToAdmin }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'clients' | 'agreements'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [leadsOpen, setLeadsOpen] = useState(true);
  const [clientsOpen, setClientsOpen] = useState(true);
  const [agreementsOpen, setAgreementsOpen] = useState(true);

  const [leadsFilter, setLeadsFilter] = useState<string>('');
  const [leadsNavKey, setLeadsNavKey] = useState(0);
  const [clientsFilter, setClientsFilter] = useState<string>('');
  const [clientsNavKey, setClientsNavKey] = useState(0);
  const [agreementPreselect, setAgreementPreselect] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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

  const handleNavigateFromDashboard = (tab: 'clients' | 'agreements' | 'leads', filter?: string) => {
    if (tab === 'leads') {
      setLeadsFilter(filter || '');
      setLeadsNavKey(k => k + 1);
      setActiveTab('leads');
    } else if (tab === 'clients') {
      setClientsFilter(filter || '');
      setClientsNavKey(k => k + 1);
      setActiveTab('clients');
    } else {
      setActiveTab('agreements');
    }
  };

  const handleNavigateToAgreement = (record: any) => {
    setAgreementPreselect(record);
    setActiveTab('agreements');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800 flex font-sans antialiased">
      {/* Sidebar - Matching Screenshot Light Sage Green Background */}
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

          {/* Leads */}
          <div>
            <button
              onClick={() => {
                setLeadsOpen(!leadsOpen);
                setLeadsFilter('all');
                setActiveTab('leads');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'leads'
                ? 'bg-[#111827] text-white shadow-md'
                : 'text-slate-700 hover:bg-[#b8ccb6] hover:text-slate-900'
                }`}
            >
              <div className="flex items-center space-x-3">
                <Layers className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>Leads</span>}
              </div>
              {sidebarOpen && (
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${leadsOpen ? 'rotate-0' : '-rotate-90'}`}
                />
              )}
            </button>
            {sidebarOpen && leadsOpen && (
              <div className="pl-9 pr-2 py-1 space-y-1">
                <button
                  onClick={() => {
                    setLeadsFilter('all');
                    setLeadsNavKey(k => k + 1);
                    setActiveTab('leads');
                  }}
                  className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${activeTab === 'leads'
                    ? 'bg-[#e2ede0] text-[#166534] font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Lead List
                </button>
              </div>
            )}
          </div>

          {/* Clients */}
          <div>
            <button
              onClick={() => {
                setClientsOpen(!clientsOpen);
                setActiveTab('clients');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'clients'
                ? 'bg-[#111827] text-white shadow-md'
                : 'text-slate-700 hover:bg-[#b8ccb6] hover:text-slate-900'
                }`}
            >
              <div className="flex items-center space-x-3">
                <UserCheck className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>Clients</span>}
              </div>
              {sidebarOpen && (
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${clientsOpen ? 'rotate-0' : '-rotate-90'}`}
                />
              )}
            </button>
            {sidebarOpen && clientsOpen && (
              <div className="pl-9 pr-2 py-1 space-y-1">
                <button
                  onClick={() => {
                    setClientsFilter('');
                    setActiveTab('clients');
                  }}
                  className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${activeTab === 'clients' ? 'bg-[#e2ede0] text-[#166534] font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Client List
                </button>
              </div>
            )}
          </div>

          {/* Agreements */}
          <div>
            <button
              onClick={() => {
                setAgreementsOpen(!agreementsOpen);
                setActiveTab('agreements');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'agreements'
                ? 'bg-[#111827] text-white shadow-md'
                : 'text-slate-700 hover:bg-[#b8ccb6] hover:text-slate-900'
                }`}
            >
              <div className="flex items-center space-x-3">
                <FileSignature className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>Agreements</span>}
              </div>
              {sidebarOpen && (
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${agreementsOpen ? 'rotate-0' : '-rotate-90'}`}
                />
              )}
            </button>
            {sidebarOpen && agreementsOpen && (
              <div className="pl-9 pr-2 py-1 space-y-1">
                <button
                  onClick={() => {
                    setAgreementPreselect(null);
                    setActiveTab('agreements');
                  }}
                  className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${activeTab === 'agreements' ? 'bg-[#e2ede0] text-[#166534] font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Agreement List
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-3 border-t border-[#b5cbb3]/60 text-center">
            <span className="text-[10px] text-slate-600 font-medium">SettleXpert • Consultant</span>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f9fafb]">
        {/* Top Header Bar - Matching Screenshot */}
        <header className="h-14 bg-[#cadbc8] border-b border-[#b5cbb3] px-4 flex items-center justify-between shrink-0">
          {/* Left: Hamburger & Welcome Back */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-[#b8ccb6] text-slate-700 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-slate-800 tracking-tight">
              Welcome Back!
            </span>
          </div>

          {/* Right: Notifications, Fullscreen & User Profile */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <NotificationBell onViewClient={(clientId) => { setActiveTab('clients'); }} />

            {/* Admin Switcher */}
            {user?.role === 'admin' && onSwitchToAdmin && (
              <button
                onClick={onSwitchToAdmin}
                className="px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white text-indigo-700 border border-indigo-200 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>Admin Master Control</span>
              </button>
            )}

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
                aria-label="Employee profile menu"
                aria-expanded={showProfileMenu}
              >
                <div className="h-9 w-9 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs overflow-hidden border border-amber-600/30">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'E'}</span>
                  )}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                    {user?.name || 'Employee'}
                  </span>
                  <span className="text-[10px] text-amber-800 font-semibold leading-tight truncate max-w-[130px]">
                    {user?.designation || 'Debt Settlement Consultant'}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
              </button>

              {/* Profile Dropdown Popup */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-0 z-[100] animate-in fade-in zoom-in-95 duration-100 overflow-hidden text-left">
                  {/* Header Banner with Profile Picture & Info */}
                  <div className="p-4 bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 text-white relative">
                    <div className="flex items-center space-x-3.5">
                      <div className="h-14 w-14 rounded-2xl bg-white/15 border-2 border-white/40 text-white flex items-center justify-center font-black text-xl shadow-lg overflow-hidden shrink-0">
                        {user?.profile_image ? (
                          <img src={user.profile_image} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'E'}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-white truncate leading-tight">{user?.name}</h4>
                        <p className="text-[11px] text-amber-200 font-bold truncate mt-0.5">
                          {user?.designation || 'Debt Settlement Consultant'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/40 border border-amber-300/40 text-[10px] font-bold text-white tracking-wide font-mono">
                            {user?.emp_or_mgr_id || 'ID: —'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold text-white uppercase tracking-wider">
                            Employee
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
                        <Briefcase className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Designation</span>
                      </span>
                      <span className="font-bold text-slate-800 truncate max-w-[160px]">
                        {user?.designation || 'Debt Settlement Consultant'}
                      </span>
                    </div>

                    {/* Joining Date */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Joining Date</span>
                      </span>
                      <span className="font-bold text-slate-800 font-mono">
                        {user?.joining_date ? new Date(user.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '04 Sep 2026'}
                      </span>
                    </div>

                    {/* Department */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Building2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Department</span>
                      </span>
                      <span className="font-bold text-slate-800 truncate max-w-[160px]">
                        {user?.department_name || 'Operations'}
                      </span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Mail className="h-3.5 w-3.5 text-amber-600 shrink-0" />
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
                          <Phone className="h-3.5 w-3.5 text-amber-600 shrink-0" />
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

        {/* Workspace Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f9fafb]">
          {activeTab === 'dashboard' && (
            <EmployeeDashboardView onNavigateTab={handleNavigateFromDashboard} />
          )}
          {activeTab === 'leads' && (
            <EmployeeLeadsView
              key={`leads-${leadsNavKey}-${leadsFilter}`}
              initialStatusFilter={leadsFilter}
              onNavigateToAgreement={handleNavigateToAgreement}
              onNavigateToClients={() => setActiveTab('clients')}
            />
          )}
          {activeTab === 'clients' && (
            <EmployeeClientsView
              key={`clients-${clientsNavKey}-${clientsFilter}`}
              initialCaseStatusFilter={clientsFilter}
              onNavigateToAgreement={handleNavigateToAgreement}
            />
          )}
          {activeTab === 'agreements' && (
            <EmployeeAgreementsView preselectedClient={agreementPreselect} />
          )}
        </main>
      </div>
    </div>
  );
};
