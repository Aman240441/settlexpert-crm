import React, { useState } from 'react';
import {
  Gauge,
  Users,
  UserCheck,
  FileText,
  ChevronDown,
  Radio,
  FileCheck,
  Shield
} from 'lucide-react';

export default function Sidebar({
  currentPage,
  setCurrentPage,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  user,
  onToggleViewMode
}) {
  const [logoError, setLogoError] = useState(false);
  const [openMenus, setOpenMenus] = useState({
    leads: true,
    clients: true,
    agreements: true
  });

  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.originalRole === 'MANAGER' || user?.originalRole === 'ADMIN';

  const toggleSubmenu = (key, e) => {
    e.stopPropagation();
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavClick = (page) => {
    setCurrentPage(page);
    if (window.innerWidth <= 900) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Top SettleXpert Brand Logo & Role Pill */}
        <div
          className="sidebar-logo"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isCollapsed ? 'center' : 'flex-start',
            justifyContent: 'center',
            padding: isCollapsed ? '10px 6px' : '12px 18px',
            height: 'auto',
            minHeight: '68px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.07)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <img
              src="/logo.png"
              alt="SettleXpert"
              style={{
                height: isCollapsed ? '30px' : '38px',
                width: 'auto',
                maxWidth: isCollapsed ? '30px' : '160px',
                objectFit: 'contain',
                display: 'block',
                mixBlendMode: 'multiply'
              }}
            />
            {isMobileOpen && (
              <button
                className="btn-action-icon mobile-close-btn"
                onClick={() => setIsMobileOpen(false)}
                style={{ display: 'none', marginLeft: 'auto' }}
              >
                ✕
              </button>
            )}
          </div>

          {!isCollapsed && user && (
            <div style={{ marginTop: '6px' }}>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: user.role === 'ADMIN' ? '#eff6ff' : user.role === 'MANAGER' ? '#ede9fe' : '#f0fdf4',
                color: user.role === 'ADMIN' ? '#1d4ed8' : user.role === 'MANAGER' ? '#6d28d9' : '#15803d',
                border: `1px solid ${user.role === 'ADMIN' ? '#bfdbfe' : user.role === 'MANAGER' ? '#ddd6fe' : '#bbf7d0'}`
              }}>
                {user.role === 'ADMIN' ? '👑 Admin CRM' : user.role === 'MANAGER' ? '👔 Manager CRM' : '👤 Consultant Workspace'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          {/* Dashboard */}
          <div className="nav-item-container">
            <button
              className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('dashboard')}
            >
              <div className="nav-left">
                <Gauge className="nav-icon" size={15} />
                <span>Dashboard</span>
              </div>
            </button>
          </div>

          {/* Leads */}
          <div className="nav-item-container">
            <button
              className={`nav-item ${currentPage === 'leads' ? 'active' : ''}`}
              onClick={() => handleNavClick('leads')}
            >
              <div className="nav-left">
                <Radio className="nav-icon" size={15} />
                <span>Leads</span>
              </div>
              <span onClick={(e) => toggleSubmenu('leads', e)}>
                <ChevronDown
                  size={13}
                  className={`chevron-icon ${openMenus.leads ? 'expanded' : ''}`}
                />
              </span>
            </button>
            {openMenus.leads && (
              <div className="sub-menu">
                <button
                  className={`sub-item ${currentPage === 'leads' ? 'active' : ''}`}
                  onClick={() => handleNavClick('leads')}
                >
                  <Users size={12} />
                  <span>{user?.role === 'MANAGER' ? 'Team Leads' : 'My Leads'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Clients */}
          <div className="nav-item-container">
            <button
              className={`nav-item ${currentPage === 'clients' ? 'active' : ''}`}
              onClick={() => handleNavClick('clients')}
            >
              <div className="nav-left">
                <UserCheck className="nav-icon" size={15} />
                <span>Clients</span>
              </div>
              <span onClick={(e) => toggleSubmenu('clients', e)}>
                <ChevronDown
                  size={13}
                  className={`chevron-icon ${openMenus.clients ? 'expanded' : ''}`}
                />
              </span>
            </button>
            {openMenus.clients && (
              <div className="sub-menu">
                <button
                  className={`sub-item ${currentPage === 'clients' ? 'active' : ''}`}
                  onClick={() => handleNavClick('clients')}
                >
                  <Users size={12} />
                  <span>{user?.role === 'MANAGER' ? 'Team Client List' : 'Client List'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Agreements */}
          <div className="nav-item-container">
            <button
              className={`nav-item ${currentPage === 'agreements' ? 'active' : ''}`}
              onClick={() => handleNavClick('agreements')}
            >
              <div className="nav-left">
                <FileText className="nav-icon" size={15} />
                <span>Agreements</span>
              </div>
              <span onClick={(e) => toggleSubmenu('agreements', e)}>
                <ChevronDown
                  size={13}
                  className={`chevron-icon ${openMenus.agreements ? 'expanded' : ''}`}
                />
              </span>
            </button>
            {openMenus.agreements && (
              <div className="sub-menu">
                <button
                  className={`sub-item ${currentPage === 'agreements' ? 'active' : ''}`}
                  onClick={() => handleNavClick('agreements')}
                >
                  <FileCheck size={12} />
                  <span>Agreement List</span>
                </button>
              </div>
            )}
          </div>

          {/* Team Management Portal Switcher for Manager & Admin */}
          {isManagerOrAdmin && onToggleViewMode && (
            <div className="nav-item-container" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <button
                className="nav-item"
                onClick={onToggleViewMode}
                style={{ color: '#6d28d9' }}
                title="Open Team Management Portal (Staff, Performance Targets, Audit Logs)"
              >
                <div className="nav-left">
                  <Shield className="nav-icon" size={15} color="#6d28d9" />
                  <span style={{ fontWeight: 700 }}>Management Portal</span>
                </div>
              </button>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}

