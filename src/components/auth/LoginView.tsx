import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Invalid email/employee ID or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 relative overflow-hidden bg-[#edf7f0] font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Silky mint/green wave background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft radial aura */}
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-white via-[#d5eedd]/60 to-transparent blur-3xl" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-tl from-[#bde4c8]/50 via-[#e0f4e6]/70 to-transparent blur-3xl" />
        
        {/* SVG Ribbon Waves */}
        <svg
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="35%" stopColor="#c8ebcf" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#9ed3aa" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#dcf3e2" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="waveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#a3dcb0" stopOpacity="0.5" />
              <stop offset="80%" stopColor="#6ebf81" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#e8f8ed" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="waveGrad3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b4e4c0" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#81cca0" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Flowing Ribbon 1 */}
          <path
            d="M-100,500 C300,200 600,750 1100,250 C1300,50 1450,150 1600,200 L1600,900 L-100,900 Z"
            fill="url(#waveGrad1)"
          />

          {/* Flowing Ribbon 2 */}
          <path
            d="M-100,200 C250,550 700,100 1150,600 C1350,800 1500,650 1600,550 L1600,900 L-100,900 Z"
            fill="url(#waveGrad2)"
          />

          {/* Flowing Ribbon 3 */}
          <path
            d="M-50,700 C400,450 750,850 1200,400 C1400,200 1550,300 1650,250 L1650,900 L-50,900 Z"
            fill="url(#waveGrad3)"
          />

          {/* Crisp highlight edge waves */}
          <path
            d="M-100,500 C300,200 600,750 1100,250 C1300,50 1450,150 1600,200"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeOpacity="0.7"
          />
          <path
            d="M-100,200 C250,550 700,100 1150,600 C1350,800 1500,650 1600,550"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeOpacity="0.6"
          />
          <path
            d="M-50,700 C400,450 750,850 1200,400 C1400,200 1550,300 1650,250"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
        </svg>

        {/* Ambient subtle light sheen */}
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-white/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-44 h-44 bg-white/50 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[440px] bg-white rounded-3xl p-8 sm:p-9 shadow-2xl shadow-emerald-950/10 border border-slate-100 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center">
          <div className="flex items-center justify-center mb-2.5">
            <img
              src="/logo.png"
              alt="SettleXpert"
              className="h-12 sm:h-14 w-auto max-w-[240px] object-contain"
            />
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            CRM Portal
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Sign in to access your workspace
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1.5">
              Email Address / Employee ID
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your ID"
                autoComplete="off"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#047857] focus:ring-[#047857] cursor-pointer"
              />
              <span className="text-xs text-slate-600 font-medium">Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => alert('Please contact Super Administrator (settlexperts@gmail.com) to reset your password.')}
              className="text-xs font-bold text-[#047857] hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#047857] hover:bg-[#03694c] active:bg-[#025a40] text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/15 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer mt-2"
          >
            <CheckCircle2 className="h-4 w-4 text-white" />
            <span>{loading ? 'Signing In...' : 'Sign In to Portal'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
