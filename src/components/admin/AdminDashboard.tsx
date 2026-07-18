import React, { useState, useEffect } from 'react';
import { LogOut, Shield, Users as UsersIcon, Database, Activity, Settings, List, ChevronRight, Zap, Search, Eye } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import BrandLogo from '../BrandLogo';
import { cn } from '../../lib/utils';
import '../../styles/landing.css';

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
    <div className="landing-page min-h-screen bg-surface-background text-text-primary font-sans flex flex-col md:flex-row">
      
      {/* Sidebar Navigation - Landing Page Minimalist Style */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border-default bg-surface-card flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-border-default">
          <BrandLogo className="w-5 h-5 text-text-primary mr-3" />
          <span className="text-[14px] font-display font-medium tracking-[0.2em] uppercase text-text-primary">ArchRevenue</span>
        </div>
        
        <div className="flex-1 py-8 px-4 space-y-2">
          <div className="mb-6 px-3">
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
                  "w-full flex items-center px-3 py-2.5 rounded-none text-[13px] font-medium transition-all group border-l-2",
                  isActive 
                    ? "border-text-primary text-text-primary bg-surface-hover" 
                    : "border-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                )}
              >
                <Icon className={cn("w-4 h-4 mr-3 transition-colors", isActive ? "text-text-primary" : "text-text-tertiary group-hover:text-text-secondary")} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 border-t border-border-default">
          <div className="flex items-center px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-sm mb-4">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse mr-2" />
             <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold">Systems Online</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-[13px] font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all group"
          >
            <LogOut className="w-4 h-4 mr-3 text-text-tertiary group-hover:text-text-primary" strokeWidth={1.5} />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="p-8 lg:p-16 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-12">
                  <div className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-4 font-medium">
                    Overview
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-display text-text-primary font-medium tracking-tight">Command Center</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <div className="product-chrome-outer p-8">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[11px] uppercase tracking-widest text-text-secondary font-medium">Monthly Recurring</span>
                      <Zap className="w-4 h-4 text-text-tertiary" strokeWidth={1.5} />
                    </div>
                    <p className="text-[40px] font-display text-text-primary leading-none mb-3">$42,500</p>
                    <p className="text-[13px] text-emerald-600 font-medium">+12% vs last month</p>
                  </div>
                  
                  <div className="product-chrome-outer p-8">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[11px] uppercase tracking-widest text-text-secondary font-medium">Active Subscriptions</span>
                      <UsersIcon className="w-4 h-4 text-text-tertiary" strokeWidth={1.5} />
                    </div>
                    <p className="text-[40px] font-display text-text-primary leading-none mb-3">142</p>
                    <p className="text-[13px] text-emerald-600 font-medium">+5 new this week</p>
                  </div>
                  
                  <div className="product-chrome-outer p-8">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[11px] uppercase tracking-widest text-text-secondary font-medium">API Tokens (24h)</span>
                      <Database className="w-4 h-4 text-text-tertiary" strokeWidth={1.5} />
                    </div>
                    <p className="text-[40px] font-display text-text-primary leading-none mb-3">84.2K</p>
                    <p className="text-[13px] text-text-secondary font-medium">Peak load: 12%</p>
                  </div>
                </div>
                
                <div className="product-chrome-outer p-8">
                   <h2 className="text-[13px] uppercase tracking-widest text-text-secondary font-medium mb-8">Recent Signups</h2>
                   <div className="flex items-center justify-center h-48 border border-dashed border-border-default bg-surface-background">
                      <p className="text-text-tertiary text-sm font-mono">Revenue chart visualization rendering...</p>
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
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-4 font-medium">
                      Platform Access
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-display text-text-primary font-medium tracking-tight">User Management</h1>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" strokeWidth={1.5} />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      className="w-full bg-surface-card border border-border-default rounded-none pl-11 pr-4 py-3 text-[13px] text-text-primary focus:outline-none focus:border-text-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="product-chrome-outer overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-default bg-surface-secondary">
                          <th className="px-8 py-5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">User ID</th>
                          <th className="px-8 py-5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Email</th>
                          <th className="px-8 py-5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Role</th>
                          <th className="px-8 py-5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {loadingUsers ? (
                          <tr>
                            <td colSpan={4} className="px-8 py-12 text-center text-text-tertiary text-[13px]">
                              <div className="flex items-center justify-center space-x-3">
                                <div className="w-4 h-4 border-2 border-text-tertiary border-t-text-primary rounded-full animate-spin" />
                                <span>Loading database records...</span>
                              </div>
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                           <tr>
                            <td colSpan={4} className="px-8 py-12 text-center text-text-tertiary text-[13px]">No users found.</td>
                          </tr>
                        ) : (
                          users.map(user => (
                            <tr key={user.id} className="hover:bg-surface-hover transition-colors">
                              <td className="px-8 py-5 text-[13px] font-mono text-text-secondary">
                                {user.id.substring(0, 8)}...
                              </td>
                              <td className="px-8 py-5 text-[14px] text-text-primary font-medium">
                                {user.email || 'No email provided'}
                              </td>
                              <td className="px-8 py-5">
                                <span className={cn(
                                  "px-3 py-1 text-[10px] uppercase tracking-wider font-bold border",
                                  user.role === 'admin' ? "bg-red-50 text-red-700 border-red-200" :
                                  user.role === 'pro' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  "bg-surface-background text-text-secondary border-border-default"
                                )}>
                                  {user.role || 'Free'}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                {user.role !== 'admin' && user.role !== 'pro' && (
                                  <button
                                    onClick={() => handleMakePro(user.id)}
                                    className="btn-luxury inline-flex items-center px-4 py-2 text-[11px] uppercase tracking-widest font-medium text-surface-background bg-text-primary border border-text-primary transition-all"
                                  >
                                    <Zap className="w-3 h-3 mr-2" strokeWidth={2} />
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
                <div className="mb-12">
                  <div className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-4 font-medium">
                    Configuration
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-display text-text-primary font-medium tracking-tight">System Settings</h1>
                </div>
                
                <div className="space-y-6">
                   <div className="product-chrome-outer p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                     <div>
                       <h3 className="text-[16px] font-medium text-text-primary mb-2">Maintenance Mode</h3>
                       <p className="text-[14px] text-text-secondary font-light">Locks out non-admin users and displays a maintenance page.</p>
                     </div>
                     <div className="w-12 h-6 bg-border-default rounded-full relative cursor-not-allowed">
                       <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                     </div>
                   </div>
                   
                   <div className="product-chrome-outer p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                     <div>
                       <h3 className="text-[16px] font-medium text-text-primary mb-2">Global Scraping Rate Limit</h3>
                       <p className="text-[14px] text-text-secondary font-light">Maximum allowed domains processed per minute.</p>
                     </div>
                     <div className="flex items-center space-x-4">
                       <span className="text-[15px] text-text-primary font-medium">120 / min</span>
                       <button className="px-4 py-2 border border-border-default hover:border-text-primary text-[12px] font-medium text-text-primary transition-colors">Edit</button>
                     </div>
                   </div>
                   
                   <div className="product-chrome-outer p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                     <div>
                       <h3 className="text-[16px] font-medium text-text-primary mb-2">Stripe Webhooks</h3>
                       <p className="text-[14px] text-text-secondary font-light">Status of inbound payment event listening.</p>
                     </div>
                     <div className="flex items-center px-3 py-1.5 border border-emerald-200 bg-emerald-50">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                       <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-700">Listening</span>
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
                <div className="mb-12">
                  <div className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-4 font-medium">
                    Ledger
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-display text-text-primary font-medium tracking-tight">Security Logs</h1>
                </div>
                
                <div className="product-chrome-outer p-8">
                  <div className="space-y-2">
                    {[
                      { event: 'Admin Authentication Success', ip: '192.168.1.181', time: 'Just now', type: 'success' },
                      { event: 'User Upgraded to Pro', target: 'uid_2384...', time: '14 mins ago', type: 'info' },
                      { event: 'Failed Authentication Attempt', ip: '45.33.22.11', time: '1 hour ago', type: 'error' },
                      { event: 'Scraper Rate Limit Exceeded', target: 'engine_v2', time: '3 hours ago', type: 'warn' },
                    ].map((log, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-border-default last:border-0">
                        <div className="flex items-start sm:items-center space-x-4 mb-2 sm:mb-0">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5 sm:mt-0 shrink-0",
                            log.type === 'success' ? "bg-emerald-500" :
                            log.type === 'error' ? "bg-red-500" :
                            log.type === 'warn' ? "bg-amber-500" : "bg-blue-500"
                          )} />
                          <div>
                            <p className="text-[14px] font-medium text-text-primary">{log.event}</p>
                            <p className="text-[12px] text-text-secondary font-mono mt-1">
                              {log.ip ? `IP: ${log.ip}` : `Target: ${log.target}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-[12px] text-text-tertiary font-mono ml-6 sm:ml-0">{log.time}</span>
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
