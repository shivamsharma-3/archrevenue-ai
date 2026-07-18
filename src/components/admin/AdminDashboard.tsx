import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, Shield, Users as UsersIcon, Database, Activity, Settings, List, Zap, Search, Eye, RefreshCw, Check, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import BrandLogo from '../BrandLogo';
import { cn } from '../../lib/utils';
import { logSystemEvent, SystemLog } from '../../lib/admin';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings' | 'logs'>('overview');
  
  // Real Data State
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [config, setConfig] = useState({
    maintenanceMode: false,
    rateLimit: 120,
    webhooksEnabled: true
  });
  
  // Loading States
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  const handleLogout = async () => {
    await logSystemEvent('Admin Logged Out', 'info');
    await auth.signOut();
    navigate('/admin');
  };

  // Fetch Users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const snap = await getDocs(collection(db, 'users'));
        // sort by createdAt descending roughly by reading data if timestamp exists, or just relying on doc id for now
        const fetchedUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(fetchedUsers);
      } catch (e) {
        console.error('Error fetching users:', e);
        toast.error('Could not load users. Check permissions.');
      } finally {
        setLoadingUsers(false);
      }
    };
    if (users.length === 0) fetchUsers();
  }, []);

  // Fetch Config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'config', 'system');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as typeof config);
        } else {
          await setDoc(docRef, config);
        }
      } catch (e) {
        console.error('Error fetching config', e);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // Live Logs Listener
  useEffect(() => {
    if (activeTab !== 'logs') return;
    setLoadingLogs(true);
    const q = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemLog));
      setLogs(fetchedLogs);
      setLoadingLogs(false);
    });
    return () => unsubscribe();
  }, [activeTab]);

  const [searchQuery, setSearchQuery] = useState('');

  // Derived Metrics and Filtered Users
  const { mrr, activeSubs, recentSignups, filteredUsers } = useMemo(() => {
    let proCount = 0;
    let starterCount = 0;
    users.forEach(u => {
      if (u.role === 'pro') proCount++;
      if (u.role === 'starter') starterCount++;
    });
    
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = users.filter(u => 
      u.id.toLowerCase().includes(lowerQuery) || 
      (u.email && u.email.toLowerCase().includes(lowerQuery))
    );

    return {
      mrr: (proCount * 149) + (starterCount * 49),
      activeSubs: proCount + starterCount,
      recentSignups: [...users].slice(-5), // In a real app we'd sort by createdAt
      filteredUsers: filtered
    };
  }, [users, searchQuery]);

  const handleChangeRole = async (targetUid: string, role: string) => {
    const loadingToast = toast.loading(`Upgrading user to ${role}...`);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/upgradeUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUid, role })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to upgrade');
      }

      toast.success(`Successfully upgraded to ${role}!`, { id: loadingToast });
      setUsers(users.map(u => u.id === targetUid ? { ...u, role } : u));
      
      await logSystemEvent(`User Upgraded to ${role}`, 'success', targetUid);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Upgrade failed.', { id: loadingToast });
      await logSystemEvent('Upgrade Failed', 'error', targetUid);
    }
  };

  const handleDeleteAllNonAdmins = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete all non-admin users? This cannot be undone.")) return;
    
    const loadingToast = toast.loading('Deleting non-admin users...');
    try {
      let deletedCount = 0;
      for (const user of users) {
        if (user.role !== 'admin') {
          await deleteDoc(doc(db, 'users', user.id));
          deletedCount++;
        }
      }
      
      toast.success(`Successfully deleted ${deletedCount} non-admin users!`, { id: loadingToast });
      setUsers(users.filter(u => u.role === 'admin'));
      
      await logSystemEvent(`Deleted ${deletedCount} non-admin users`, 'warn', 'system');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Deletion failed.', { id: loadingToast });
      await logSystemEvent('Batch Deletion Failed', 'error', 'system');
    }
  };

  const handleDeleteUser = async (targetUid: string, email: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${email || targetUid}?`)) return;
    
    const loadingToast = toast.loading('Deleting user...');
    try {
      await deleteDoc(doc(db, 'users', targetUid));
      toast.success('Successfully deleted user!', { id: loadingToast });
      setUsers(users.filter(u => u.id !== targetUid));
      await logSystemEvent(`Deleted user ${targetUid}`, 'warn', 'system');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Deletion failed.', { id: loadingToast });
      await logSystemEvent(`Failed to delete user ${targetUid}`, 'error', 'system');
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await updateDoc(doc(db, 'config', 'system'), config);
      toast.success('Configuration saved');
      await logSystemEvent('System Configuration Updated', 'warn');
    } catch (e) {
      toast.error('Failed to save config');
    } finally {
      setSavingConfig(false);
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'Just now';
    if (ts.toDate) return ts.toDate().toLocaleString();
    return new Date(ts).toLocaleString();
  };

  const navItems = [
    { id: 'overview', label: 'Command Center', icon: Activity },
    { id: 'users', label: 'User Directory', icon: UsersIcon },
    { id: 'settings', label: 'System Preferences', icon: Settings },
    { id: 'logs', label: 'Security Ledger', icon: List },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar Navigation - Back-office Lite Theme */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 bg-white flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <BrandLogo className="w-5 h-5 text-gray-900 mr-3" />
          <span className="text-[14px] font-bold tracking-tight text-gray-900">ArchAdmin</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1">
          <div className="mb-4 px-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Controls</p>
          </div>
          
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group",
                  isActive 
                    ? "bg-gray-100 text-gray-900 shadow-sm" 
                    : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn("w-4 h-4 mr-3 transition-colors", isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600")} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center px-3 py-2 bg-emerald-50 rounded-lg mb-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
             <span className="text-[11px] font-bold text-emerald-700">All Systems Nominal</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all group"
          >
            <LogOut className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600" strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="p-6 lg:p-12 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-10 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Command Center</h1>
                    <p className="text-[14px] text-gray-500 mt-1">Live overview of platform health and revenue.</p>
                  </div>
                  <button onClick={() => window.location.reload()} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Monthly Recurring</span>
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-blue-600" strokeWidth={2} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">${mrr.toLocaleString()}</p>
                    <p className="text-[13px] text-emerald-600 font-medium">Derived from {activeSubs} Pro accounts</p>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Active Subscriptions</span>
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                        <UsersIcon className="w-4 h-4 text-indigo-600" strokeWidth={2} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{activeSubs}</p>
                    <p className="text-[13px] text-emerald-600 font-medium">Real-time aggregate</p>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">API Tokens (Estimated)</span>
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                        <Database className="w-4 h-4 text-purple-600" strokeWidth={2} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{activeSubs * 1000} / 50K</p>
                    <p className="text-[13px] text-gray-500 font-medium">System limit projection</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                   <div className="p-6 border-b border-gray-100">
                     <h2 className="text-[14px] font-bold text-gray-900">Recent Signups</h2>
                   </div>
                   <div className="divide-y divide-gray-100">
                      {loadingUsers ? (
                         <div className="p-8 text-center text-gray-500 text-sm">Loading users...</div>
                      ) : recentSignups.length === 0 ? (
                         <div className="p-8 text-center text-gray-500 text-sm">No users found.</div>
                      ) : (
                         recentSignups.map((u, i) => (
                           <div key={i} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                             <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium uppercase">
                                  {u.email ? u.email.substring(0, 2) : 'U'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{u.email || 'Unknown User'}</p>
                                  <p className="text-xs text-gray-500 font-mono mt-0.5">{u.id}</p>
                                </div>
                             </div>
                             <span className={cn(
                               "px-2.5 py-1 text-[11px] font-bold rounded-full",
                               u.role === 'admin' ? "bg-red-100 text-red-700" :
                               u.role === 'pro' ? "bg-blue-100 text-blue-700" :
                               "bg-gray-100 text-gray-600"
                             )}>
                               {u.role || 'Free'}
                             </span>
                           </div>
                         ))
                      )}
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
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Directory</h1>
                    <p className="text-[14px] text-gray-500 mt-1">Manage platform access and billing tiers.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full md:w-auto">
                    <button
                      onClick={handleDeleteAllNonAdmins}
                      className="inline-flex items-center px-4 py-2 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors whitespace-nowrap"
                    >
                      Delete All Non-Admins
                    </button>
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users by ID or email..." 
                        className="w-full bg-white border border-gray-300 rounded-xl pl-11 pr-4 py-2.5 text-[14px] text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-4 text-[12px] font-bold text-gray-500 uppercase tracking-wider">User ID</th>
                          <th className="px-6 py-4 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Email Address</th>
                          <th className="px-6 py-4 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                          <th className="px-6 py-4 text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right">Administrative Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loadingUsers ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-[14px]">
                              <div className="flex items-center justify-center space-x-3">
                                <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                                <span>Querying Firestore Database...</span>
                              </div>
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                           <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-[14px]">No users found matching "{searchQuery}".</td>
                          </tr>
                        ) : (
                          filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                              <td className="px-6 py-4 text-[13px] font-mono text-gray-500">
                                {user.id.substring(0, 8)}...
                              </td>
                              <td className="px-6 py-4 text-[14px] text-gray-900 font-medium">
                                {user.email || 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2.5 py-1 text-[11px] font-bold rounded-full",
                                  user.role === 'admin' ? "bg-red-100 text-red-700" :
                                  user.role === 'pro' ? "bg-blue-100 text-blue-700" :
                                  user.role === 'starter' ? "bg-purple-100 text-purple-700" :
                                  "bg-gray-100 text-gray-600"
                                )}>
                                  {user.role || 'Free'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {user.role !== 'admin' && (
                                  <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                    {user.role !== 'starter' && (
                                      <button
                                        onClick={() => handleChangeRole(user.id, 'starter')}
                                        className="inline-flex items-center px-3 py-1.5 text-[11px] font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
                                      >
                                        Make Starter
                                      </button>
                                    )}
                                    {user.role !== 'pro' && (
                                      <button
                                        onClick={() => handleChangeRole(user.id, 'pro')}
                                        className="inline-flex items-center px-3 py-1.5 text-[11px] font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-sm transition-colors"
                                      >
                                        <Zap className="w-3 h-3 mr-1.5" />
                                        Make Pro
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteUser(user.id, user.email)}
                                      className="inline-flex items-center justify-center w-8 h-8 text-red-500 bg-white border border-gray-300 hover:bg-red-50 hover:border-red-200 hover:text-red-600 rounded-lg shadow-sm transition-colors ml-1"
                                      title="Permanently Delete User"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
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
                <div className="mb-10">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Preferences</h1>
                  <p className="text-[14px] text-gray-500 mt-1">Global platform configuration and limits.</p>
                </div>
                
                {loadingConfig ? (
                  <div className="p-12 text-center text-gray-500"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-4"/>Loading configuration...</div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
                     <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50 transition-colors">
                       <div>
                         <h3 className="text-[16px] font-bold text-gray-900 mb-1">Maintenance Mode</h3>
                         <p className="text-[14px] text-gray-500">Locks out non-admin users and displays a maintenance page. Used during deployments.</p>
                       </div>
                       <button 
                          onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                          className={cn("w-14 h-7 rounded-full relative transition-colors duration-200 shrink-0", config.maintenanceMode ? "bg-red-500" : "bg-gray-200")}
                       >
                         <div className={cn("absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200", config.maintenanceMode ? "left-8" : "left-1")} />
                       </button>
                     </div>
                     
                     <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50 transition-colors">
                       <div>
                         <h3 className="text-[16px] font-bold text-gray-900 mb-1">Global Scraping Rate Limit</h3>
                         <p className="text-[14px] text-gray-500">Maximum allowed domains processed per minute across the entire platform.</p>
                       </div>
                       <div className="flex items-center space-x-3">
                         <input 
                            type="number" 
                            value={config.rateLimit}
                            onChange={(e) => setConfig({...config, rateLimit: parseInt(e.target.value) || 0})}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                         />
                         <span className="text-sm font-bold text-gray-500">/ min</span>
                       </div>
                     </div>
                     
                     <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50 transition-colors">
                       <div>
                         <h3 className="text-[16px] font-bold text-gray-900 mb-1">Stripe Webhooks</h3>
                         <p className="text-[14px] text-gray-500">Status of inbound payment event listening.</p>
                       </div>
                       <button 
                          onClick={() => setConfig({...config, webhooksEnabled: !config.webhooksEnabled})}
                          className={cn("w-14 h-7 rounded-full relative transition-colors duration-200 shrink-0", config.webhooksEnabled ? "bg-emerald-500" : "bg-gray-200")}
                       >
                         <div className={cn("absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200", config.webhooksEnabled ? "left-8" : "left-1")} />
                       </button>
                     </div>

                     <div className="p-6 md:p-8 bg-gray-50 flex justify-end">
                       <button 
                         onClick={handleSaveConfig}
                         disabled={savingConfig}
                         className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                       >
                         {savingConfig ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                         Save Configuration
                       </button>
                     </div>
                  </div>
                )}
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
                <div className="mb-10 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Security Ledger</h1>
                    <p className="text-[14px] text-gray-500 mt-1">Immutable record of system events.</p>
                  </div>
                  <div className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold flex items-center">
                    <Clock className="w-4 h-4 mr-2" /> Live stream active
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {loadingLogs ? (
                       <div className="p-12 text-center text-gray-500"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-4"/>Awaiting log stream...</div>
                    ) : logs.length === 0 ? (
                       <div className="p-12 text-center text-gray-500">No events recorded.</div>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
                          <div className="flex items-start space-x-4">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                              log.type === 'success' ? "bg-emerald-100" :
                              log.type === 'error' ? "bg-red-100" :
                              log.type === 'warn' ? "bg-amber-100" : "bg-blue-100"
                            )}>
                               {log.type === 'success' ? <Check className="w-5 h-5 text-emerald-600" /> :
                                log.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
                                log.type === 'warn' ? <AlertTriangle className="w-5 h-5 text-amber-600" /> :
                                <Activity className="w-5 h-5 text-blue-600" />}
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-gray-900">{log.event}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-1">
                                {log.target && <span className="text-[12px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">Target: {log.target}</span>}
                                {log.ip && <span className="text-[12px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">IP: {log.ip}</span>}
                              </div>
                            </div>
                          </div>
                          <span className="text-[12px] font-medium text-gray-400 whitespace-nowrap pl-14 md:pl-0">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      ))
                    )}
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
