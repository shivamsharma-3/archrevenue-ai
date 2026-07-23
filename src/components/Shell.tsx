import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Target, Users, Settings, HelpCircle, Bell, LogOut, X, CreditCard, ShieldCheck, TrendingUp, CheckCircle2, UserCircle, Menu } from 'lucide-react';
import { cn } from '../lib/utils';
import BrandLogo from './BrandLogo';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTokenUsage } from '../hooks/useTokenUsage';
import { getPlanName } from '../lib/usage';
import { BetaFeedbackWidget } from './BetaFeedbackWidget';
import { useAdmin } from '../hooks/useAdmin';

interface ShellProps {
  children: React.ReactNode;
  activeMenu?: 'workspace' | 'dashboard' | 'pipeline' | 'directory' | 'settings' | 'billing' | 'privacy' | 'terms' | 'security';
  onMenuChange?: (menu: 'workspace' | 'dashboard' | 'pipeline' | 'directory' | 'settings' | 'billing') => void;
  hideSidebar?: boolean;
  profileComplete?: boolean;
  hasModal?: boolean;
  recentActivities?: { id: string; title: string; subtitle: string; date: Date }[];
}

export default function Shell({ children, hideSidebar = false, onMenuChange, profileComplete = true, hasModal = false, recentActivities = [] }: ShellProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const activeMenu = (location.pathname === '/workspace' || location.pathname === '/dashboard' || location.pathname === '/pipeline' || location.pathname === '/leads') ? 'workspace' : location.pathname === '/settings' ? 'settings' : location.pathname === '/billing' ? 'billing' : location.pathname === '/help' ? 'help' : location.pathname === '/insights' ? 'insights' : '';
  const { tokensUsed, limit, isLoading } = useTokenUsage();
  const { isAdmin } = useAdmin();

  const usagePercent = limit > 0 ? Math.min((tokensUsed / limit) * 100, 100) : 0;
  const isNearingLimit = usagePercent > 85;

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const handleNavigation = (menu: 'workspace' | 'dashboard' | 'pipeline' | 'directory' | 'settings' | 'billing' | 'insights' | 'help' | 'admin/beta' | 'profile') => {
    if (onMenuChange && ['workspace', 'dashboard', 'pipeline', 'directory', 'settings', 'billing'].includes(menu)) {
      onMenuChange(menu as any);
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
    setShowMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-surface-background text-text-primary font-sans flex selection:bg-indigo-100 relative">

      {/* Minimal Linear/Attio Style Sidebar */}
      {!hideSidebar && !hasModal && (
        <div className="hidden md:flex flex-col w-[250px] p-3 h-screen sticky top-0 z-30 flex-shrink-0">
        <aside className="flex-1 w-full rounded-xl border border-slate-200 bg-white flex flex-col overflow-y-auto relative">
          
          <div className="h-[64px] flex items-center px-4 cursor-pointer border-b border-slate-100" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-3">
              <BrandLogo className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-900 font-semibold tracking-tight text-[15px]">ArchRevenue</span>
          </div>
          <div className="px-2 flex-1 pt-4">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider px-3 mb-2 uppercase">Menu</p>
            <div className="space-y-0.5">
              <button 
                onClick={() => handleNavigation('workspace')}
                className={cn("w-full flex items-center px-3 py-2 rounded-lg font-medium text-[13px] transition-colors", activeMenu === 'workspace' ? "text-indigo-900 bg-indigo-50/80 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50")}
              >
                <LayoutDashboard className={cn("w-4 h-4 mr-2.5 shrink-0", activeMenu === 'workspace' ? "text-indigo-600" : "text-slate-400")} />
                Workspace
              </button>
              <button 
                onClick={() => handleNavigation('insights')}
                className={cn("w-full flex items-center px-3 py-2 rounded-lg font-medium text-[13px] transition-colors", activeMenu === 'insights' ? "text-indigo-900 bg-indigo-50/80 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50")}
              >
                <TrendingUp className={cn("w-4 h-4 mr-2.5 shrink-0", activeMenu === 'insights' ? "text-indigo-600" : "text-slate-400")} />
                Executive Intelligence
              </button>
              <button 
                onClick={() => handleNavigation('billing')}
                className={cn("w-full flex items-center px-3 py-2 rounded-lg font-medium text-[13px] transition-colors", activeMenu === 'billing' ? "text-indigo-900 bg-indigo-50/80 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50")}
              >
                <CreditCard className={cn("w-4 h-4 mr-2.5 shrink-0", activeMenu === 'billing' ? "text-indigo-600" : "text-slate-400")} />
                Billing
              </button>
            </div>

            {isAdmin && (
              <div className="mt-4 mb-2">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider px-3 mb-1.5 uppercase">Admin</p>
                <button 
                  onClick={() => handleNavigation('admin/beta')}
                  className={cn("w-full flex items-center px-3 py-2 rounded-lg font-medium text-[13px] transition-colors", location.pathname === '/admin/beta' ? "text-indigo-900 bg-indigo-50/80 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50")}
                >
                  <ShieldCheck className={cn("w-4 h-4 mr-2.5 shrink-0", location.pathname === '/admin/beta' ? "text-indigo-600" : "text-slate-400")} />
                  Beta Analytics
                </button>
              </div>
            )}

            {/* ── Complete Profile CTA ────────────────────── */}
            {!profileComplete && (
              <div className="mt-5 mx-0.5">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300 group"
                >
                  <div className="relative mr-3">
                    <UserCircle className="w-4 h-4 text-amber-500" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full border border-white" />
                  </div>
                  <span className="flex-1 text-left">Complete Profile</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                </button>
              </div>
            )}

            {/* ── Token Quota Widget ────────────────────── */}
            <div className="mt-3 mx-0.5 px-3 py-3 rounded-[var(--radius-card)] bg-surface-secondary border border-border-default">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-tertiary">API Tokens</p>
                {!isLoading && (
                  <span className="text-[9px] font-mono text-text-secondary">
                    {(tokensUsed / 1000).toFixed(1)}k / {(limit / 1000).toFixed(0)}k
                  </span>
                )}
              </div>
              <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
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
          <div className="p-3">
            <button 
              onClick={() => handleNavigation('settings')}
              className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 group mb-0.5", activeMenu === 'settings' ? "text-blue-700 bg-blue-50 border border-blue-100 shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent")}
            >
              <Settings className={cn("w-4 h-4 mr-3 transition-colors", activeMenu === 'settings' ? "text-blue-500" : "group-hover:text-text-primary")} />
              <span>Settings</span>
            </button>
            <button 
              onClick={() => handleNavigation('billing')}
              className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 group mb-0.5", activeMenu === 'billing' ? "text-blue-700 bg-blue-50 border border-blue-100 shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent")}
            >
              <CreditCard className={cn("w-4 h-4 mr-3 transition-colors", activeMenu === 'billing' ? "text-blue-500" : "group-hover:text-text-primary")} />
              <span>Billing</span>
            </button>
            <button 
              onClick={() => handleNavigation('help')}
              className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 group mb-4", activeMenu === 'help' ? "text-blue-700 bg-blue-50 border border-blue-100 shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent")}
            >
              <HelpCircle className={cn("w-4 h-4 mr-3 transition-colors", activeMenu === 'help' ? "text-blue-500" : "group-hover:text-text-primary")} />
              <span>Help Center</span>
            </button>

            <div className="relative">
              <div className="flex items-center justify-between p-2 bg-surface-secondary border border-border-default rounded-[var(--radius-card)] hover:border-border-hover transition-colors group cursor-pointer">
                <div className="flex items-center min-w-0 flex-1 hover:bg-surface-hover p-1 -m-1 rounded-xl transition-colors" onClick={() => navigate('/profile')}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-[1px] mr-2.5 flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center text-[11px] font-bold text-blue-600">
                      {auth.currentUser?.displayName?.[0]?.toUpperCase() || auth.currentUser?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-text-primary truncate group-hover:text-blue-600 transition-colors">
                      {auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-[10px] text-text-tertiary font-medium tracking-wide">
                      {getPlanName(limit)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0 pr-1 space-x-0.5">

                  <button onClick={handleLogout} className="p-1.5 text-text-tertiary hover:text-rose-500 hover:bg-rose-50 rounded-[var(--radius-button)] transition-colors" title="Sign Out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
            
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] font-medium text-text-tertiary">
              <Link to="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
              <Link to="/security" className="hover:text-text-primary transition-colors">Security & Trust</Link>
            </div>
          </div>
        </aside>
      </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="relative h-screen overflow-y-auto overflow-x-hidden flex flex-col pb-16 md:pb-0 scroll-smooth">
          {children}
        </div>

        {/* Mobile Navigation */}
        {!hideSidebar && !hasModal && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 border-t border-slate-200 backdrop-blur-xl pb-safe">
          <div className="flex items-center justify-around p-2">
            <button onClick={() => handleNavigation('workspace')} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", activeMenu === 'workspace' ? "text-indigo-600 font-semibold" : "text-slate-500 hover:text-slate-900")}>
              <LayoutDashboard className="w-5 h-5 mb-1" />
              <span className="text-[10px]">Workspace</span>
            </button>
            <button onClick={() => handleNavigation('insights')} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", activeMenu === 'insights' ? "text-indigo-600 font-semibold" : "text-slate-500 hover:text-slate-900")}>
              <TrendingUp className="w-5 h-5 mb-1" />
              <span className="text-[10px]">Intelligence</span>
            </button>
            <button onClick={() => handleNavigation('billing')} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", activeMenu === 'billing' ? "text-indigo-600 font-semibold" : "text-slate-500 hover:text-slate-900")}>
              <CreditCard className="w-5 h-5 mb-1" />
              <span className="text-[10px]">Billing</span>
            </button>
            <button onClick={() => setShowMobileMenu(true)} className="flex flex-col items-center p-2 rounded-xl transition-all text-slate-500 hover:text-slate-900">
              <Menu className="w-5 h-5 mb-1" />
              <span className="text-[10px]">Menu</span>
            </button>
          </div>
        </div>
        )}

        {/* Mobile Full Screen Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[100] bg-surface-background flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border-default bg-surface-card">
                <span className="font-semibold text-text-primary text-lg">Menu</span>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 text-text-secondary rounded-lg bg-surface-hover">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {!profileComplete && (
                  <button onClick={() => handleNavigation('profile')} className="w-full flex items-center p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 mb-4 font-semibold">
                    <UserCircle className="w-5 h-5 mr-3 text-amber-500" /> Complete Profile
                  </button>
                )}
                <button onClick={() => handleNavigation('settings')} className="w-full flex items-center p-4 bg-surface-card border border-border-default rounded-xl font-medium text-text-secondary">
                  <Settings className="w-5 h-5 mr-3 text-text-primary" /> Settings
                </button>
                <button onClick={() => handleNavigation('billing')} className="w-full flex items-center p-4 bg-surface-card border border-border-default rounded-xl font-medium text-text-secondary">
                  <CreditCard className="w-5 h-5 mr-3 text-text-primary" /> Billing
                </button>
                <button onClick={() => handleNavigation('help')} className="w-full flex items-center p-4 bg-surface-card border border-border-default rounded-xl font-medium text-text-secondary">
                  <HelpCircle className="w-5 h-5 mr-3 text-text-primary" /> Help Center
                </button>

                <button onClick={() => { handleLogout(); setShowMobileMenu(false); }} className="w-full flex items-center p-4 bg-rose-50 border border-rose-100 rounded-xl font-medium text-rose-600 mt-4">
                  <LogOut className="w-5 h-5 mr-3" /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Beta Feedback Widget for Authenticated Users */}
      <BetaFeedbackWidget />
    </div>
  );
}
