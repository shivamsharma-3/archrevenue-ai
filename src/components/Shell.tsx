import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Target, Users, Settings, HelpCircle, Bell, LogOut, X, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';
import BrandLogo from './BrandLogo';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuroraBackground from './AuroraBackground';
import { useTokenUsage } from '../hooks/useTokenUsage';

interface ShellProps {
  children: React.ReactNode;
  activeMenu?: 'dashboard' | 'pipeline' | 'directory' | 'settings' | 'billing' | 'privacy' | 'terms' | 'security';
  onMenuChange?: (menu: 'dashboard' | 'pipeline' | 'directory' | 'settings' | 'billing') => void;
  hideSidebar?: boolean;
}

export default function Shell({ children, hideSidebar = false, onMenuChange }: ShellProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const activeMenu = location.pathname === '/pipeline' ? 'pipeline' : location.pathname === '/leads' ? 'directory' : location.pathname === '/settings' ? 'settings' : location.pathname === '/billing' ? 'billing' : 'dashboard';
  const { tokensUsed, limit, isLoading } = useTokenUsage();

  const usagePercent = limit > 0 ? Math.min((tokensUsed / limit) * 100, 100) : 0;
  const isNearingLimit = usagePercent > 85;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const handleLogout = () => {
    auth.signOut();
  };

  const handleNavigation = (menu: 'dashboard' | 'pipeline' | 'directory' | 'settings' | 'billing') => {
    if (onMenuChange) {
      onMenuChange(menu);
    }
    
    if (menu === 'dashboard') {
      navigate('/dashboard');
    } else if (menu === 'pipeline') {
      navigate('/pipeline');
    } else if (menu === 'directory') {
      navigate('/leads');
    } else {
      navigate(`/${menu}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-300 font-sans flex selection:bg-white/20 relative">
      {/* Aurora Revenue Intelligence Background */}
      <AuroraBackground />

      {/* Premium Floating Sidebar */}
      {!hideSidebar && (
        <div className="hidden md:flex flex-col w-[280px] p-4 h-screen sticky top-0 z-30 flex-shrink-0">
        <aside className="flex-1 w-full rounded-[24px] border border-white/[0.08] bg-[#0a0a0b]/60 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col overflow-y-auto relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
          
          <div className="h-24 flex items-center px-6 relative z-10 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/10">
              <BrandLogo className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-white font-semibold tracking-wide font-display text-lg">ArchRevenue</span>
          </div>
          <div className="px-4 flex-1 relative z-10">
            <p className="text-[10px] font-bold text-zinc-500 tracking-widest px-3 mb-3 mt-2">MENU</p>
            <div className="space-y-1">
              <button 
                onClick={() => handleNavigation('dashboard')}
                className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-300 group overflow-hidden", activeMenu === 'dashboard' ? "text-white bg-white/[0.08] shadow-sm border border-white/[0.05]" : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent")}
              >
                <LayoutDashboard className={cn("w-4 h-4 mr-3 transition-colors", activeMenu === 'dashboard' ? "text-indigo-400" : "group-hover:text-zinc-300")} />
                Dashboard
              </button>
              <button 
                onClick={() => handleNavigation('pipeline')}
                className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-300 group overflow-hidden", activeMenu === 'pipeline' ? "text-white bg-white/[0.08] shadow-sm border border-white/[0.05]" : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent")}
              >
                <Target className={cn("w-4 h-4 mr-3 transition-colors", activeMenu === 'pipeline' ? "text-purple-400" : "group-hover:text-zinc-300")} />
                Pipeline
              </button>
              <button 
                onClick={() => handleNavigation('directory')}
                className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-300 group overflow-hidden", activeMenu === 'directory' ? "text-white bg-white/[0.08] shadow-sm border border-white/[0.05]" : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent")}
              >
                <Users className={cn("w-4 h-4 mr-3 transition-colors", activeMenu === 'directory' ? "text-blue-400" : "group-hover:text-zinc-300")} />
                Leads
              </button>
            </div>

            {/* ── System Status Widget ────────────────────── */}
            <div className="mt-6 mx-1 px-3 py-3 rounded-xl bg-black/40 border border-white/[0.05]">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2.5">System Status</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot-live" />
                    <span className="text-[11px] font-medium text-zinc-400" style={{ fontFamily: 'var(--font-mono)' }}>AI Engine</span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot-live" style={{ animationDelay: '0.7s' }} />
                    <span className="text-[11px] font-medium text-zinc-400" style={{ fontFamily: 'var(--font-mono)' }}>Live Sync</span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>Active</span>
                </div>
              </div>
            </div>

            {/* ── Token Quota Widget ────────────────────── */}
            <div className="mt-4 mx-1 px-3 py-3 rounded-xl bg-black/40 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">API Tokens</p>
                {!isLoading && (
                  <span className="text-[9px] font-mono text-zinc-400">
                    {(tokensUsed / 1000).toFixed(1)}k / {(limit / 1000).toFixed(0)}k
                  </span>
                )}
              </div>
              <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    isNearingLimit ? "bg-amber-500" : "bg-indigo-500"
                  )}
                />
              </div>
            </div>
          </div>
          <div className="p-4 relative z-10">
            <button 
              onClick={() => handleNavigation('settings')}
              className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-300 group mb-1", activeMenu === 'settings' ? "text-white bg-white/[0.08] shadow-sm border border-white/[0.05]" : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent")}
            >
              <Settings className={cn("w-4 h-4 mr-3 transition-colors", activeMenu === 'settings' ? "text-white" : "group-hover:text-zinc-300")} />
              <span>Settings</span>
            </button>
            <button 
              onClick={() => handleNavigation('billing')}
              className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-300 group mb-1", activeMenu === 'billing' ? "text-white bg-white/[0.08] shadow-sm border border-white/[0.05]" : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent")}
            >
              <CreditCard className={cn("w-4 h-4 mr-3 transition-colors", activeMenu === 'billing' ? "text-white" : "group-hover:text-zinc-300")} />
              <span>Billing</span>
            </button>
            <button 
              onClick={() => alert('Help Center & Product Tour coming soon')}
              className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-300 group mb-6 text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent")}
            >
              <HelpCircle className="w-4 h-4 mr-3 group-hover:text-zinc-300 transition-colors" />
              <span>Help Center</span>
            </button>

            <div className="relative" ref={notificationsRef}>
              <div className="flex items-center justify-between p-2 bg-black/40 border border-white/[0.08] rounded-[16px] hover:border-white/[0.15] transition-colors group cursor-pointer shadow-inner">
                <div className="flex items-center min-w-0 flex-1 hover:bg-white/[0.05] p-1 -m-1 rounded-xl transition-colors" onClick={() => navigate('/profile')}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] mr-2.5 flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-[#121214] flex items-center justify-center text-[11px] font-bold text-white">
                      {auth.currentUser?.displayName?.[0]?.toUpperCase() || auth.currentUser?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                      {auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium tracking-wide">Pro Plan</p>
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0 pr-1 space-x-0.5">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={cn("p-1.5 transition-all relative rounded-lg", showNotifications ? "text-indigo-400 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "text-zinc-400 hover:text-white hover:bg-white/[0.1]")} 
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full border-2 border-[#121214]" />
                  </button>
                  <button onClick={handleLogout} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Sign Out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="fixed bottom-24 left-8 w-64 bg-[#121214] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-2xl p-4 z-[100] backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-white">Notifications</h4>
                        <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">3 New</span>
                      </div>
                      <button onClick={() => setShowNotifications(false)} className="p-1 text-zinc-500 hover:text-white rounded-md hover:bg-white/[0.05] transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="p-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.02] rounded-xl cursor-pointer transition-colors">
                        <p className="text-xs font-medium text-white mb-0.5">2 overdue follow-ups</p>
                        <p className="text-[10px] text-zinc-500">Pipeline needs attention</p>
                      </div>
                      <div className="p-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.02] rounded-xl cursor-pointer transition-colors">
                        <p className="text-xs font-medium text-white mb-0.5">1 email reply</p>
                        <p className="text-[10px] text-zinc-500">From Sarah at TechCorp</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] font-medium text-zinc-500">
              <Link to="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
              <Link to="/security" className="hover:text-zinc-300 transition-colors">Security & Trust</Link>
            </div>
          </div>
        </aside>
      </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="relative z-20 h-screen overflow-y-auto overflow-x-hidden block">
          {children}
        </div>

        {/* Mobile Navigation */}
        {!hideSidebar && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#121214]/80 border-t border-white/[0.04] backdrop-blur-xl pb-safe">
          <div className="flex items-center justify-around p-2">
            <button onClick={() => handleNavigation('dashboard')} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", activeMenu === 'dashboard' ? "text-white bg-white/5" : "text-zinc-500 hover:text-zinc-300")}>
              <LayoutDashboard className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Dashboard</span>
            </button>
            <button onClick={() => handleNavigation('pipeline')} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", activeMenu === 'pipeline' ? "text-white bg-white/5" : "text-zinc-500 hover:text-zinc-300")}>
              <Target className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Pipeline</span>
            </button>
            <button onClick={() => handleNavigation('directory')} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", activeMenu === 'directory' ? "text-white bg-white/5" : "text-zinc-500 hover:text-zinc-300")}>
              <Users className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Directory</span>
            </button>
            <button onClick={() => handleNavigation('billing')} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", activeMenu === 'billing' ? "text-white bg-white/5" : "text-zinc-500 hover:text-zinc-300")}>
              <CreditCard className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Billing</span>
            </button>
            <button onClick={() => handleNavigation('settings')} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", activeMenu === 'settings' ? "text-white bg-white/5" : "text-zinc-500 hover:text-zinc-300")}>
              <Settings className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Settings</span>
            </button>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}



