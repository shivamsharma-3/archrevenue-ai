import React, { useState, useEffect } from 'react';
import { LogOut, Shield, Users as UsersIcon, Database, Activity, Settings, List, ChevronRight, Zap, Search, Eye } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import BrandLogo from '../BrandLogo';
import { cn } from '../../lib/utils';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings' | 'logs'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/admin');
  };

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const snap = await getDocs(collection(db, 'users'));
          setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.error('Error fetching users:', e);
          toast.error('Could not load users. Check permissions.');
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [activeTab]);

  const handleMakePro = async (targetUid: string) => {
    const loadingToast = toast.loading('Upgrading user...');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/upgradeUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUid })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to upgrade');
      }

      toast.success('Successfully upgraded to Pro!', { id: loadingToast });
      
      // Update local state to reflect pro status (mocking for UI)
      setUsers(users.map(u => u.id === targetUid ? { ...u, role: 'pro' } : u));
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Upgrade failed.', { id: loadingToast });
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'User Management', icon: UsersIcon },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'logs', label: 'Security Logs', icon: List },
  ] as const;

  return (
    <div className="min-h-screen bg-surface-background text-text-primary font-sans selection:bg-[#6366f1]/30 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border-default bg-[#0a0a0b] flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-border-default">
          <BrandLogo className="w-6 h-6 text-[#7b81ff] mr-3" />
          <span className="text-lg font-medium tracking-wide text-white font-headline">ArchRevenue</span>
          <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-[#6366f1]/20 text-[#7b81ff] border border-[#6366f1]/30">ADMIN</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1">
          <div className="mb-4 px-2">
            <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Platform Controls</p>
          </div>
          
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-[#6366f1]/10 text-white" 
                    : "text-text-secondary hover:bg-white/[0.04] hover:text-text-primary"
                )}
              >
                <Icon className={cn("w-4 h-4 mr-3 transition-colors", isActive ? "text-[#7b81ff]" : "text-text-tertiary group-hover:text-text-secondary")} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-border-default">
          <div className="flex items-center px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
             <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse mr-2" />
             <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-semibold">Systems Online</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-white/[0.04] hover:text-white transition-all group"
          >
            <LogOut className="w-4 h-4 mr-3 text-text-tertiary group-hover:text-white" />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        {/* Abstract Background Elements matching Landing Page */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#7b81ff]/10 to-transparent blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#00d2ff]/5 to-transparent blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10 p-8 lg:p-12 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-10">
                  <h1 className="text-3xl font-medium tracking-tight text-white mb-2 font-headline">Command Center</h1>
                  <p className="text-[15px] text-text-tertiary font-light">Global platform health and revenue metrics.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-black/40 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] uppercase tracking-widest text-text-tertiary font-semibold">Monthly Recurring</span>
                      <div className="w-8 h-8 rounded-full bg-[#7b81ff]/10 flex items-center justify-center border border-[#7b81ff]/20">
                        <Zap className="w-4 h-4 text-[#7b81ff]" />
                      </div>
                    </div>
                    <p className="text-[32px] font-medium text-white font-headline tracking-tight">$42,500</p>
                    <p className="text-[13px] text-emerald-400 mt-2">+12% vs last month</p>
                  </div>
                  
                  <div className="bg-black/40 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] uppercase tracking-widest text-text-tertiary font-semibold">Active Subscriptions</span>
                      <div className="w-8 h-8 rounded-full bg-[#00d2ff]/10 flex items-center justify-center border border-[#00d2ff]/20">
                        <UsersIcon className="w-4 h-4 text-[#00d2ff]" />
                      </div>
                    </div>
                    <p className="text-[32px] font-medium text-white font-headline tracking-tight">142</p>
                    <p className="text-[13px] text-emerald-400 mt-2">+5 new this week</p>
                  </div>
                  
                  <div className="bg-black/40 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] uppercase tracking-widest text-text-tertiary font-semibold">API Tokens (24h)</span>
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Database className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                    <p className="text-[32px] font-medium text-white font-headline tracking-tight">84.2K</p>
                    <p className="text-[13px] text-text-tertiary mt-2">Peak load: 12%</p>
                  </div>
                </div>
                
                <div className="bg-black/40 border border-white/[0.06] rounded-2xl p-8 backdrop-blur-md">
                   <h2 className="text-lg font-medium text-white mb-6 font-headline">Recent Signups</h2>
                   <div className="flex items-center justify-center h-32 border border-dashed border-white/10 rounded-xl">
                      <p className="text-text-tertiary text-sm">Revenue chart visualization rendering...</p>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-medium tracking-tight text-white mb-2 font-headline">User Management</h1>
                    <p className="text-[15px] text-text-tertiary font-light">View and manage platform access.</p>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      className="w-full bg-black/40 border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#7b81ff]"
                    />
                  </div>
                </div>

                <div className="bg-black/40 border border-white/[0.06] rounded-2xl backdrop-blur-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">User ID</th>
                          <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Email</th>
                          <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Role</th>
                          <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {loadingUsers ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-text-tertiary text-sm">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-[#7b81ff]/30 border-t-[#7b81ff] rounded-full animate-spin" />
                                <span>Loading database records...</span>
                              </div>
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                           <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-text-tertiary text-sm">No users found.</td>
                          </tr>
                        ) : (
                          users.map(user => (
                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4 text-sm font-mono text-text-secondary">
                                {user.id.substring(0, 8)}...
                              </td>
                              <td className="px-6 py-4 text-sm text-white font-medium">
                                {user.email || 'No email provided'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold",
                                  user.role === 'admin' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                  user.role === 'pro' ? "bg-[#7b81ff]/10 text-[#7b81ff] border border-[#7b81ff]/20" :
                                  "bg-white/[0.05] text-text-tertiary border border-white/10"
                                )}>
                                  {user.role || 'Free'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {user.role !== 'admin' && user.role !== 'pro' && (
                                  <button
                                    onClick={() => handleMakePro(user.id)}
                                    className="inline-flex items-center px-3 py-1.5 bg-[#6366f1] hover:bg-[#5355e1] text-white text-xs font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                  >
                                    <Zap className="w-3 h-3 mr-1.5" />
                                    Make Pro
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8">
                  <h1 className="text-3xl font-medium tracking-tight text-white mb-2 font-headline">System Settings</h1>
                  <p className="text-[15px] text-text-tertiary font-light">Global platform configuration.</p>
                </div>
                
                <div className="space-y-6">
                   <div className="bg-black/40 border border-white/[0.06] rounded-2xl p-6 flex items-center justify-between backdrop-blur-md">
                     <div>
                       <h3 className="text-base font-medium text-white mb-1">Maintenance Mode</h3>
                       <p className="text-sm text-text-tertiary">Locks out non-admin users and displays a maintenance page.</p>
                     </div>
                     <div className="w-12 h-6 bg-white/[0.06] rounded-full relative cursor-not-allowed opacity-50">
                       <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-text-tertiary" />
                     </div>
                   </div>
                   
                   <div className="bg-black/40 border border-white/[0.06] rounded-2xl p-6 flex items-center justify-between backdrop-blur-md">
                     <div>
                       <h3 className="text-base font-medium text-white mb-1">Global Scraping Rate Limit</h3>
                       <p className="text-sm text-text-tertiary">Maximum allowed domains processed per minute.</p>
                     </div>
                     <div className="flex items-center space-x-3">
                       <span className="text-sm text-white font-medium">120 / min</span>
                       <button className="px-3 py-1.5 bg-white/[0.06] rounded-lg text-xs font-medium text-text-secondary hover:text-white transition-colors">Edit</button>
                     </div>
                   </div>
                   
                   <div className="bg-black/40 border border-white/[0.06] rounded-2xl p-6 flex items-center justify-between backdrop-blur-md">
                     <div>
                       <h3 className="text-base font-medium text-white mb-1">Stripe Webhooks</h3>
                       <p className="text-sm text-text-tertiary">Status of inbound payment event listening.</p>
                     </div>
                     <div className="flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                       <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Listening</span>
                     </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8">
                  <h1 className="text-3xl font-medium tracking-tight text-white mb-2 font-headline">Security Logs</h1>
                  <p className="text-[15px] text-text-tertiary font-light">Immutable system event ledger.</p>
                </div>
                
                <div className="bg-black/40 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-md">
                  <div className="space-y-4">
                    {[
                      { event: 'Admin Authentication Success', ip: '192.168.1.181', time: 'Just now', type: 'success' },
                      { event: 'User Upgraded to Pro', target: 'uid_2384...', time: '14 mins ago', type: 'info' },
                      { event: 'Failed Authentication Attempt', ip: '45.33.22.11', time: '1 hour ago', type: 'error' },
                      { event: 'Scraper Rate Limit Exceeded', target: 'engine_v2', time: '3 hours ago', type: 'warn' },
                    ].map((log, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/[0.06] last:border-0">
                        <div className="flex items-start sm:items-center space-x-4 mb-2 sm:mb-0">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5 sm:mt-0 shrink-0",
                            log.type === 'success' ? "bg-emerald-500" :
                            log.type === 'error' ? "bg-rose-500" :
                            log.type === 'warn' ? "bg-amber-500" : "bg-[#7b81ff]"
                          )} />
                          <div>
                            <p className="text-sm font-medium text-white">{log.event}</p>
                            <p className="text-xs text-text-tertiary font-mono mt-0.5">
                              {log.ip ? `IP: ${log.ip}` : `Target: ${log.target}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-text-tertiary font-mono ml-6 sm:ml-0">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
