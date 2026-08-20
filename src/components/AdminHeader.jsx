import React, { useState } from 'react';
import { LogOut, Shield, Bell, Menu } from 'lucide-react';

export default function AdminHeader({ user, onLogout, onToggleMobileSidebar }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button
          type="button"
          className="admin-mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="admin-header-title">Admin Management Console</h2>
      </div>

      <div className="admin-header-right">
        <button className="admin-notif-btn" title="Notifications">
          <Bell size={17} />
          <span className="admin-notif-dot"></span>
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="admin-avatar-btn"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="admin-avatar" style={{ background: 'transparent', padding: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!logoError ? (
                <img
                  src="/logo.png"
                  alt="SettleXpert"
                  onError={() => setLogoError(true)}
                  style={{
                    width: 20,
                    height: 20,
                    objectFit: 'contain',
                    borderRadius: 4
                  }}
                />
              ) : (
                <Shield size={14} color="#15803d" />
              )}
            </div>
            <span className="admin-avatar-name">{user?.name || 'Admin User'}</span>
          </button>

          {showDropdown && (
            <div className="admin-dropdown">
              <div className="admin-dropdown-info">
                <div className="admin-dropdown-name">{user?.name || 'Admin User'}</div>
                <div className="admin-dropdown-email">{user?.email || 'settlexperts@gmail.com'}</div>
                <div className="admin-dropdown-role">Administrator</div>
              </div>
              <button className="admin-dropdown-logout" onClick={() => { setShowDropdown(false); onLogout(); }}>
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
