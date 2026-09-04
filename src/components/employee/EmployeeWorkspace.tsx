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
  ArrowLeftRight
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
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-[#b8ccb6] transition-colors cursor-pointer"
                aria-label="Consultant profile menu"
                aria-expanded={showProfileMenu}
              >
                <div className="h-8 w-8 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow">
                  {user?.name?.charAt(0) || 'D'}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden md:inline">
                  {user?.name || 'Dhruv Consultant'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-[100] text-xs text-left">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-800">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Consultant / Employee
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center space-x-2 text-left font-semibold transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
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
