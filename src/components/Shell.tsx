import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Target, Users, Settings, HelpCircle, Bell, LogOut, X, CreditCard, ShieldCheck, TrendingUp, CheckCircle2, UserCircle, Menu } from 'lucide-react';
import { cn } from '../lib/utils';
import BrandLogo from './BrandLogo';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTokenUsage } from '../hooks/useTokenUsage';
import { BetaFeedbackWidget } from './BetaFeedbackWidget';
import { useAdmin } from '../hooks/useAdmin';

interface ShellProps {
  children: React.ReactNode;
  activeMenu?: 'dashboard' | 'pipeline' | 'directory' | 'settings' | 'billing' | 'privacy' | 'terms' | 'security';
  onMenuChange?: (menu: 'dashboard' | 'pipeline' | 'directory' | 'settings' | 'billing') => void;
  hideSidebar?: boolean;
  profileComplete?: boolean;
  hasModal?: boolean;
  recentActivities?: { id: string; title: string; subtitle: string; date: Date }[];
}

export default function Shell({ children, hideSidebar = false, onMenuChange, profileComplete = true, hasModal = false, recentActivities = [] }: ShellProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const activeMenu = location.pathname === '/dashboard' ? 'dashboard' : location.pathname === '/pipeline' ? 'pipeline' : location.pathname === '/leads' ? 'directory' : location.pathname === '/settings' ? 'settings' : location.pathname === '/billing' ? 'billing' : location.pathname === '/help' ? 'help' : location.pathname === '/insights' ? 'insights' : '';
  const { tokensUsed, limit, isLoading } = useTokenUsage();
  const { isAdmin } = useAdmin();

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

  const handleNavigation = (menu: 'dashboard' | 'pipeline' | 'directory' | 'settings' | 'billing' | 'insights' | 'help' | 'admin/beta') => {
    if (onMenuChange && ['dashboard', 'pipeline', 'directory', 'settings', 'billing'].includes(menu)) {
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

      {/* Premium Light Sidebar */}
      {!hideSidebar && !hasModal && (
        <div className="hidden md:flex flex-col w-[260px] p-3 h-screen sticky top-0 z-30 flex-shrink-0">
        <aside className="flex-1 w-full rounded-[var(--radius-card)] border border-border-default bg-surface-sidebar shadow-sm flex flex-col overflow-y-auto relative">
          
          <div className="h-[72px] flex items-center px-5 cursor-pointer border-b border-border-default" onClick={() => navigate('/dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 shadow-md">
              <BrandLogo className="w-5 h-5 text-white" />
            </div>
            <span className="text-text-primary font-semibold tracking-wide font-display text-[16px]">ArchRevenue</span>
          </div>
          <div className="px-3 flex-1 pt-4">
            <p className="text-[10px] font-bold text-text-tertiary tracking-widest px-3 mb-2">MENU</p>
            <div className="space-y-0.5">
              <button 
                onClick={() => handleNavigation('dashboard')}
                className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 group overflow-hidden", activeMenu === 'dashboard' ? "text-blue-700 bg-blue-50 border border-blue-100 shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent")}
              >
                <LayoutDashboard className={cn("w-4 h-4 mr-3 transition-colors", activeMenu === 'dashboard' ? "text-blue-500" : "group-hover:text-text-primary")} />
                Command Center
              </button>
              <button 
                onClick={() => handleNavigation('pipeline')}
                className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 group overflow-hidden", activeMenu === 'pipeline' ? "text-blue-700 bg-blue-50 border border-blue-100 shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent")}
              >
                <Target className={cn("w-4 h-4 mr-3 transition-colors", activeMenu === 'pipeline' ? "text-blue-500" : "group-hover:text-text-primary")} />
                Pipeline
              </button>
              <button 
                onClick={() => handleNavigation('insights')}
                className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 group overflow-hidden", activeMenu === 'insights' ? "text-blue-700 bg-blue-50 border border-blue-100 shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent")}
              >
                <TrendingUp className={cn("w-4 h-4 mr-3 transition-colors", activeMenu === 'insights' ? "text-blue-500" : "group-hover:text-text-primary")} />
                Executive Intelligence
              </button>
              <button 
                onClick={() => handleNavigation('directory')}
                className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 group overflow-hidden", activeMenu === 'directory' ? "text-blue-700 bg-blue-50 border border-blue-100 shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent")}
              >
                <Users className={cn("w-4 h-4 mr-3 transition-colors", activeMenu === 'directory' ? "text-blue-500" : "group-hover:text-text-primary")} />
                Leads
              </button>
            </div>

            {isAdmin && (
              <div className="mt-5 mb-2">
                <p className="text-[10px] font-bold text-blue-500 tracking-widest px-3 mb-2">ADMIN</p>
                <button 
                  onClick={() => handleNavigation('admin/beta')}
                  className={cn("relative w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 group overflow-hidden", location.pathname === '/admin/beta' ? "text-blue-700 bg-blue-50 border border-blue-100 shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent")}
                >
                  <ShieldCheck className={cn("w-4 h-4 mr-3 transition-colors", location.pathname === '/admin/beta' ? "text-blue-500" : "group-hover:text-text-primary")} />
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

            <div className="relative" ref={notificationsRef}>
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
                    <p className="text-[10px] text-text-tertiary font-medium tracking-wide">Pro Plan</p>
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0 pr-1 space-x-0.5">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={cn("p-1.5 transition-all relative rounded-[var(--radius-button)]", showNotifications ? "text-blue-600 bg-blue-50 shadow-sm" : "text-text-tertiary hover:text-text-primary hover:bg-surface-hover")} 
                    title="Intelligence Feed"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full border-2 border-surface-card" />
                  </button>
                  <button onClick={handleLogout} className="p-1.5 text-text-tertiary hover:text-rose-500 hover:bg-rose-50 rounded-[var(--radius-button)] transition-colors" title="Sign Out">
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
                    className="fixed bottom-24 left-6 w-64 bg-surface-card border border-border-default shadow-xl rounded-[var(--radius-card)] p-4 z-[100]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-text-primary">Intelligence Feed</h4>
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">3 New</span>
                      </div>
                      <button onClick={() => setShowNotifications(false)} className="p-1 text-text-tertiary hover:text-text-primary rounded-md hover:bg-surface-hover transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {recentActivities.length > 0 ? (
                        recentActivities.slice(0, 5).map((activity, i) => (
                          <div key={activity.id || i} className="p-2.5 bg-surface-secondary hover:bg-surface-hover border border-border-default rounded-xl cursor-pointer transition-colors">
                            <div className="flex justify-between items-start mb-0.5">
                              <p className="text-xs font-medium text-text-primary pr-2">{activity.title}</p>
                            </div>
                            <p className="text-[10px] text-text-tertiary">{activity.subtitle}</p>
                            <p className="text-[9px] text-text-tertiary mt-1 opacity-60">
                              {activity.date.toLocaleDateString()} {activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-xs text-text-tertiary font-medium">No new intelligence</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
        <div className="relative z-20 h-screen overflow-y-auto overflow-x-hidden flex flex-col pb-16 md:pb-0 scroll-smooth">
          {children}
        </div>

        {/* Mobile Navigation */}
        {!hideSidebar && !hasModal && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-card/90 border-t border-border-default backdrop-blur-xl pb-safe">
          <div className="flex items-center justify-around p-2">
            <button onClick={() => handleNavigation('dashboard')} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", activeMenu === 'dashboard' ? "text-blue-600 bg-blue-50" : "text-text-tertiary hover:text-text-secondary")}>
              <LayoutDashboard className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Command Center</span>
            </button>
            <button onClick={() => handleNavigation('pipeline')} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", activeMenu === 'pipeline' ? "text-blue-600 bg-blue-50" : "text-text-tertiary hover:text-text-secondary")}>
              <Target className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Pipeline</span>
            </button>
            <button onClick={() => handleNavigation('directory')} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", activeMenu === 'directory' ? "text-blue-600 bg-blue-50" : "text-text-tertiary hover:text-text-secondary")}>
              <Users className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Directory</span>
            </button>
            <button onClick={() => handleNavigation('insights')} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", activeMenu === 'insights' ? "text-blue-600 bg-blue-50" : "text-text-tertiary hover:text-text-secondary")}>
              <TrendingUp className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Insights</span>
            </button>
            <button onClick={() => setShowMobileMenu(true)} className="flex flex-col items-center p-2 rounded-xl transition-all text-text-tertiary hover:text-text-secondary">
              <Menu className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Menu</span>
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
                <button onClick={() => { setShowMobileMenu(false); setShowNotifications(true); }} className="w-full flex items-center p-4 bg-surface-card border border-border-default rounded-xl font-medium text-text-secondary">
                  <Bell className="w-5 h-5 mr-3 text-text-primary" /> Intelligence Feed
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
