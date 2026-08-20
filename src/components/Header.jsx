import React, { useState, useEffect, useRef } from 'react';
import { Menu, Maximize2, Minimize2, LogOut, User, ChevronDown, IdCard, ShieldCheck } from 'lucide-react';
import EmployeeProfileModal from './EmployeeProfileModal';

export default function Header({ user, onLogout, toggleSidebar }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selfProfile, setSelfProfile] = useState(user || null);

  const dropdownRef = useRef(null);

  // Sync state with user prop and fetch fresh profile from /api/employee/me if authenticated
  useEffect(() => {
    if (user) {
      setSelfProfile(user);
    }
    fetchSelfProfile();
  }, [user?.id, user?.profile_photo]);

  const fetchSelfProfile = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      if (!token) return;
      const res = await fetch('/api/employee/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelfProfile(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to fetch self profile:', err);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const activeUser = selfProfile || user || {};
  const displayName = activeUser.name || 'Employee';
  const initialLetter = displayName.charAt(0).toUpperCase();
  const profilePhoto = activeUser.profile_photo || '';

  return (
    <header className="top-header">
      {/* Left side: Toggle button + Welcome Text */}
      <div className="header-left">
        <button 
          className="toggle-btn" 
          onClick={toggleSidebar}
          title="Toggle Navigation"
        >
          <Menu size={16} />
        </button>
        <span className="header-title">Welcome Back to SettleXpert!</span>
      </div>

      {/* Right side: Fullscreen + Avatar */}
      <div className="header-right" style={{ position: 'relative' }}>
        <button 
          className="icon-action-btn" 
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* User profile avatar & trigger */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button 
            className="user-avatar-btn"
            onClick={() => setShowDropdown(!showDropdown)}
            title="Account Profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              borderRadius: '24px',
              background: showDropdown ? '#f3f4f6' : 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {/* Profile Avatar / Photo */}
            {profilePhoto ? (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #15803d', flexShrink: 0 }}>
                <img
                  src={profilePhoto}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div className="avatar-fallback" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#15803d', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                {initialLetter}
              </div>
            )}

            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              {displayName}
            </span>
            <ChevronDown size={14} color="#6b7280" style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>

          {/* Profile Dropdown Card matching exact specifications */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: '0',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              width: '240px',
              padding: '0',
              zIndex: 100,
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out'
            }}>
              {/* Profile Card Header */}
              <div style={{
                padding: '20px 16px 16px',
                textAlign: 'center',
                background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                borderBottom: '1px solid #f1f5f9'
              }}>
                {/* Large Center Photo */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  {profilePhoto ? (
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #15803d', boxShadow: '0 2px 8px rgba(21, 128, 61, 0.2)' }}>
                      <img src={profilePhoto} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#15803d', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, boxShadow: '0 2px 8px rgba(21, 128, 61, 0.2)' }}>
                      {initialLetter}
                    </div>
                  )}
                </div>

                {/* Name & Email */}
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', letterSpacing: '-0.2px' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', wordBreak: 'break-all' }}>
                  {activeUser.email || 'employee@settlexpert.in'}
                </div>

                {/* Badges: Employee ID & Department */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#f1f5f9',
                    color: '#475569',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0'
                  }}>
                    Employee ID: {activeUser.employee_id || '002'}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #bbf7d0'
                  }}>
                    {activeUser.department || 'Sales'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ padding: '6px' }}>
                {/* My Profile Button */}
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                    setProfileModalOpen(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#374151',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User size={15} color="#15803d" />
                  <span>My Profile</span>
                </button>

                {/* Logout Button */}
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#dc2626',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={15} color="#dc2626" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Self Profile Modal */}
      <EmployeeProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={activeUser}
      />
    </header>
  );
}
