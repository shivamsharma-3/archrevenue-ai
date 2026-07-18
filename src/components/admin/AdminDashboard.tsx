import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, Shield, Users as UsersIcon, Database, Activity, Settings, List, Zap, Search, Eye, RefreshCw, Check, Clock, AlertTriangle, Trash2, ChevronRight, MoreVertical } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy, limit, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import BrandLogo from '../BrandLogo';
import { cn } from '../../lib/utils';
import { logSystemEvent, SystemLog } from '../../lib/admin';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  },
  exit: { opacity: 0, transition: { duration: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

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
    const q = query(collection(db, 'system_logs'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemLog));
      
      // Sort client-side
      fetchedLogs.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp || 0);
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp || 0);
        return timeB - timeA;
      });
      
      setLogs(fetchedLogs);
      setLoadingLogs(false);
    }, (error) => {
      console.error("Error fetching logs:", error);
      toast.error("Failed to load logs. Missing index or permissions.");
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
      recentSignups: [...users].slice(-5),
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col md:flex-row selection:bg-blue-100 selection:text-blue-900">
      
      {/* Sidebar Navigation - Ultra Premium Glass Theme */}
      <aside className="w-full md:w-[280px] border-b md:border-b-0 md:border-r border-slate-200/60 bg-white/60 backdrop-blur-2xl flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
        <div className="h-20 flex items-center px-8 border-b border-slate-200/50">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center mr-3 shadow-sm shadow-slate-900/20">
            <BrandLogo className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-slate-900">ArchAdmin</span>
        </div>
        
        <div className="flex-1 py-8 px-4 space-y-1">
          <div className="mb-6 px-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Platform Controls</p>
          </div>
          
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "text-blue-700 bg-blue-50/80 shadow-sm shadow-blue-500/5" 
                    : "bg-transparent text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator" 
                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" 
                  />
                )}
                <Icon className={cn("w-[18px] h-[18px] mr-3 transition-colors shrink-0", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} strokeWidth={isActive ? 2.5 : 2} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200/50">
          <div className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3 group hover:border-slate-300 transition-colors cursor-default">
             <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center mr-3 shrink-0">
               <Shield className="w-4 h-4 text-emerald-600" />
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-[13px] font-bold text-slate-900 truncate">Super Admin</p>
               <div className="flex items-center mt-0.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5 shrink-0" />
                 <span className="text-[11px] font-semibold text-slate-500 truncate">Systems Nominal</span>
               </div>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all group"
          >
            <LogOut className="w-4 h-4 mr-2 text-slate-400 group-hover:text-slate-600" strokeWidth={2} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden scroll-smooth">
        <div className="p-6 md:p-10 lg:p-14 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <motion.div variants={itemVariants} className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Command Center</h1>
                    <p className="text-[15px] text-slate-500 font-medium">Real-time telemetry and revenue intelligence.</p>
                  </div>
                  <button onClick={() => window.location.reload()} className="inline-flex items-center px-4 py-2.5 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-semibold shadow-sm border border-slate-200 transition-all active:scale-95 whitespace-nowrap">
                    <RefreshCw className="w-4 h-4 mr-2 shrink-0" strokeWidth={2.5} />
                    Refresh Metrics
                  </button>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <motion.div variants={itemVariants} className="bg-white rounded-3xl p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Monthly Recurring</span>
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="relative z-10">
                      <p className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">${mrr.toLocaleString()}</p>
                      <div className="flex items-center text-[14px] font-medium text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shrink-0" />
                        Healthy & Growing
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="bg-white rounded-3xl p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Active Users</span>
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <UsersIcon className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="relative z-10">
                      <p className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">{activeSubs}</p>
                      <p className="text-[14px] font-medium text-slate-500">Subscribed accounts</p>
                    </div>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="bg-white rounded-3xl p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">API Load</span>
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                        <Database className="w-5 h-5 text-purple-600" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="relative z-10">
                      <p className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">{activeSubs > 0 ? (activeSubs * 1.2).toFixed(1) : 0}M <span className="text-xl text-slate-400">/ 50M</span></p>
                      <p className="text-[14px] font-medium text-slate-500">Monthly token projection</p>
                    </div>
                  </motion.div>
                </div>
                
                <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                   <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                     <h2 className="text-[16px] font-extrabold text-slate-900">Recent Activations</h2>
                     <button onClick={() => setActiveTab('users')} className="text-[13px] font-bold text-blue-600 hover:text-blue-700 flex items-center transition-colors">
                       View All <ChevronRight className="w-4 h-4 ml-1 shrink-0" />
                     </button>
                   </div>
                   <div className="divide-y divide-slate-50">
                      {loadingUsers ? (
                         <div className="p-12 text-center">
                           <RefreshCw className="w-6 h-6 animate-spin text-slate-300 mx-auto mb-3"/>
                           <p className="text-slate-500 font-medium">Loading user telemetry...</p>
                         </div>
                      ) : recentSignups.length === 0 ? (
                         <div className="p-12 text-center text-slate-500 font-medium">No users found.</div>
                      ) : (
                         recentSignups.map((u, i) => (
                           <div key={i} className="p-5 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                             <div className="flex items-center space-x-4 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase shadow-inner shrink-0">
                                  {u.email ? u.email.substring(0, 2) : 'U'}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[14px] font-bold text-slate-900 truncate">{u.email || 'Unknown Entity'}</p>
                                  <p className="text-[12px] text-slate-400 font-mono mt-0.5 truncate">{u.id}</p>
                                </div>
                             </div>
                             <span className={cn(
                               "px-3 py-1.5 text-[12px] font-bold rounded-lg border whitespace-nowrap ml-4",
                               u.role === 'admin' ? "bg-red-50 text-red-700 border-red-100" :
                               u.role === 'pro' ? "bg-blue-50 text-blue-700 border-blue-100" :
                               u.role === 'starter' ? "bg-purple-50 text-purple-700 border-purple-100" :
                               "bg-slate-50 text-slate-600 border-slate-200"
                             )}>
                               {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Free'}
                             </span>
                           </div>
                         ))
                      )}
                   </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <motion.div variants={itemVariants} className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                  <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">User Directory</h1>
                    <p className="text-[15px] text-slate-500 font-medium">Manage platform access, roles, and billing tiers.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
                    <button
                      onClick={handleDeleteAllNonAdmins}
                      className="inline-flex items-center justify-center px-5 py-3 sm:py-2.5 text-[14px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-colors whitespace-nowrap active:scale-95"
                    >
                      <Trash2 className="w-4 h-4 mr-2 shrink-0" />
                      Wipe Non-Admins
                    </button>
                    <div className="relative w-full sm:w-[320px]">
                      <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search UUID or email..." 
                        className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 sm:py-2.5 text-[14px] font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Identifier</th>
                          <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Identity</th>
                          <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Access Level</th>
                          <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {loadingUsers ? (
                          <tr>
                            <td colSpan={4} className="px-8 py-16 text-center text-slate-500">
                              <RefreshCw className="w-8 h-8 animate-spin text-slate-300 mx-auto mb-4" />
                              <span className="font-medium">Querying Registry...</span>
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                           <tr>
                            <td colSpan={4} className="px-8 py-16 text-center text-slate-500 font-medium">No matching identities found.</td>
                          </tr>
                        ) : (
                          filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-8 py-5 text-[13px] font-mono text-slate-500 w-[180px]">
                                {user.id.substring(0, 12)}...
                              </td>
                              <td className="px-8 py-5 text-[14px] text-slate-900 font-bold max-w-[200px] truncate">
                                {user.email || 'N/A'}
                              </td>
                              <td className="px-8 py-5">
                                <span className={cn(
                                  "inline-flex items-center px-3 py-1.5 text-[12px] font-bold rounded-lg border whitespace-nowrap",
                                  user.role === 'admin' ? "bg-red-50 text-red-700 border-red-100" :
                                  user.role === 'pro' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                  user.role === 'starter' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                  "bg-slate-50 text-slate-600 border-slate-200"
                                )}>
                                  {user.role === 'pro' && <Zap className="w-3.5 h-3.5 mr-1.5 shrink-0" strokeWidth={3} />}
                                  {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Free'}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                {user.role !== 'admin' && (
                                  <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                    {user.role !== 'starter' && (
                                      <button
                                        onClick={() => handleChangeRole(user.id, 'starter')}
                                        className="inline-flex items-center px-4 py-2 text-[12px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl shadow-sm transition-all whitespace-nowrap active:scale-95"
                                      >
                                        Starter
                                      </button>
                                    )}
                                    {user.role !== 'pro' && (
                                      <button
                                        onClick={() => handleChangeRole(user.id, 'pro')}
                                        className="inline-flex items-center px-4 py-2 text-[12px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all whitespace-nowrap active:scale-95"
                                      >
                                        <Zap className="w-3.5 h-3.5 mr-1.5 shrink-0" strokeWidth={2.5} />
                                        Pro
                                      </button>
                                    )}
                                    <div className="w-px h-6 bg-slate-200 mx-1" />
                                    <button
                                      onClick={() => handleDeleteUser(user.id, user.email)}
                                      className="inline-flex items-center justify-center w-9 h-9 text-red-500 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 rounded-xl shadow-sm transition-all shrink-0 active:scale-95"
                                      title="Permanently Delete User"
                                    >
                                      <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2} />
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
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <motion.div variants={itemVariants} className="mb-10">
                  <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">System Preferences</h1>
                  <p className="text-[15px] text-slate-500 font-medium">Global platform configuration and limits.</p>
                </motion.div>
                
                {loadingConfig ? (
                  <div className="p-16 text-center text-slate-500"><RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-300"/>Loading config...</div>
                ) : (
                  <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden divide-y divide-slate-50">
                     <div className="p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                       <div className="flex-1 min-w-0">
                         <h3 className="text-[18px] font-extrabold text-slate-900 mb-2">Maintenance Mode</h3>
                         <p className="text-[14px] text-slate-500 font-medium">Locks out non-admin users and displays a maintenance page. Instantly effective across all active sessions.</p>
                       </div>
                       <button 
                          onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                          className={cn("w-14 h-8 rounded-full relative transition-colors duration-300 shrink-0 shadow-inner", config.maintenanceMode ? "bg-red-500" : "bg-slate-200")}
                       >
                         <div className={cn("absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300", config.maintenanceMode ? "left-7" : "left-1")} />
                       </button>
                     </div>
                     
                     <div className="p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                       <div className="flex-1 min-w-0">
                         <h3 className="text-[18px] font-extrabold text-slate-900 mb-2">Global Scraping Rate Limit</h3>
                         <p className="text-[14px] text-slate-500 font-medium">Maximum allowed domains processed per minute across the entire platform. Adjust this to prevent IP bans.</p>
                       </div>
                       <div className="flex items-center space-x-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 shrink-0">
                         <input 
                            type="number" 
                            value={config.rateLimit}
                            onChange={(e) => setConfig({...config, rateLimit: parseInt(e.target.value) || 0})}
                            className="w-24 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[15px] font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none text-center shadow-sm"
                         />
                         <span className="text-[14px] font-bold text-slate-400 pr-4 whitespace-nowrap">req / min</span>
                       </div>
                     </div>
                     
                     <div className="p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                       <div className="flex-1 min-w-0">
                         <h3 className="text-[18px] font-extrabold text-slate-900 mb-2">Stripe Webhooks</h3>
                         <p className="text-[14px] text-slate-500 font-medium">Toggle processing of incoming payment events. Disabling this will prevent new users from being automatically upgraded.</p>
                       </div>
                       <button 
                          onClick={() => setConfig({...config, webhooksEnabled: !config.webhooksEnabled})}
                          className={cn("w-14 h-8 rounded-full relative transition-colors duration-300 shrink-0 shadow-inner", config.webhooksEnabled ? "bg-emerald-500" : "bg-slate-200")}
                       >
                         <div className={cn("absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300", config.webhooksEnabled ? "left-7" : "left-1")} />
                       </button>
                     </div>

                     <div className="p-8 bg-slate-50/50 flex justify-end border-t border-slate-100">
                       <button 
                         onClick={handleSaveConfig}
                         disabled={savingConfig}
                         className="flex items-center px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] active:scale-95 disabled:opacity-50 disabled:hover:shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] whitespace-nowrap"
                       >
                         {savingConfig ? <RefreshCw className="w-5 h-5 mr-2.5 animate-spin shrink-0" /> : <Check className="w-5 h-5 mr-2.5 shrink-0" strokeWidth={3} />}
                         Deploy Configuration
                       </button>
                     </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div
                key="logs"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <motion.div variants={itemVariants} className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Security Ledger</h1>
                    <p className="text-[15px] text-slate-500 font-medium">Immutable, real-time log of systemic state changes.</p>
                  </div>
                  <div className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-[13px] font-bold flex items-center border border-emerald-100/50 shadow-sm self-start sm:self-auto whitespace-nowrap">
                    <span className="relative flex h-3 w-3 mr-3 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    Live Stream Connected
                  </div>
                </motion.div>
                
                <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {loadingLogs ? (
                       <div className="p-16 text-center text-slate-500"><RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-300"/>Establishing secure stream...</div>
                    ) : logs.length === 0 ? (
                       <div className="p-16 text-center text-slate-500 font-medium">No system events recorded.</div>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/80 transition-colors gap-4 group">
                          <div className="flex items-start md:items-center space-x-5 min-w-0">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                              log.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                              log.type === 'error' ? "bg-red-50 text-red-600 border border-red-100" :
                              log.type === 'warn' ? "bg-amber-50 text-amber-600 border border-amber-100" : 
                              "bg-blue-50 text-blue-600 border border-blue-100"
                            )}>
                               {log.type === 'success' ? <Check className="w-5 h-5" strokeWidth={2.5} /> :
                                log.type === 'error' ? <AlertTriangle className="w-5 h-5" strokeWidth={2.5} /> :
                                log.type === 'warn' ? <AlertTriangle className="w-5 h-5" strokeWidth={2.5} /> :
                                <Activity className="w-5 h-5" strokeWidth={2.5} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{log.event}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {log.target && <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono border border-slate-200/50 shadow-sm shadow-slate-200/20 truncate max-w-[200px] md:max-w-xs">TARGET: {log.target}</span>}
                                {log.ip && <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono border border-slate-200/50 shadow-sm shadow-slate-200/20">IP: {log.ip}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center text-[13px] font-semibold text-slate-400 whitespace-nowrap pl-17 md:pl-0 shrink-0">
                            <Clock className="w-3.5 h-3.5 mr-1.5 opacity-50 shrink-0" />
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
