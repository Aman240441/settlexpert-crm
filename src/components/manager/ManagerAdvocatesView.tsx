import React, { useState, useEffect } from 'react';
import {
  Scale,
  Search,
  Building2,
  Phone,
  Mail,
  UserCheck,
  Award,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';

export const ManagerAdvocatesView: React.FC = () => {
  const [advocates, setAdvocates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAdvocates = async () => {
      try {
        setLoading(true);
        const res = await api.getManagerAdvocates();
        setAdvocates(res.advocates || []);
      } catch (err) {
        console.error('Failed to load advocates', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdvocates();
  }, []);

  const filtered = advocates.filter((a) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.name?.toLowerCase().includes(s) ||
      a.registration_number?.toLowerCase().includes(s) ||
      a.specialization?.toLowerCase().includes(s) ||
      a.email?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Scale className="h-5 w-5 text-indigo-400" />
            <span>Empanelled Legal Advocates & Counsel Directory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Empanelled advocate partners representing client debt settlement and notice conciliations.
          </p>
        </div>

        <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-indigo-400">
          {advocates.length} Empanelled Advocates
        </span>
      </div>

      {/* Search */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Advocate Name, Bar Registration, Specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Advocates Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading advocates directory...
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((adv) => (
            <div
              key={adv.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all shadow-xl space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-black text-sm flex items-center justify-center">
                    <Scale className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{adv.name}</h4>
                    <span className="text-[10px] font-mono text-indigo-400">{adv.registration_number || 'Bar Registered'}</span>
                  </div>
                </div>
                <Badge status={adv.status || 'active'} />
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Award className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span className="text-[11px] text-slate-300 font-semibold">{adv.specialization || 'Banking & IBC'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="text-[11px] text-slate-400 truncate">{adv.email || '—'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="text-[11px] text-slate-400">{adv.mobile || adv.phone || '—'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Assigned Cases:</span>
                <span className="font-black text-white px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                  {adv.assigned_clients_count || 0} Clients
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          No advocates found.
        </div>
      )}
    </div>
  );
};
