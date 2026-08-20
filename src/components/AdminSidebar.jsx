import React, { useState } from 'react';
import {
  LayoutDashboard,
  Radio,
  Users,
  Activity,
  FileSpreadsheet,
  FileText,
  Settings,
  LogOut,
  Shield,
  ShieldCheck,
  X
} from 'lucide-react';

export default function AdminSidebar({
  currentPage,
  setCurrentPage,
  onLogout,
  isCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) {
  const [logoError, setLogoError] = useState(false);

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'leads', label: 'Leads', icon: Radio },
    { key: 'employees', label: 'Employees', icon: Users },
    { key: 'monitoring', label: 'Monitoring', icon: Activity },
    { key: 'audit', label: 'Audit Logs', icon: ShieldCheck },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (key) => {
    setCurrentPage(key);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const handleLogoutClick = () => {
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
    onLogout();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setIsMobileOpen?.(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <div
          className="admin-sidebar-logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isCollapsed ? '12px 8px' : '14px 20px',
            height: '68px',
            overflow: 'hidden',
            borderBottom: '1px solid rgba(0, 0, 0, 0.07)'
          }}
        >
          <img
            src="/logo.png"
            alt="SettleXpert"
            onError={() => setLogoError(true)}
            style={{
              height: isCollapsed ? '32px' : '42px',
              width: 'auto',
              maxWidth: isCollapsed ? '32px' : '185px',
              objectFit: 'contain',
              display: 'block',
              mixBlendMode: 'multiply'
            }}
          />

          {/* Mobile Close Button */}
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={() => setIsMobileOpen?.(false)}
            title="Close Menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              type="button"
              className={`admin-nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => handleNavClick(item.key)}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={17} />
              {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-nav-item admin-logout-btn"
            onClick={handleLogoutClick}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={17} />
            {(!isCollapsed || isMobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

