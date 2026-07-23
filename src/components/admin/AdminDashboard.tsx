import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, CartesianGrid
} from 'recharts';
import {
  LogOut, Shield, Users as UsersIcon, Activity, Settings, List, Search,
  RefreshCw, Check, AlertTriangle, Trash2, ChevronRight, X, Zap,
  DollarSign, BarChart2, Cpu, Server, Clock, Eye, TrendingUp, Database
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import {
  collection, getDocs, doc, getDoc, setDoc, updateDoc,
  query, orderBy, limit, onSnapshot, deleteDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BrandLogo from '../BrandLogo';
import { cn } from '../../lib/utils';
import { logSystemEvent, SystemLog } from '../../lib/admin';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRecord {
  id: string;
  email?: string;
  role?: string;
  createdAt?: any;
  displayName?: string;
}

interface UserWithUsage extends UserRecord {
  tokensUsed: number;
  tokenLimit: number;
  leadCount: number;
  lastActive: Date | null;
  mrrContribution: number;
}

type AdminTab = 'overview' | 'customers' | 'revenue' | 'usage' | 'health';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<string, number> = {
  free: 50_000,
  starter: 100_000,
  pro: 250_000,
  admin: 999_999,
};

const PLAN_MRR: Record<string, number> = {
  free: 0,
  starter: 49,
  pro: 99,
  admin: 0,
};

// Rough Gemini 2.5 Flash pricing estimate (input tokens, $/1M)
const GEMINI_COST_PER_M = 0.075;
// Rough Groq cost (free tier is very cheap — approximated)
const GROQ_COST_PER_M = 0.005;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(date: Date | null): string {
  if (!date) return '—';
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function planLabel(role?: string): string {
  if (!role || role === 'free') return 'Free';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function planColor(role?: string): string {
  switch (role) {
    case 'pro': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'starter': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'admin': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

// ─── Stat Cell ─────────────────────────────────────────────────────────────────

function StatCell({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="p-4 border border-border-default bg-surface-card rounded-lg">
      <p className="text-[11px] uppercase tracking-widest font-semibold text-text-tertiary mb-1">{label}</p>
      <p className="text-[22px] font-bold text-text-primary font-mono tabular-nums leading-none">{value}</p>
      {sub && <p className="text-[11px] text-text-secondary mt-1">{sub}</p>}
    </div>
  );
}

// ─── Plan Pill ─────────────────────────────────────────────────────────────────

function PlanPill({ role }: { role?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded border whitespace-nowrap', planColor(role))}>
      {planLabel(role)}
    </span>
  );
}

// ─── Loading Spinner ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw className="w-5 h-5 text-text-tertiary animate-spin" />
    </div>
  );
}

// ─── Token Bar ─────────────────────────────────────────────────────────────────

function TokenBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isHigh = pct >= 80;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-border-default rounded-full overflow-hidden min-w-[48px]">
        <div
          className={cn('h-full rounded-full transition-all', isHigh ? 'bg-amber-500' : 'bg-indigo-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-text-secondary whitespace-nowrap font-mono">
        {formatTokens(used)}/{formatTokens(limit)}
      </span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // ── Data ───────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersWithUsage, setUsersWithUsage] = useState<UserWithUsage[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [config, setConfig] = useState({ maintenanceMode: false, rateLimit: 120, webhooksEnabled: true });
  const [selectedUser, setSelectedUser] = useState<UserWithUsage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'paid' | 'free' | 'high_usage' | 'admin'>('all');

  // ── Loading ────────────────────────────────────────────────────────────────
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);

  // ── Fetch base users ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const snap = await getDocs(collection(db, 'users'));
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserRecord)));
      } catch (e) {
        toast.error('Could not load users.');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // ── Fetch per-user token usage & lead counts ───────────────────────────────
  useEffect(() => {
    if (users.length === 0) return;
    const enrichUsers = async () => {
      setLoadingUsage(true);
      try {
        // Fetch all leads to count per user and get last active
        const leadsSnap = await getDocs(collection(db, 'leads'));
        const leadsByUser: Record<string, { count: number; lastDate: Date | null }> = {};
        leadsSnap.docs.forEach(d => {
          const data = d.data();
          const uid = data.userId;
          if (!uid) return;
          if (!leadsByUser[uid]) leadsByUser[uid] = { count: 0, lastDate: null };
          leadsByUser[uid].count++;
          const ts = data.updatedAt || data.createdAt;
          const date = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
          if (date && (!leadsByUser[uid].lastDate || date > leadsByUser[uid].lastDate!)) {
            leadsByUser[uid].lastDate = date;
          }
        });

        // Fetch token usage per user
        const enriched = await Promise.all(users.map(async (u) => {
          let tokensUsed = 0;
          let tokenLimit = PLAN_LIMITS[u.role || 'free'] ?? 50_000;
          try {
            const usageDoc = await getDoc(doc(db, 'users', u.id, 'usage', 'tokens'));
            if (usageDoc.exists()) {
              const data = usageDoc.data();
              tokensUsed = data.tokensUsed ?? 0;
              if (data.limit) tokenLimit = data.limit;
            }
          } catch (_) { /* no usage doc — default to 0 */ }

          const userLeads = leadsByUser[u.id] || { count: 0, lastDate: null };
          return {
            ...u,
            tokensUsed,
            tokenLimit,
            leadCount: userLeads.count,
            lastActive: userLeads.lastDate,
            mrrContribution: PLAN_MRR[u.role || 'free'] ?? 0,
          } as UserWithUsage;
        }));

        setUsersWithUsage(enriched);
      } catch (e) {
        console.error('Usage enrichment failed', e);
      } finally {
        setLoadingUsage(false);
      }
    };
    enrichUsers();
  }, [users]);

  // ── Config fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'system'));
        if (snap.exists()) setConfig(snap.data() as typeof config);
        else await setDoc(doc(db, 'config', 'system'), config);
      } catch (_) {} finally { setLoadingConfig(false); }
    };
    fetchConfig();
  }, []);

  // ── Live logs (only when on health tab) ───────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'health') return;
    setLoadingLogs(true);
    const q = query(collection(db, 'system_logs'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as SystemLog));
      fetched.sort((a, b) => {
        const ta = a.timestamp?.toMillis?.() ?? (a.timestamp || 0);
        const tb = b.timestamp?.toMillis?.() ?? (b.timestamp || 0);
        return tb - ta;
      });
      setLogs(fetched.slice(0, 20));
      setLoadingLogs(false);
    }, () => { setLoadingLogs(false); });
    return () => unsub();
  }, [activeTab]);

  // ── Derived metrics ────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const free = usersWithUsage.filter(u => !u.role || u.role === 'free').length;
    const starter = usersWithUsage.filter(u => u.role === 'starter').length;
    const pro = usersWithUsage.filter(u => u.role === 'pro').length;
    const admin = usersWithUsage.filter(u => u.role === 'admin').length;
    const mrr = (starter * 49) + (pro * 99);
    const totalTokensUsed = usersWithUsage.reduce((s, u) => s + u.tokensUsed, 0);
    const totalLeads = usersWithUsage.reduce((s, u) => s + u.leadCount, 0);

    // Today / this week signups
    const now = Date.now();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now - 7 * 86400000);
    const signupsToday = users.filter(u => {
      const ts = (u as any).createdAt;
      const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
      return d && d >= todayStart;
    }).length;
    const signupsWeek = users.filter(u => {
      const ts = (u as any).createdAt;
      const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
      return d && d >= weekStart;
    }).length;

    // Accounts needing attention: >90% quota usage
    const atRisk = usersWithUsage.filter(u => u.tokenLimit > 0 && (u.tokensUsed / u.tokenLimit) >= 0.9);

    // Paid: starter + pro
    const paidCount = starter + pro;

    // Cost estimate — paid users use Gemini, free use Groq
    const paidTokens = usersWithUsage.filter(u => u.role === 'starter' || u.role === 'pro').reduce((s, u) => s + u.tokensUsed, 0);
    const freeTokens = usersWithUsage.filter(u => !u.role || u.role === 'free').reduce((s, u) => s + u.tokensUsed, 0);
    const estimatedCost = ((paidTokens / 1_000_000) * GEMINI_COST_PER_M) + ((freeTokens / 1_000_000) * GROQ_COST_PER_M);

    return { free, starter, pro, admin, mrr, totalTokensUsed, totalLeads, signupsToday, signupsWeek, atRisk, paidCount, estimatedCost, paidTokens, freeTokens };
  }, [usersWithUsage, users]);

  // ── Filtered customer list ─────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    let list = [...usersWithUsage];
    const q = searchQuery.toLowerCase();
    if (q) list = list.filter(u => (u.email || '').toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
    if (customerFilter === 'paid') list = list.filter(u => u.role === 'starter' || u.role === 'pro');
    if (customerFilter === 'free') list = list.filter(u => !u.role || u.role === 'free');
    if (customerFilter === 'admin') list = list.filter(u => u.role === 'admin');
    if (customerFilter === 'high_usage') list = list.filter(u => u.tokenLimit > 0 && (u.tokensUsed / u.tokenLimit) >= 0.8);
    list.sort((a, b) => b.tokensUsed - a.tokensUsed);
    return list;
  }, [usersWithUsage, searchQuery, customerFilter]);

  // ── Top users by usage ─────────────────────────────────────────────────────
  const topByUsage = useMemo(() => {
    return [...usersWithUsage].sort((a, b) => b.tokensUsed - a.tokensUsed).slice(0, 10);
  }, [usersWithUsage]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logSystemEvent('Admin Logged Out', 'info');
    await auth.signOut();
    navigate('/admin');
  };

  const handleChangePlan = async (targetUid: string, role: string) => {
    setChangingPlan(true);
    const tid = toast.loading(`Changing plan to ${role}...`);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/upgradeUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ targetUid, role }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success(`Plan changed to ${role}`, { id: tid });
      setUsers(u => u.map(x => x.id === targetUid ? { ...x, role } : x));
      if (selectedUser?.id === targetUid) setSelectedUser(s => s ? { ...s, role } : s);
      await logSystemEvent(`User plan changed to ${role}`, 'success', targetUid);
    } catch (e: any) {
      toast.error(e.message || 'Failed', { id: tid });
    } finally { setChangingPlan(false); }
  };

  const handleDeleteUser = async (uid: string, email?: string) => {
    if (!window.confirm(`Delete ${email || uid}? This is permanent.`)) return;
    const tid = toast.loading('Deleting...');
    try {
      await deleteDoc(doc(db, 'users', uid));
      toast.success('User deleted', { id: tid });
      setUsers(u => u.filter(x => x.id !== uid));
      setUsersWithUsage(u => u.filter(x => x.id !== uid));
      if (selectedUser?.id === uid) setSelectedUser(null);
      await logSystemEvent(`Deleted user ${uid}`, 'warn', 'system');
    } catch (e: any) {
      toast.error(e.message || 'Failed', { id: tid });
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await updateDoc(doc(db, 'config', 'system'), config);
      toast.success('Config saved');
      await logSystemEvent('System config updated', 'warn');
    } catch { toast.error('Save failed'); } finally { setSavingConfig(false); }
  };

  // ─── Nav tabs ─────────────────────────────────────────────────────────────
  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'customers', label: 'Customers', icon: UsersIcon },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'usage', label: 'Usage & Costs', icon: Cpu },
    { id: 'health', label: 'System Health', icon: Server },
  ];

  // ── Customer detail panel ──────────────────────────────────────────────────
  const DetailPanel = () => {
    const u = selectedUser;
    if (!u) return null;
    const usagePct = u.tokenLimit > 0 ? Math.min((u.tokensUsed / u.tokenLimit) * 100, 100) : 0;
    return (
      <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedUser(null)}>
        <div className="absolute inset-0 bg-black/10" />
        <div
          className="relative w-full max-w-[420px] bg-surface-card border-l border-border-default h-full overflow-y-auto shadow-xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-text-primary truncate max-w-[280px]">{u.email || 'No email'}</p>
              <p className="text-[11px] text-text-tertiary font-mono mt-0.5 truncate">{u.id}</p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-surface-secondary rounded-lg transition-colors">
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>

          {/* Info */}
          <div className="px-6 py-4 border-b border-border-default space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-text-secondary">Plan</span>
              <PlanPill role={u.role} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-text-secondary">Signed Up</span>
              <span className="text-[12px] font-mono text-text-primary">{formatDate((u as any).createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-text-secondary">Last Active</span>
              <span className="text-[12px] text-text-primary">{formatRelative(u.lastActive)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-text-secondary">Leads</span>
              <span className="text-[12px] font-mono text-text-primary">{u.leadCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-text-secondary">MRR Contribution</span>
              <span className="text-[12px] font-mono text-text-primary">${u.mrrContribution}/mo</span>
            </div>
          </div>

          {/* Token usage */}
          <div className="px-6 py-4 border-b border-border-default">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-text-tertiary mb-3">AI Token Usage</p>
            <TokenBar used={u.tokensUsed} limit={u.tokenLimit} />
            <p className="text-[11px] text-text-tertiary mt-2">{usagePct.toFixed(1)}% of monthly quota</p>
          </div>

          {/* Quick actions */}
          {u.role !== 'admin' && (
            <div className="px-6 py-4 border-b border-border-default">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-text-tertiary mb-3">Change Plan</p>
              <div className="flex flex-wrap gap-2">
                {['free', 'starter', 'pro'].map(role => (
                  <button
                    key={role}
                    disabled={u.role === role || changingPlan}
                    onClick={() => handleChangePlan(u.id, role)}
                    className={cn(
                      'px-3 py-1.5 text-[12px] font-semibold border rounded-lg transition-colors disabled:opacity-40',
                      u.role === role
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-surface-card text-text-primary border-border-default hover:border-indigo-400 hover:text-indigo-600'
                    )}
                  >
                    {planLabel(role)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Danger zone */}
          {u.role !== 'admin' && (
            <div className="px-6 py-4 mt-auto">
              <button
                onClick={() => handleDeleteUser(u.id, u.email)}
                className="w-full px-4 py-2.5 text-[12px] font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-background text-text-primary font-sans flex flex-col">

      {/* Top nav bar */}
      <header className="h-12 bg-surface-card border-b border-border-default flex items-center px-6 shrink-0 z-20 sticky top-0">
        <div className="flex items-center gap-2 mr-8">
          <BrandLogo className="w-5 h-5 text-text-primary" />
          <span className="text-[13px] font-semibold text-text-primary tracking-tight">ArchAdmin</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded uppercase tracking-wider ml-1">Internal</span>
        </div>

        {/* Tab bar */}
        <nav className="flex items-center gap-0.5 flex-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 ml-6">
          <button
            onClick={() => window.location.reload()}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 py-6 max-w-7xl w-full mx-auto">

        {/* ── TAB 1: OVERVIEW ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-[18px] font-semibold text-text-primary">Overview</h1>
              <p className="text-[12px] text-text-secondary mt-0.5">State of the business at a glance. All numbers are live from Firestore.</p>
            </div>

            {(loadingUsers || loadingUsage) ? <Spinner /> : (
              <>
                {/* Tier breakdown + key numbers */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCell label="Total Accounts" value={users.length} sub={`${metrics.paidCount} paying`} />
                  <StatCell label="MRR" value={`$${metrics.mrr.toLocaleString()}`} sub="Starter + Pro" />
                  <StatCell label="New Today" value={metrics.signupsToday} sub={`${metrics.signupsWeek} this week`} />
                  <StatCell label="At Risk (>90%)" value={metrics.atRisk.length} sub="Quota nearly full" />
                </div>

                {/* Plan breakdown */}
                <div className="bg-surface-card border border-border-default rounded-lg p-4">
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-text-tertiary mb-3">Account Tiers</p>
                  <div className="flex flex-wrap gap-6">
                    {[
                      { label: 'Free', count: metrics.free, color: 'text-text-secondary' },
                      { label: 'Starter', count: metrics.starter, color: 'text-blue-600' },
                      { label: 'Pro', count: metrics.pro, color: 'text-indigo-600' },
                      { label: 'Admin', count: metrics.admin, color: 'text-red-600' },
                    ].map(tier => (
                      <div key={tier.label} className="flex items-baseline gap-1.5">
                        <span className={cn('text-[20px] font-bold font-mono tabular-nums', tier.color)}>{tier.count}</span>
                        <span className="text-[12px] text-text-secondary">{tier.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Needs attention */}
                <div className="bg-surface-card border border-border-default rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-text-primary">Needs Attention</p>
                    <span className="text-[11px] text-text-secondary">{metrics.atRisk.length > 0 ? `${metrics.atRisk.length} accounts` : 'None'}</span>
                  </div>
                  {metrics.atRisk.length === 0 ? (
                    <div className="px-4 py-6 text-[12px] text-text-tertiary text-center">No accounts near quota limit.</div>
                  ) : (
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-border-default bg-surface-secondary">
                          <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Account</th>
                          <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Plan</th>
                          <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Token Usage</th>
                          <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">% Used</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {metrics.atRisk.map(u => {
                          const pct = ((u.tokensUsed / u.tokenLimit) * 100).toFixed(0);
                          return (
                            <tr
                              key={u.id}
                              className="hover:bg-surface-secondary cursor-pointer transition-colors"
                              onClick={() => { setSelectedUser(u); setActiveTab('customers'); }}
                            >
                              <td className="px-4 py-2.5 text-text-primary font-medium truncate max-w-[180px]">{u.email || u.id.slice(0, 12) + '…'}</td>
                              <td className="px-4 py-2.5"><PlanPill role={u.role} /></td>
                              <td className="px-4 py-2.5"><TokenBar used={u.tokensUsed} limit={u.tokenLimit} /></td>
                              <td className="px-4 py-2.5">
                                <span className="text-amber-600 font-semibold font-mono">{pct}%</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB 2: CUSTOMERS ────────────────────────────────────────────── */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-[18px] font-semibold text-text-primary">Customers</h1>
                <p className="text-[12px] text-text-secondary mt-0.5">{usersWithUsage.length} total accounts</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter pills */}
                {(['all', 'paid', 'free', 'high_usage', 'admin'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setCustomerFilter(f)}
                    className={cn(
                      'px-3 py-1.5 text-[11px] font-semibold rounded-md border transition-colors whitespace-nowrap',
                      customerFilter === f
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-surface-card text-text-secondary border-border-default hover:border-border-hover hover:text-text-primary'
                    )}
                  >
                    {f === 'high_usage' ? 'High Usage >80%' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search email or UID…"
                    className="pl-8 pr-4 py-1.5 text-[12px] border border-border-default bg-surface-card rounded-lg focus:outline-none focus:border-indigo-400 transition-colors w-52"
                  />
                </div>
              </div>
            </div>

            {(loadingUsers || loadingUsage) ? <Spinner /> : (
              <div className="bg-surface-card border border-border-default rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] min-w-[900px]">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-border-default">
                        {['Account', 'Plan', 'Signed Up', 'Last Active', 'Leads', 'Tokens Used', 'MRR'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {filteredUsers.length === 0 ? (
                        <tr><td colSpan={8} className="px-4 py-12 text-center text-text-tertiary">No accounts match this filter.</td></tr>
                      ) : filteredUsers.map(u => (
                        <tr
                          key={u.id}
                          className="hover:bg-surface-secondary cursor-pointer transition-colors group"
                          onClick={() => setSelectedUser(u)}
                        >
                          <td className="px-4 py-2.5">
                            <div>
                              <p className="text-text-primary font-medium truncate max-w-[180px]">{u.email || '—'}</p>
                              <p className="text-text-tertiary font-mono text-[10px] mt-0.5 truncate">{u.id.slice(0, 10)}…</p>
                            </div>
                          </td>
                          <td className="px-4 py-2.5"><PlanPill role={u.role} /></td>
                          <td className="px-4 py-2.5 text-text-secondary font-mono whitespace-nowrap">{formatDate((u as any).createdAt)}</td>
                          <td className="px-4 py-2.5 text-text-secondary whitespace-nowrap">{formatRelative(u.lastActive)}</td>
                          <td className="px-4 py-2.5 text-text-primary font-mono">{u.leadCount}</td>
                          <td className="px-4 py-2.5 min-w-[140px]"><TokenBar used={u.tokensUsed} limit={u.tokenLimit} /></td>
                          <td className="px-4 py-2.5 text-text-primary font-mono whitespace-nowrap">
                            {u.mrrContribution > 0 ? `$${u.mrrContribution}` : '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <ChevronRight className="w-3.5 h-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: REVENUE ──────────────────────────────────────────────── */}
        {activeTab === 'revenue' && (() => {
          const mrrBarData = [
            { tier: 'Free', mrr: 0, accounts: metrics.free, fill: '#94A3B8' },
            { tier: 'Starter', mrr: metrics.starter * 49, accounts: metrics.starter, fill: '#3B82F6' },
            { tier: 'Pro', mrr: metrics.pro * 99, accounts: metrics.pro, fill: '#4F46E5' },
          ];
          const accountPieData = [
            { name: 'Free', value: metrics.free, fill: '#CBD5E1' },
            { name: 'Starter', value: metrics.starter, fill: '#3B82F6' },
            { name: 'Pro', value: metrics.pro, fill: '#4F46E5' },
          ].filter(d => d.value > 0);

          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-[18px] font-semibold text-text-primary">Revenue</h1>
                <p className="text-[12px] text-text-secondary mt-0.5">Calculated from current plan tier assignments. No historical Firestore snapshots — charts show current-state distribution.</p>
              </div>

              {(loadingUsers || loadingUsage) ? <Spinner /> : (
                <>
                  {/* Top stat row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCell label="Total MRR" value={`$${metrics.mrr.toLocaleString()}`} sub="Starter + Pro" />
                    <StatCell label="Paid Accounts" value={metrics.paidCount} sub={`of ${users.length} total`} />
                    <StatCell label="Starter MRR" value={`$${(metrics.starter * 49).toLocaleString()}`} sub={`${metrics.starter} accounts × $49`} />
                    <StatCell label="Pro MRR" value={`$${(metrics.pro * 99).toLocaleString()}`} sub={`${metrics.pro} accounts × $99`} />
                  </div>

                  {/* Charts row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* MRR by tier bar chart */}
                    <div className="bg-surface-card border border-border-default rounded-lg p-4">
                      <p className="text-[13px] font-semibold text-text-primary mb-1">MRR by Plan Tier</p>
                      <p className="text-[11px] text-text-tertiary mb-4">Current monthly revenue contribution per tier</p>
                      {metrics.mrr === 0 ? (
                        <div className="h-[200px] flex items-center justify-center text-[12px] text-text-tertiary">No paid accounts yet — chart will populate when you have paying customers.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={mrrBarData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
                            <XAxis dataKey="tier" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                            <Tooltip
                              contentStyle={{ fontSize: 12, border: '1px solid rgba(15,23,42,0.08)', borderRadius: 8, background: '#F8FAFC', boxShadow: 'none' }}
                              formatter={(v: any) => [`$${v.toLocaleString()}`, 'MRR']}
                              cursor={{ fill: 'rgba(15,23,42,0.04)' }}
                            />
                            <Bar dataKey="mrr" radius={[4, 4, 0, 0]}>
                              {mrrBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Account distribution pie */}
                    <div className="bg-surface-card border border-border-default rounded-lg p-4">
                      <p className="text-[13px] font-semibold text-text-primary mb-1">Account Distribution</p>
                      <p className="text-[11px] text-text-tertiary mb-4">Breakdown of accounts by plan tier</p>
                      {users.length === 0 ? (
                        <div className="h-[200px] flex items-center justify-center text-[12px] text-text-tertiary">No accounts yet.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={accountPieData}
                              cx="50%" cy="50%"
                              innerRadius={55} outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {accountPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Pie>
                            <Tooltip
                              contentStyle={{ fontSize: 12, border: '1px solid rgba(15,23,42,0.08)', borderRadius: 8, background: '#F8FAFC', boxShadow: 'none' }}
                              formatter={(v: any, name: any) => [v + ' accounts', name]}
                            />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Accounts × Price table */}
                  <div className="bg-surface-card border border-border-default rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-border-default">
                      <p className="text-[13px] font-semibold text-text-primary">MRR Breakdown Table</p>
                    </div>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="bg-surface-secondary border-b border-border-default">
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Tier</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Accounts</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Price/mo</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">MRR</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">ARR (×12)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {[
                          { label: 'Starter', count: metrics.starter, price: 49 },
                          { label: 'Pro', count: metrics.pro, price: 99 },
                          { label: 'Free', count: metrics.free, price: 0 },
                        ].map(row => (
                          <tr key={row.label}>
                            <td className="px-4 py-3 font-medium text-text-primary">{row.label}</td>
                            <td className="px-4 py-3 font-mono text-text-primary">{row.count}</td>
                            <td className="px-4 py-3 text-text-secondary">{row.price > 0 ? `$${row.price}` : '—'}</td>
                            <td className="px-4 py-3 font-mono font-semibold text-text-primary">
                              {row.price > 0 ? `$${(row.count * row.price).toLocaleString()}` : '—'}
                            </td>
                            <td className="px-4 py-3 font-mono text-text-secondary">
                              {row.price > 0 ? `$${(row.count * row.price * 12).toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-border-hover bg-surface-secondary">
                          <td className="px-4 py-3 font-bold text-text-primary" colSpan={3}>Total</td>
                          <td className="px-4 py-3 font-bold font-mono text-indigo-600 text-[14px]">${metrics.mrr.toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold font-mono text-indigo-600 text-[14px]">${(metrics.mrr * 12).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Conversion + churn */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-surface-card border border-border-default rounded-lg p-4">
                      <p className="text-[11px] uppercase tracking-widest font-semibold text-text-tertiary mb-2">Trial → Paid Conversion</p>
                      {users.length > 0 ? (
                        <>
                          <p className="text-[20px] font-bold font-mono text-text-primary">
                            {((metrics.paidCount / users.length) * 100).toFixed(1)}%
                          </p>
                          <p className="text-[11px] text-text-secondary mt-1">{metrics.paidCount} of {users.length} accounts on paid plans</p>
                        </>
                      ) : (
                        <p className="text-[12px] text-text-tertiary">Not enough data yet</p>
                      )}
                    </div>
                    <div className="bg-surface-card border border-border-default rounded-lg p-4">
                      <p className="text-[11px] uppercase tracking-widest font-semibold text-text-tertiary mb-2">Churn Rate</p>
                      <p className="text-[12px] text-text-tertiary">Not yet instrumented. Cancellation events not tracked in Firestore.</p>
                    </div>
                    <div className="bg-surface-card border border-border-default rounded-lg p-4">
                      <p className="text-[11px] uppercase tracking-widest font-semibold text-text-tertiary mb-2">Failed Payments</p>
                      <p className="text-[12px] text-text-tertiary">Not yet instrumented. Stripe webhook events not stored in Firestore.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ── TAB 4: USAGE & COSTS ─────────────────────────────────────────── */}
        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-[18px] font-semibold text-text-primary">Usage & Costs</h1>
              <p className="text-[12px] text-text-secondary mt-0.5">Platform-wide AI consumption. Free users → Standard AI Engine. Paid users → Advanced AI Engine.</p>
            </div>

            {(loadingUsers || loadingUsage) ? <Spinner /> : (
              <>
                {/* Platform totals */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCell
                    label="Total Tokens (All Users)"
                    value={formatTokens(metrics.totalTokensUsed)}
                    sub="This billing cycle"
                  />
                  <StatCell
                    label="Est. AI Cost"
                    value={`$${metrics.estimatedCost.toFixed(2)}`}
                    sub="Rough estimate"
                  />
                  <StatCell
                    label="Paid-Tier Tokens"
                    value={formatTokens(metrics.paidTokens)}
                    sub="Advanced AI Engine"
                  />
                  <StatCell
                    label="Free-Tier Tokens"
                    value={formatTokens(metrics.freeTokens)}
                    sub="Standard AI Engine"
                  />
                </div>

                {/* Cost estimate note */}
                <div className="bg-surface-card border border-border-default rounded-lg p-4">
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-text-tertiary mb-2">Cost Estimate Assumptions</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-text-secondary">
                    <span>Advanced AI Engine (Paid): ~$0.075/1M tokens</span>
                    <span>Standard AI Engine (Free): ~$0.005/1M tokens</span>
                    <span>Paid tokens: {formatTokens(metrics.paidTokens)} → ${((metrics.paidTokens / 1_000_000) * GEMINI_COST_PER_M).toFixed(4)}</span>
                    <span>Free tokens: {formatTokens(metrics.freeTokens)} → ${((metrics.freeTokens / 1_000_000) * GROQ_COST_PER_M).toFixed(4)}</span>
                  </div>
                </div>

                {/* Tier share */}
                {metrics.totalTokensUsed > 0 && (
                  <div className="bg-surface-card border border-border-default rounded-lg p-4">
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-text-tertiary mb-3">Token Consumption by Tier</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Free (Standard AI)', tokens: metrics.freeTokens, color: 'bg-slate-400' },
                        { label: 'Paid (Advanced AI)', tokens: metrics.paidTokens, color: 'bg-indigo-500' },
                      ].map(row => {
                        const pct = metrics.totalTokensUsed > 0 ? (row.tokens / metrics.totalTokensUsed) * 100 : 0;
                        return (
                          <div key={row.label} className="flex items-center gap-3">
                            <span className="text-[12px] text-text-secondary w-36 shrink-0">{row.label}</span>
                            <div className="flex-1 h-2 bg-border-default rounded-full overflow-hidden">
                              <div className={cn('h-full rounded-full', row.color)} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[12px] font-mono text-text-primary w-28 text-right">{formatTokens(row.tokens)} ({pct.toFixed(1)}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Top 10 token usage bar chart */}
                {topByUsage.length > 0 && metrics.totalTokensUsed > 0 && (() => {
                  const chartData = topByUsage.slice(0, 8).map(u => ({
                    name: u.email ? u.email.split('@')[0].slice(0, 12) : u.id.slice(0, 8),
                    tokens: u.tokensUsed,
                    fill: (!u.role || u.role === 'free') ? '#94A3B8' : '#4F46E5',
                  }));
                  return (
                    <div className="bg-surface-card border border-border-default rounded-lg p-4">
                      <p className="text-[13px] font-semibold text-text-primary mb-1">Top Accounts by Token Usage</p>
                      <p className="text-[11px] text-text-tertiary mb-4">
                        <span className="inline-flex items-center gap-1 mr-3"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Paid tier</span>
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Free tier</span>
                      </p>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 48, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => formatTokens(v)} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={80} />
                          <Tooltip
                            contentStyle={{ fontSize: 12, border: '1px solid rgba(15,23,42,0.08)', borderRadius: 8, background: '#F8FAFC', boxShadow: 'none' }}
                            formatter={(v: any) => [formatTokens(v), 'Tokens Used']}
                            cursor={{ fill: 'rgba(15,23,42,0.04)' }}
                          />
                          <Bar dataKey="tokens" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}

                {/* Top 10 by usage table */}
                <div className="bg-surface-card border border-border-default rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-default">
                    <p className="text-[13px] font-semibold text-text-primary">Top 10 Accounts by Token Usage</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">Spot free-tier accounts burning disproportionate resources</p>
                  </div>
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-border-default">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">#</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Account</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Plan</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Tokens Used</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Quota %</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Leads</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {topByUsage.map((u, i) => {
                        const pct = u.tokenLimit > 0 ? (u.tokensUsed / u.tokenLimit) * 100 : 0;
                        const isFlag = (!u.role || u.role === 'free') && pct > 70;
                        return (
                          <tr
                            key={u.id}
                            className={cn('hover:bg-surface-secondary cursor-pointer transition-colors', isFlag && 'bg-amber-50/50')}
                            onClick={() => { setSelectedUser(u); setActiveTab('customers'); }}
                          >
                            <td className="px-4 py-2.5 text-text-tertiary font-mono">{i + 1}</td>
                            <td className="px-4 py-2.5">
                              <span className="text-text-primary font-medium truncate block max-w-[160px]">{u.email || u.id.slice(0, 12) + '…'}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <PlanPill role={u.role} />
                                {isFlag && <AlertTriangle className="w-3 h-3 text-amber-500" title="Free account with high usage" />}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 font-mono font-semibold text-text-primary">{formatTokens(u.tokensUsed)}</td>
                            <td className="px-4 py-2.5">
                              <span className={cn('font-mono', pct >= 80 ? 'text-amber-600 font-semibold' : 'text-text-secondary')}>{pct.toFixed(1)}%</span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-text-secondary">{u.leadCount}</td>
                          </tr>
                        );
                      })}
                      {topByUsage.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-text-tertiary text-[12px]">No usage data yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Platform activity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StatCell
                    label="Total Leads Processed"
                    value={metrics.totalLeads}
                    sub="Across all accounts"
                  />
                  <StatCell
                    label="AI Scores Run"
                    value={metrics.totalLeads}
                    sub="Proxy: leads with AI analysis"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB 5: SYSTEM HEALTH ────────────────────────────────────────── */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-[18px] font-semibold text-text-primary">System Health</h1>
              <p className="text-[12px] text-text-secondary mt-0.5">Config toggles and recent system event log.</p>
            </div>

            {/* System config */}
            {loadingConfig ? <Spinner /> : (
              <div className="bg-surface-card border border-border-default rounded-lg divide-y divide-border-default">
                {/* Maintenance mode */}
                <div className="px-4 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-text-primary">Maintenance Mode</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">Locks out non-admin users instantly across all sessions.</p>
                  </div>
                  <button
                    onClick={() => setConfig(c => ({ ...c, maintenanceMode: !c.maintenanceMode }))}
                    className={cn('w-11 h-6 rounded-full relative transition-colors duration-200 shrink-0', config.maintenanceMode ? 'bg-red-500' : 'bg-border-hover')}
                  >
                    <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200', config.maintenanceMode ? 'left-5.5 translate-x-0' : 'left-0.5')} />
                  </button>
                </div>

                {/* Rate limit */}
                <div className="px-4 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-text-primary">Global Scraping Rate Limit</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">Max domains processed per minute platform-wide.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      value={config.rateLimit}
                      onChange={e => setConfig(c => ({ ...c, rateLimit: parseInt(e.target.value) || 0 }))}
                      className="w-20 px-2 py-1.5 text-[13px] font-mono border border-border-default rounded-lg focus:outline-none focus:border-indigo-400 text-center bg-surface-background"
                    />
                    <span className="text-[12px] text-text-secondary whitespace-nowrap">req/min</span>
                  </div>
                </div>

                {/* Stripe webhooks */}
                <div className="px-4 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-text-primary">Stripe Webhooks</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">Toggle processing of incoming payment events.</p>
                  </div>
                  <button
                    onClick={() => setConfig(c => ({ ...c, webhooksEnabled: !c.webhooksEnabled }))}
                    className={cn('w-11 h-6 rounded-full relative transition-colors duration-200 shrink-0', config.webhooksEnabled ? 'bg-indigo-600' : 'bg-border-hover')}
                  >
                    <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200', config.webhooksEnabled ? 'left-5.5 translate-x-0' : 'left-0.5')} />
                  </button>
                </div>

                <div className="px-4 py-3 flex justify-end bg-surface-secondary">
                  <button
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {savingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Config
                  </button>
                </div>
              </div>
            )}

            {/* System logs */}
            <div className="bg-surface-card border border-border-default rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
                <p className="text-[13px] font-semibold text-text-primary">Recent System Events</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-text-secondary">Live</span>
                </div>
              </div>
              {loadingLogs ? <Spinner /> : logs.length === 0 ? (
                <div className="px-4 py-12 text-center text-[12px] text-text-tertiary">No system events recorded yet.</div>
              ) : (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-surface-secondary border-b border-border-default">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider whitespace-nowrap">Time</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Type</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Event</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default font-mono">
                    {logs.map(log => {
                      const ts = log.timestamp?.toDate ? log.timestamp.toDate() : (log.timestamp ? new Date(log.timestamp) : null);
                      return (
                        <tr key={log.id} className="hover:bg-surface-secondary transition-colors">
                          <td className="px-4 py-2.5 text-text-tertiary whitespace-nowrap text-[11px]">
                            {ts ? ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={cn(
                              'inline-flex px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border',
                              log.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              log.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                              log.type === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            )}>
                              {log.type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-text-primary max-w-[280px] truncate">{log.event}</td>
                          <td className="px-4 py-2.5 text-text-tertiary max-w-[160px] truncate text-[11px]">{log.target || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Customer detail panel */}
      {selectedUser && activeTab === 'customers' && <DetailPanel />}
    </div>
  );
}
