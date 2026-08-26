import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Eye,
  Check,
  RefreshCw,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { api } from '../../services/api';

interface PaymentNotification {
  id: string;
  client_id: string;
  client_name: string;
  client_number: string;
  client_phone: string;
  month_number: number;
  notification_type: 'PAYMENT_DUE_TODAY' | 'PARTIAL_PAYMENT' | 'PAYMENT_OVERDUE' | 'PAYMENT_RECEIVED';
  title: string;
  message: string;
  due_date: string;
  expected_amount: number;
  received_amount: number;
  pending_amount: number;
  days_overdue: number;
  status: 'active' | 'resolved';
  is_read: number;
  created_at: string;
}

interface NotificationCounts {
  unread_count: number;
  due_today_count: number;
  overdue_count: number;
  partial_count: number;
  received_count: number;
}

interface NotificationBellProps {
  onViewClient?: (clientId: string) => void;
}

const fmt = (amount: number) => '₹' + Number(amount || 0).toLocaleString('en-IN');

export const formatWhatsAppDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'long' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
};

const fmtDate = (dateStr: string) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export function generatePaymentReminderWhatsAppMessage({
  clientName,
  monthlyFee,
  receivedAmount = 0,
  pendingAmount = 0,
  dueDate,
  notificationType
}: {
  clientName: string;
  monthlyFee: number;
  receivedAmount?: number;
  pendingAmount?: number;
  dueDate: string;
  notificationType?: string;
}) {
  const formattedDate = formatWhatsAppDate(dueDate);
  const formattedExpected = fmt(monthlyFee);
  const formattedReceived = fmt(receivedAmount);
  const actualPending = pendingAmount > 0 ? pendingAmount : Math.max(0, monthlyFee - receivedAmount);
  const formattedPending = fmt(actualPending);

  // Partial Payment message format (Rule 6)
  if (notificationType === 'PARTIAL_PAYMENT' && receivedAmount > 0 && actualPending > 0) {
    return `Hello ${clientName}, your monthly SettleXpert fee of ${formattedExpected} was due on ${formattedDate}. We have received ${formattedReceived} so far, and ${formattedPending} is still pending. Kindly complete the pending payment and share the payment confirmation/receipt with us once completed. Thank you.`;
  }

  // Standard Payment Due Today / Overdue message format (Rule 2)
  return `Hello ${clientName}, your monthly SettleXpert fee of ${formattedExpected} is due today (${formattedDate}). Kindly make the payment at your earliest convenience and share the payment confirmation/receipt with us once completed. Thank you.`;
}

export function buildWhatsAppReminderUrl(
  phone: string,
  clientName: string,
  monthlyFee: number,
  receivedAmount: number,
  pendingAmount: number,
  dueDate: string,
  notificationType: string
): string | null {
  const clean = (phone || '').replace(/\D/g, '');
  if (!clean || clean.length < 10) {
    return null;
  }
  const e164 = clean.length === 10 ? '91' + clean : clean.startsWith('91') ? clean : '91' + clean;
  const msg = generatePaymentReminderWhatsAppMessage({
    clientName,
    monthlyFee,
    receivedAmount,
    pendingAmount,
    dueDate,
    notificationType
  });
  return `https://wa.me/${e164}?text=${encodeURIComponent(msg)}`;
}

const TYPE_CFG = {
  PAYMENT_DUE_TODAY: {
    icon: Clock, iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-100 text-amber-800 border border-amber-200',
    cardBorder: 'border-l-4 border-amber-400', cardBg: 'bg-amber-50',
    label: 'Due Today', dotColor: 'bg-amber-500'
  },
  PARTIAL_PAYMENT: {
    icon: AlertCircle, iconColor: 'text-orange-600',
    badgeBg: 'bg-orange-100 text-orange-800 border border-orange-200',
    cardBorder: 'border-l-4 border-orange-400', cardBg: 'bg-orange-50',
    label: 'Partial Payment', dotColor: 'bg-orange-500'
  },
  PAYMENT_OVERDUE: {
    icon: AlertTriangle, iconColor: 'text-rose-600',
    badgeBg: 'bg-rose-100 text-rose-800 border border-rose-200',
    cardBorder: 'border-l-4 border-rose-400', cardBg: 'bg-rose-50',
    label: 'Overdue', dotColor: 'bg-rose-600'
  },
  PAYMENT_RECEIVED: {
    icon: CheckCircle2, iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    cardBorder: 'border-l-4 border-emerald-400', cardBg: 'bg-emerald-50',
    label: 'Received', dotColor: 'bg-emerald-500'
  }
};

export const NotificationBell: React.FC<NotificationBellProps> = ({ onViewClient }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({
    unread_count: 0, due_today_count: 0, overdue_count: 0, partial_count: 0, received_count: 0
  });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const [typeFilter, setTypeFilter] = useState<'all' | 'PAYMENT_DUE_TODAY' | 'PARTIAL_PAYMENT' | 'PAYMENT_OVERDUE' | 'PAYMENT_RECEIVED'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {};
      if (activeFilter !== 'all') params.status = activeFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await api.getCRMNotifications(params as any);
      setNotifications(res.notifications || []);
      setCounts(res.counts || { unread_count: 0, due_today_count: 0, overdue_count: 0, partial_count: 0, received_count: 0 });
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [activeFilter, typeFilter]);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 60000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  useEffect(() => { if (isOpen) fetchNotifications(); }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const markRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setCounts(p => ({ ...p, unread_count: Math.max(0, p.unread_count - 1) }));
    } catch { /* noop */ }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(p => p.map(n => ({ ...n, is_read: 1 })));
      setCounts(p => ({ ...p, unread_count: 0 }));
    } catch { /* noop */ }
  };

  const runCheck = async () => {
    setLoading(true);
    try { await api.runPaymentDueCheck(); await fetchNotifications(); } catch { setLoading(false); }
  };

  const autoMarkRead = (notif: PaymentNotification) => {
    if (notif.is_read === 0) {
      api.markNotificationRead(notif.id).catch(() => {});
      setNotifications(p => p.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
      setCounts(p => ({ ...p, unread_count: Math.max(0, p.unread_count - 1) }));
    }
  };

  const unreadBadge = counts.unread_count;
  const activeAlerts = counts.due_today_count + counts.overdue_count + counts.partial_count;

  return (
    <div className="relative" ref={panelRef}>
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200 ${
          isOpen ? 'bg-[#111827] text-white shadow-lg'
          : activeAlerts > 0 ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 shadow-sm'
          : 'hover:bg-[#b8ccb6] text-slate-700'
        }`}
        title={`${unreadBadge} unread notifications`}
        aria-label="Payment Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadBadge > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm"
            style={{ minWidth: '18px', height: '18px', padding: '0 3px', lineHeight: '18px' }}>
            {unreadBadge > 99 ? '99+' : unreadBadge}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[999] overflow-hidden flex flex-col"
          style={{ width: '400px', maxHeight: '85vh' }}>

          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100" style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-amber-400" />
                <span className="font-bold text-white text-sm">Payment Notifications</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button onClick={runCheck} disabled={loading} title="Refresh" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {counts.due_today_count > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold"><Clock className="h-2.5 w-2.5 mr-1" />{counts.due_today_count} Due Today</span>}
              {counts.overdue_count > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold"><AlertTriangle className="h-2.5 w-2.5 mr-1" />{counts.overdue_count} Overdue</span>}
              {counts.partial_count > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold"><AlertCircle className="h-2.5 w-2.5 mr-1" />{counts.partial_count} Partial</span>}
              {counts.received_count > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold"><CheckCircle2 className="h-2.5 w-2.5 mr-1" />{counts.received_count} Received</span>}
              {activeAlerts === 0 && counts.received_count === 0 && <span className="text-slate-400 text-[10px]">No active alerts</span>}
            </div>
          </div>

          {/* Filters */}
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5">
            {(['active', 'all', 'resolved'] as const).map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${activeFilter === f ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Resolved'}
              </button>
            ))}
            <div className="flex-1" />
            {unreadBadge > 0 && (
              <button onClick={markAllRead} className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-1">
                <Check className="h-3 w-3" /><span>Mark All Read</span>
              </button>
            )}
          </div>
          <div className="px-3 py-2 border-b border-slate-100 flex gap-1 overflow-x-auto">
            {(['all', 'PAYMENT_DUE_TODAY', 'PAYMENT_OVERDUE', 'PARTIAL_PAYMENT', 'PAYMENT_RECEIVED'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${typeFilter === t ? 'bg-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {t === 'all' ? 'All Types' : t === 'PAYMENT_DUE_TODAY' ? 'Due Today' : t === 'PAYMENT_OVERDUE' ? 'Overdue' : t === 'PARTIAL_PAYMENT' ? 'Partial' : 'Received'}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs"><RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">No notifications</p>
                <p className="text-xs text-slate-400 mt-1">All payments are up to date</p>
              </div>
            ) : notifications.map(notif => {
              const cfg = TYPE_CFG[notif.notification_type] || TYPE_CFG.PAYMENT_DUE_TODAY;
              const Icon = cfg.icon;
              const expanded = expandedId === notif.id;
              const unread = notif.is_read === 0;
              return (
                <div key={notif.id} id={`notif-${notif.id}`}
                  className={`cursor-pointer transition-all duration-200 ${cfg.cardBorder} ${unread ? cfg.cardBg : 'bg-white'}`}
                  onClick={() => { setExpandedId(expanded ? null : notif.id); autoMarkRead(notif); }}>
                  <div className="px-3.5 py-3 flex items-start gap-2.5">
                    <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                      notif.notification_type === 'PAYMENT_RECEIVED' ? 'bg-emerald-100' :
                      notif.notification_type === 'PAYMENT_OVERDUE' ? 'bg-rose-100' :
                      notif.notification_type === 'PARTIAL_PAYMENT' ? 'bg-orange-100' : 'bg-amber-100'}`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                          {unread && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dotColor}`} />}
                          <span className="text-[11px] font-black text-slate-900 truncate">{notif.client_name}</span>
                          <span className="text-[9px] text-slate-400 font-mono shrink-0">{notif.client_number}</span>
                        </div>
                        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badgeBg}`}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-bold text-slate-800">{fmt(notif.expected_amount)}</span>
                          {notif.received_amount > 0 && <span className="text-emerald-700 font-semibold">+{fmt(notif.received_amount)} rcvd</span>}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar className="h-2.5 w-2.5" /><span>{fmtDate(notif.due_date)}</span>
                        </div>
                      </div>
                      {notif.days_overdue > 0 && <div className="mt-0.5 text-[10px] font-bold text-rose-600">Overdue by {notif.days_overdue} day{notif.days_overdue > 1 ? 's' : ''}</div>}
                      {notif.pending_amount > 0 && <div className="mt-0.5 text-[10px] text-slate-600">Pending: <span className="font-bold text-rose-600">{fmt(notif.pending_amount)}</span></div>}
                    </div>
                    <ChevronRight className={`h-3.5 w-3.5 text-slate-400 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                  </div>
                  {expanded && (
                    <div className="px-3.5 pb-3 border-t border-slate-100 bg-white space-y-2.5">
                      <div className="grid grid-cols-2 gap-1.5 pt-2.5 text-[11px]">
                        {[
                          { label: 'Month', value: `Month ${notif.month_number}`, cls: '' },
                          { label: 'Due Date', value: fmtDate(notif.due_date), cls: '' },
                          { label: 'Expected', value: fmt(notif.expected_amount), cls: '' },
                          { label: 'Received', value: fmt(notif.received_amount), cls: notif.received_amount >= notif.expected_amount ? 'text-emerald-700' : notif.received_amount > 0 ? 'text-orange-600' : 'text-rose-600' }
                        ].map(item => (
                          <div key={item.label} className="bg-slate-50 rounded-lg p-2">
                            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wide mb-0.5">{item.label}</span>
                            <span className={`font-bold text-slate-800 ${item.cls}`}>{item.value}</span>
                          </div>
                        ))}
                        {notif.pending_amount > 0 && (
                          <div className="bg-rose-50 rounded-lg p-2 col-span-2">
                            <span className="text-rose-500 block text-[10px] font-bold uppercase tracking-wide mb-0.5">Pending Balance</span>
                            <span className="font-bold text-rose-700 text-base">{fmt(notif.pending_amount)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>
                          {notif.notification_type === 'PAYMENT_DUE_TODAY' ? 'Payment Due Today' :
                           notif.notification_type === 'PAYMENT_OVERDUE' ? `Overdue ${notif.days_overdue}d` :
                           notif.notification_type === 'PARTIAL_PAYMENT' ? 'Partially Paid' : 'Payment Received'}
                        </span>
                        {unread && (
                          <button onClick={(e) => markRead(notif.id, e)} className="text-[10px] text-slate-500 hover:text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="h-3 w-3" />Mark Read
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 pt-1 items-center">
                        {notif.notification_type === 'PAYMENT_RECEIVED' || (notif.pending_amount <= 0 && notif.received_amount >= notif.expected_amount) ? (
                          <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Payment Already Received</span>
                          </div>
                        ) : (
                          <button
                            id={`whatsapp-btn-${notif.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = buildWhatsAppReminderUrl(
                                notif.client_phone,
                                notif.client_name,
                                notif.expected_amount,
                                notif.received_amount,
                                notif.pending_amount,
                                notif.due_date,
                                notif.notification_type
                              );
                              if (!url) {
                                alert('WhatsApp number is not available for this client.');
                                return;
                              }
                              window.open(url, '_blank');
                            }}
                            className="flex-1 py-2 rounded-xl text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 active:scale-98 transition-all cursor-pointer"
                            style={{ background: '#25D366' }}
                            title={`Send SettleXpert payment reminder to ${notif.client_name}`}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                        {onViewClient && (
                          <button id={`view-client-btn-${notif.id}`}
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); onViewClient(notif.client_id); }}
                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer">
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Client</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-center">
              <span className="text-[10px] text-slate-500">{notifications.length} notification{notifications.length !== 1 ? 's' : ''} • Auto-refreshes every 60s</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

