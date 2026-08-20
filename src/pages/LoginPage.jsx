import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import SettleXpertLogo from '../components/SettleXpertLogo';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extra safety: Clear any browser autofill on initial mount
  useEffect(() => {
    const t = setTimeout(() => {
      setEmail('');
      setPassword('');
    }, 100);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      localStorage.setItem('crm_token', data.token);
      localStorage.setItem('crm_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'url(/login-bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Subtle translucent tint overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(1px)'
      }} />

      {/* Premium Glassmorphism Card */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '14px',
        boxShadow: '0 20px 40px -15px rgba(0, 80, 40, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
        width: '100%',
        maxWidth: '410px',
        padding: '36px 32px 40px',
        border: '1px solid rgba(185, 210, 185, 0.7)'
      }}>
        {/* SettleXpert Logo */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <SettleXpertLogo height={42} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>
            SettleXpert CRM Portal
          </h2>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Sign in to access your workspace
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            marginBottom: '16px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Decoy inputs to absorb Chrome autofill heuristics */}
          <input type="text" name="fake_username" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
          <input type="password" name="fake_password" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Email Address / Employee ID
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="login_identifier"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your Email ID"
                className="form-control"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                style={{
                  width: '100%',
                  paddingLeft: '34px',
                  height: '38px',
                  borderRadius: '8px',
                  borderColor: '#cbd5e1',
                  backgroundColor: '#ffffff'
                }}
                required
              />
              <Mail size={15} color="#9ca3af" style={{ position: 'absolute', left: '11px', top: '11px' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="login_secret"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form-control"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                style={{
                  width: '100%',
                  paddingLeft: '34px',
                  paddingRight: '36px',
                  height: '38px',
                  borderRadius: '8px',
                  borderColor: '#cbd5e1',
                  backgroundColor: '#ffffff'
                }}
                required
              />
              <Lock size={15} color="#9ca3af" style={{ position: 'absolute', left: '11px', top: '11px' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af'
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', fontSize: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#4b5563' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#008037' }}
              />
              <span>Remember me</span>
            </label>
            <span style={{ color: '#008037', cursor: 'pointer', fontWeight: 600 }}>Forgot password?</span>
          </div>

          <button
            type="submit"
            className="btn-primary-green"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '10px 0',
              fontSize: '13px',
              borderRadius: '8px',
              backgroundColor: '#008037',
              boxShadow: '0 4px 12px rgba(0, 128, 55, 0.25)'
            }}
            disabled={loading}
          >
            <ShieldCheck size={16} />
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
