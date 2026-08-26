import React, { useState, useRef, useEffect } from 'react';
import { Search, LogOut, ChevronDown, Maximize2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  currentSection: string;
  onSearchChange?: (val: string) => void;
  onNavigate: (section: string) => void;
  extraActions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ currentSection, onSearchChange, onNavigate, extraActions }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Click outside listener to close dropdowns automatically
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const notifications = [
    { id: 1, title: 'Payment Pending Verification', desc: 'REC-2026-062: ₹25,000 for client Pradeep Chawla', time: '10m ago', unread: true },
    { id: 2, title: 'New Agreement Generated', desc: 'AGR-2067 pending client confirmation', time: '1h ago', unread: true },
    { id: 3, title: 'Advocate Assigned', desc: 'Adv. Amit Verma linked to case CL-8848', time: '3h ago', unread: false },
  ];

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-[#b5cbb3] bg-[#cadbc8] px-6 font-sans">
      {/* Left: Breadcrumb / Active Section */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-[#16a34a] animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#166534]">Welcome Back!</span>
        </div>
        <span className="text-slate-400 font-bold">/</span>
        <h1 className="text-sm font-bold text-slate-800 tracking-tight capitalize">
          {currentSection.replace(/-/g, ' ')}
        </h1>
      </div>

      {/* Middle: Quick Search */}
      <div className="hidden md:flex items-center w-80 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
        <input
          type="text"
          placeholder="Global search managers, employees, cases..."
          value={searchVal}
          onChange={handleSearch}
          className="w-full pl-9 pr-4 py-1.5 bg-white/90 border border-[#a8c0a6] rounded-xl text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-[#15803d] focus:bg-white transition-all shadow-2xs"
        />
      </div>

      {/* Right: Actions & Admin Profile */}
      <div className="flex items-center space-x-3">
        {extraActions}

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg hover:bg-[#b8ccb6] text-slate-700 transition-colors hidden sm:block cursor-pointer"
          title="Toggle Fullscreen"
          aria-label="Toggle Fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Real-time Payment Notifications Bell */}
        <NotificationBell onViewClient={(clientId) => onNavigate('clients')} />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2.5 p-1 pl-2 rounded-xl hover:bg-[#b8ccb6] transition-colors cursor-pointer"
            aria-label="User profile menu"
            aria-expanded={showProfileMenu}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#15803d] text-xs font-bold text-white shadow-xs">
              {user?.name ? user.name.charAt(0) : 'A'}
            </div>
            <div className="hidden text-left lg:block">
              <span className="text-xs font-bold text-slate-900 block leading-tight">{user?.name}</span>
              <span className="text-[10px] text-[#166534] font-semibold block leading-tight">Master Admin</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-gray-200 shadow-2xl p-2 z-[100] animate-fade-in text-slate-800 text-xs">
              <div className="p-3 border-b border-gray-100">
                <span className="font-bold text-slate-900 block">{user?.name}</span>
                <span className="text-[11px] text-slate-500 font-mono block">{user?.email}</span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-100 text-[#166534] text-[10px] font-bold">
                  Super Administrator
                </span>
              </div>
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  System Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate('audit');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Global Audit Logs
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
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
  );
};
