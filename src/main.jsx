import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './admin.css';

// Global fetch interceptor to attach JWT token and route to VITE_API_URL if configured
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  let targetUrl = url;
  if (typeof url === 'string' && url.startsWith('/api/')) {
    if (API_BASE) {
      targetUrl = `${API_BASE}${url}`;
    }
    const token = localStorage.getItem('crm_token');
    if (token && !url.startsWith('/api/auth/login')) {
      const existingHeaders = options.headers || {};
      const headers = existingHeaders instanceof Headers 
        ? existingHeaders 
        : { ...existingHeaders };

      if (!(existingHeaders instanceof Headers) && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      options = { ...options, headers };
    }
  }
  const response = await originalFetch(targetUrl, options);
  if (response.status === 401 || response.status === 403) {
    try {
      const clone = response.clone();
      const body = await clone.json();
      if (body && body.error && (body.error.includes('expired token') || body.error.includes('Access token required'))) {
        localStorage.removeItem('crm_token');
        localStorage.removeItem('crm_user');
        if (!window.location.pathname.includes('login')) {
          window.location.reload();
        }
      }
    } catch (e) {}
  }
  return response;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
