import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Sparkles, BarChart3, Users } from 'lucide-react';
import { loginWithGoogle, auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface LoginProps {
  onLoginSuccess: () => void;
  initialIsRegistering?: boolean;
}

import BrandLogo from './BrandLogo';

export default function Login({ onLoginSuccess, initialIsRegistering = false }: LoginProps) {
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginWithGoogle();
      // result is null when redirect flow was triggered (popup was blocked)
      // In that case the page will reload automatically — no action needed
      if (result) {
        onLoginSuccess();
      }
      // If result is null, redirect is in progress — keep loading state
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (code === 'auth/unauthorized-domain') {
        setError('This domain is not authorised in Firebase. Add localhost to authorised domains in Firebase Console.');
      } else {
        setError(err.message || 'Error authenticating with Google.');
      }
      setIsLoading(false);
    }
    // Note: don't call setIsLoading(false) in finally — redirect will reload the page
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex font-sans selection:bg-[#6366f1]/30">
      {/* Left Column - Presentation */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 lg:p-20 overflow-hidden bg-[#0a0a0b]">
        {/* Real Background Image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2560&auto=format&fit=crop')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0a0a0b]/50 to-[#0a0a0b] z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b]/80 via-[#0a0a0b]/30 to-transparent z-10" />
        </div>

        <div className="relative z-20 flex-col flex h-full justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-[#6366f1]/10 rounded-xl border border-[#6366f1]/20 flex items-center justify-center backdrop-blur-md">
                 <BrandLogo className="w-6 h-6 text-[#6366f1]" />
              </div>
              <span className="text-xl font-medium tracking-wide text-text-primary font-headline">ArchRevenue</span>
            </div>

            <div className="mb-8 mt-6">
              <div className="inline-flex items-center px-3 py-1.5 bg-transparent border border-border-default rounded-full mb-6">
                <Sparkles className="w-3.5 h-3.5 text-text-tertiary mr-2" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-[#a1a1aa]">Enterprise Ready</span>
              </div>
              
              <h1 className="text-5xl lg:text-[56px] font-medium tracking-tight text-white mb-4 leading-[1.1] font-headline">
                Control the flow.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7b81ff] to-[#00d2ff]">Scale the revenue.</span>
              </h1>
              
              <p className="text-[#a1a1aa] text-lg max-w-[420px] leading-relaxed mt-6 font-light">
                The billion-dollar ecosystem for closing deals. Manage leads, track pipeline velocity, and dominate your quarter with absolute precision.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex space-x-6 w-full max-w-[500px]">
            <div className="flex-1 bg-black/40 border border-white/[0.06] rounded-[20px] p-6 backdrop-blur-md">
              <BarChart3 className="w-6 h-6 text-[#7b81ff] mb-4" />
              <h3 className="text-base font-semibold text-white mb-2 font-headline">Live Pipeline</h3>
              <p className="text-[13px] text-text-tertiary leading-relaxed font-light">Real-time sync across your entire organization.</p>
            </div>
            <div className="flex-1 bg-black/40 border border-white/[0.06] rounded-[20px] p-6 backdrop-blur-md">
              <Users className="w-6 h-6 text-[#00d2ff] mb-4" />
              <h3 className="text-base font-semibold text-white mb-2 font-headline">Lead Funneling</h3>
              <p className="text-[13px] text-text-tertiary leading-relaxed font-light">Intelligent staging from contact to close.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative bg-[#0a0a0b] z-20">
        {/* Mobile Header elements */}
        <div className="absolute top-8 left-8 flex items-center space-x-3 lg:hidden">
          <div className="w-8 h-8 bg-[#6366f1]/10 rounded-lg border border-[#6366f1]/20 flex items-center justify-center">
            <BrandLogo className="w-5 h-5 text-[#6366f1]" />
          </div>
          <span className="text-lg font-medium tracking-wide text-white font-headline">ArchRevenue</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-10">
            <h2 className="text-[32px] font-medium tracking-tight text-white mb-2 font-headline">
              {isRegistering ? 'Create account' : 'Welcome back'}
            </h2>
            <p className="text-[15px] text-[#a1a1aa] font-light">
              {isRegistering ? 'Start your revenue intelligence journey.' : 'Enter your credentials to access your terminal.'}
            </p>
          </div>
          
          <div className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center">
                {error}
              </div>
            )}
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center py-[14px] px-4 rounded-xl text-[15px] font-medium text-black bg-surface-card hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0b] focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
            >
              <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>{isLoading ? 'Processing...' : (isRegistering ? 'Sign up with Google' : 'Sign in with Google')}</span>
            </button>
            
            <div className="mt-8 text-center">
              <span className="text-text-tertiary text-[13px] font-medium">
                {isRegistering ? 'Already have an account? ' : "Don't have access? "}
              </span>
              <button 
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-[13px] text-[#7b81ff] hover:text-[#9b9fff] font-semibold transition-colors"
              >
                {isRegistering ? 'Sign In' : 'Request an account'}
              </button>
            </div>
          </div>

        </motion.div>

        {/* Footer Links */}
        <div className="absolute bottom-8 w-full left-0 flex justify-center space-x-6 text-[11px] font-medium text-text-tertiary">
          <Link to="/privacy" className="hover:text-text-secondary transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-text-secondary transition-colors">Terms of Service</Link>
          <Link to="/security" className="hover:text-text-secondary transition-colors">Security & Trust</Link>
        </div>
      </div>
    </div>
  );
}
