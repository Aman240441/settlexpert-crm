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

export default function Sidebar({ currentPage, setCurrentPage, isMobileOpen, setIsMobileOpen, isCollapsed }) {
  const [logoError, setLogoError] = useState(false);
  const [openMenus, setOpenMenus] = useState({
    leads: true,
    clients: true,
    agreements: true
  });

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
        {/* Top SettleXpert Brand Logo */}
        <div
          className="sidebar-logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '12px 6px' : '14px 20px',
            height: '68px',
            overflow: 'hidden',
            borderBottom: '1px solid rgba(0, 0, 0, 0.07)'
          }}
        >
          <img
            src="/logo.png"
            alt="SettleXpert"
            style={{
              height: isCollapsed ? '32px' : '42px',
              width: 'auto',
              maxWidth: isCollapsed ? '32px' : '185px',
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
                  <span>My Leads</span>
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
                  <span>Client List</span>
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
        </nav>
      </aside>
    </>
  );
}

