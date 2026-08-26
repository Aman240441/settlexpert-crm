import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  ShieldCheck,
  Briefcase,
  Layers,
  Scale,
  DollarSign,
  FileText,
  CreditCard,
  CheckCircle,
  Activity,
  Settings,
  FolderOpen,
  Calendar,
  AlertTriangle,
  FileCheck2,
  PieChart,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  WalletCards,
  FileSignature,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarProps {
  currentSection: string;
  onNavigate: (section: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: Array<{
    id: string;
    label: string;
    icon?: React.ElementType;
    badge?: string;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onNavigate,
  collapsed,
  onToggleCollapse,
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    organization: true,
    crm: true,
    advocates: true,
    finance: true,
    operations: true,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'organization',
      label: 'Organization',
      icon: Building2,
      children: [
        { id: 'staff-directory', label: 'Staff Directory & KYC', icon: Users },
        { id: 'managers', label: 'Managers', icon: UserCheck },
        { id: 'employees', label: 'Employees', icon: Users },
        { id: 'departments', label: 'Departments', icon: Building2 },
        { id: 'teams', label: 'Teams', icon: Layers },
        { id: 'manager-types', label: 'Manager Types', icon: Briefcase },
        { id: 'roles-permissions', label: 'Roles & Permissions', icon: ShieldCheck },
      ],
    },
    {
      id: 'crm',
      label: 'CRM Management',
      icon: Briefcase,
      children: [
        { id: 'leads', label: 'Leads', icon: Layers },
        { id: 'lead-import-distribution', label: 'Lead Import & Distribution', icon: FileSpreadsheet },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'agreements', label: 'Agreements', icon: FileSignature },
      ],
    },
    {
      id: 'advocates-group',
      label: 'Advocates',
      icon: Scale,
      children: [
        { id: 'advocates', label: 'Advocates Directory', icon: Scale },
      ],
    },
    {
      id: 'finance',
      label: 'Finance & Accounts',
      icon: DollarSign,
      children: [
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'fee-plans', label: 'Fee Plans', icon: WalletCards },
      ],
    },
    {
      id: 'operations',
      label: 'Operations & Legal',
      icon: CheckCircle,
      children: [
        { id: 'tasks', label: 'Tasks', icon: CheckCircle },
        { id: 'follow-ups', label: 'Follow-ups', icon: Calendar },
        { id: 'documents', label: 'Documents', icon: FolderOpen },
        { id: 'escalations', label: 'Escalations', icon: AlertTriangle },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: PieChart,
    },
    {
      id: 'audit',
      label: 'Activity / Audit',
      icon: Activity,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-[500] h-screen bg-[#cadbc8] border-r border-[#b5cbb3] transition-all duration-300 flex flex-col font-sans ${collapsed ? 'w-20' : 'w-72'
        }`}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center px-5 border-b border-[#b5cbb3]/60 cursor-pointer" onClick={() => onNavigate('dashboard')}>
        {!collapsed ? (
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

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin text-xs font-semibold">
        {navGroups.map((group) => {
          const GroupIcon = group.icon;
          const hasChildren = group.children && group.children.length > 0;
          const isChildActive = hasChildren && group.children?.some((c) => c.id === currentSection);
          const isGroupActive = group.id === currentSection || isChildActive;
          const isOpen = openGroups[group.id];

          if (!hasChildren) {
            return (
              <button
                key={group.id}
                onClick={() => onNavigate(group.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all text-left ${currentSection === group.id
                    ? 'bg-[#111827] text-white shadow-md'
                    : 'text-slate-700 hover:bg-[#b8ccb6] hover:text-slate-900'
                  }`}
              >
                <GroupIcon className={`h-4 w-4 shrink-0 ${currentSection === group.id ? 'text-white' : 'text-slate-700'}`} />
                {!collapsed && <span>{group.label}</span>}
              </button>
            );
          }

          return (
            <div key={group.id} className="space-y-0.5">
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition-all text-left ${isChildActive
                    ? 'bg-[#111827] text-white shadow-md'
                    : 'text-slate-700 hover:bg-[#b8ccb6] hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <GroupIcon className={`h-4 w-4 shrink-0 ${isChildActive ? 'text-white' : 'text-slate-700'}`} />
                  {!collapsed && <span>{group.label}</span>}
                </div>
                {!collapsed && (
                  <div>
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                    )}
                  </div>
                )}
              </button>

              {!collapsed && isOpen && group.children && (
                <div className="pl-8 pr-1 py-1 space-y-1 border-l border-[#b5cbb3]/80 ml-4">
                  {group.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isActive = currentSection === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => onNavigate(child.id)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors text-left ${isActive
                            ? 'bg-[#e2ede0] text-[#166534] font-bold shadow-2xs'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-[#b8ccb6]/60'
                          }`}
                      >
                        <div className="flex items-center space-x-2">
                          {ChildIcon && <ChildIcon className="h-3.5 w-3.5" />}
                          <span>{child.label}</span>
                        </div>
                        {child.badge && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            {child.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / System Status */}
      {!collapsed && (
        <div className="p-3 border-t border-[#b5cbb3]/60 bg-[#cadbc8]">
          <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
              <span>Admin Active</span>
            </span>
            <span className="text-[10px] font-mono text-slate-600">v1.0.0</span>
          </div>
        </div>
      )}
    </aside>
  );
};
