import React, { useState } from 'react';
import { Lock, ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import { auth, loginWithEmail } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../BrandLogo';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      // 1. Authenticate
      const userCredential = await loginWithEmail(email, password);
      const user = userCredential.user;

      // 2. Verify Admin Role
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
        await auth.signOut();
        throw new Error('ACCESS DENIED: Insufficient Privileges. This incident has been logged.');
      }

      // 3. Success
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-sans selection:bg-red-500/30 p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="bg-[#0a0a0a] border border-red-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-rose-400" />
          
          <div className="flex items-center justify-center mb-8">
             <div className="w-14 h-14 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.15)]">
               <ShieldAlert className="w-7 h-7 text-red-500" />
             </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2 font-headline uppercase tracking-widest">
              System Admin Portal
            </h2>
            <p className="text-sm text-red-400/80 font-mono">
              Restricted Area. Authorized Personnel Only.
            </p>
          </div>
          
          <form onSubmit={handleAdminAuth} className="space-y-5">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start">
                <Activity className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                <span className="font-mono">{error}</span>
              </motion.div>
            )}

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2 pl-1">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3.5 bg-black/60 border border-white/10 rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-mono"
                placeholder="admin@archrevenue.com"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2 pl-1">Master Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3.5 bg-black/60 border border-white/10 rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-mono tracking-widest"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-[14px] px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050505] focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-8 uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              {isLoading ? 'Authenticating...' : 'Authorize Access'}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
          </form>
        </div>
        <div className="mt-6 text-center">
          <p className="text-[10px] text-text-tertiary uppercase tracking-widest font-mono">
            IP Logged • Terminal Secure • V. 2.4.1
          </p>
        </div>
      </motion.div>
    </div>
  );
}
