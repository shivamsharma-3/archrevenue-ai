import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Sparkles, BarChart3, Users } from 'lucide-react';
import { loginWithGoogle, auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface LoginProps {
  onLoginSuccess: () => void;
}

const BrandLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 50 15 L 20 85 L 38 85 L 50 55 L 62 85 L 80 85 Z" fill="currentColor" />
    <path d="M 38 70 L 62 70" stroke="currentColor" strokeWidth="12" strokeLinecap="square" />
  </svg>
);

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
          setError('Email is already registered. Please log in.');
      } else {
          setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-50 flex font-sans selection:bg-[#6366f1]/30">
      {/* Left Column - Presentation */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 lg:p-20 overflow-hidden bg-[#0a0a0b]">
        {/* Real Background Image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')" }}
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
              <span className="text-xl font-medium tracking-wide text-white font-display">ArchRevenue</span>
            </div>

            <div className="mb-8 mt-6">
              <div className="inline-flex items-center px-3 py-1.5 bg-transparent border border-white/[0.08] rounded-full mb-6">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400 mr-2" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-[#a1a1aa]">Enterprise Ready</span>
              </div>
              
              <h1 className="text-5xl lg:text-[56px] font-medium tracking-tight text-white mb-4 leading-[1.1] font-display">
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
              <h3 className="text-base font-semibold text-white mb-2 font-display">Live Pipeline</h3>
              <p className="text-[13px] text-zinc-400 leading-relaxed font-light">Real-time sync across your entire organization.</p>
            </div>
            <div className="flex-1 bg-black/40 border border-white/[0.06] rounded-[20px] p-6 backdrop-blur-md">
              <Users className="w-6 h-6 text-[#00d2ff] mb-4" />
              <h3 className="text-base font-semibold text-white mb-2 font-display">Lead Funneling</h3>
              <p className="text-[13px] text-zinc-400 leading-relaxed font-light">Intelligent staging from contact to close.</p>
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
          <span className="text-lg font-medium tracking-wide text-white font-display">ArchRevenue</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-10">
            <h2 className="text-[32px] font-medium tracking-tight text-white mb-2 font-display">
              {isRegistering ? 'Create account' : 'Welcome back'}
            </h2>
            <p className="text-[15px] text-[#a1a1aa] font-light">
              {isRegistering ? 'Set up your revenue terminal.' : 'Access your revenue terminal securely.'}
            </p>
          </div>
          
          <form onSubmit={handleEmailAuth} className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[13px] text-[#a1a1aa]">Work Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-[14px] bg-[#121214] border border-white/[0.04] rounded-xl focus:ring-0 focus:border-[#6366f1] focus:bg-white/[0.02] hover:border-white/[0.08] transition-all text-sm outline-none placeholder:text-zinc-600 text-white"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] text-[#a1a1aa]">Security Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-[14px] bg-[#121214] border border-white/[0.04] rounded-xl focus:ring-0 focus:border-[#6366f1] focus:bg-white/[0.02] hover:border-white/[0.08] transition-all text-sm outline-none placeholder:text-zinc-600 text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-[14px] px-4 rounded-xl text-[15px] font-medium text-white bg-[#6366f1] hover:bg-[#5355eb] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0b] focus:ring-[#6366f1] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
            >
              {isLoading ? 'Processing...' : (isRegistering ? 'Register Account' : 'Sign In with Email')}
              {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between">
            <div className="border-t border-white/[0.06] flex-1"></div>
            <span className="px-4 text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Or continue with</span>
            <div className="border-t border-white/[0.06] flex-1"></div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-[14px] px-4 rounded-xl text-[15px] font-medium text-zinc-200 bg-transparent border border-white/[0.1] hover:bg-white/[0.02] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Official Google "G" logo SVG */}
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fillRule="evenodd">
                  <path d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </g>
              </svg>
              Continue with Google
            </button>
          </div>
          
          <div className="mt-10 text-center">
            <span className="text-zinc-500 text-[13px] font-medium">Don't have access? </span>
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-[13px] text-[#7b81ff] hover:text-[#9b9fff] font-medium transition-colors"
            >
              {isRegistering ? 'Back to Sign In' : 'Create an account'}
            </button>
          </div>
        </motion.div>

        {/* Footer Links */}
        <div className="absolute bottom-8 w-full left-0 flex justify-center space-x-6 text-[11px] font-medium text-zinc-500">
          <Link to="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
          <Link to="/security" className="hover:text-zinc-300 transition-colors">Security & Trust</Link>
        </div>
      </div>
    </div>
  );
}
