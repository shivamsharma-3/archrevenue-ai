import React, { useState } from 'react';
import { Lock, ArrowRight, Activity, Shield } from 'lucide-react';
import { auth, loginWithEmail } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../BrandLogo';
import '../../styles/landing.css';
import { cn } from '../../lib/utils';
import { logSystemEvent } from '../../lib/admin';

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
      await logSystemEvent('Admin Authentication Success', 'success', user.uid, '127.0.0.1'); // IP is mocked for client-side
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
      setIsLoading(false);
      await logSystemEvent('Failed Authentication Attempt', 'error', email, '127.0.0.1');
    }
  };

  return (
    <div className="landing-page min-h-screen bg-surface-background text-text-primary flex flex-col items-center justify-center font-sans p-6">
      
      <div className="mb-12 flex flex-col items-center">
        <BrandLogo className="w-8 h-8 text-text-primary mb-6" />
        <h2 className="text-3xl font-display font-medium tracking-tight text-text-primary mb-2">
          System Admin Portal
        </h2>
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.2em] font-medium">
          Restricted Area
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] product-chrome-outer p-8 relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-text-primary" />
        
        <form onSubmit={handleAdminAuth} className="space-y-6">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-start">
              <Shield className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          <div>
            <label className="block text-[11px] uppercase tracking-widest font-semibold text-text-secondary mb-2 pl-1">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-3.5 bg-surface-background border border-border-default rounded-none text-[14px] text-text-primary placeholder-text-tertiary focus:outline-none focus:border-text-primary transition-colors font-mono"
              placeholder="admin@archrevenue.com"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest font-semibold text-text-secondary mb-2 pl-1">Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-3.5 bg-surface-background border border-border-default rounded-none text-[14px] text-text-primary placeholder-text-tertiary focus:outline-none focus:border-text-primary transition-colors font-mono tracking-widest"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-luxury w-full flex items-center justify-center py-[14px] px-4 text-[13px] font-medium text-surface-background bg-text-primary border border-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-8 uppercase tracking-widest"
          >
            {isLoading ? 'Authenticating...' : 'Authorize Access'}
            {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
          </button>
        </form>
      </motion.div>

      <div className="mt-12 text-center">
        <p className="text-[10px] text-text-tertiary uppercase tracking-[0.2em]">
          IP Logged • Terminal Secure • V. 2.4.1
        </p>
      </div>
    </div>
  );
}
