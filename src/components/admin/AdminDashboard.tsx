import React from 'react';
import { LogOut, ShieldAlert, Users, Database, Activity } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../BrandLogo';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-red-500/30">
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-500/10 rounded-lg border border-red-500/20 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-sm font-bold tracking-widest uppercase font-headline text-white">System Admin</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 mr-4">
             <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
             <span className="text-[11px] uppercase tracking-widest text-emerald-500 font-mono">System Online</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center text-xs font-semibold text-text-tertiary hover:text-white transition-colors uppercase tracking-wider"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Terminate Session
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 max-w-[1200px] mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-headline uppercase">
            Command Center
          </h1>
          <p className="text-sm text-text-tertiary font-mono">Overview of system health and administrative controls.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-5 h-5 text-red-400 group-hover:text-red-500 transition-colors" />
              <span className="text-[10px] uppercase tracking-widest text-text-tertiary font-mono">Total Users</span>
            </div>
            <p className="text-3xl font-light text-white font-mono">142</p>
          </div>
          
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-5 h-5 text-red-400 group-hover:text-red-500 transition-colors" />
              <span className="text-[10px] uppercase tracking-widest text-text-tertiary font-mono">API Calls (24h)</span>
            </div>
            <p className="text-3xl font-light text-white font-mono">84.2K</p>
          </div>
          
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-widest text-text-tertiary font-mono">System Load</span>
            </div>
            <p className="text-3xl font-light text-white font-mono">12%</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8">
           <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-widest text-sm">Security Logs</h2>
           <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-white">Successful Admin Login</p>
                      <p className="text-xs text-text-tertiary font-mono">IP: 192.168.1.{100 + i}</p>
                    </div>
                  </div>
                  <span className="text-xs text-text-tertiary font-mono">{i * 12} mins ago</span>
                </div>
              ))}
           </div>
        </div>
      </main>
    </div>
  );
}
