import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, ArrowRight, Sparkles, BarChart3, Users, ShieldCheck, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { loginWithGoogle, auth, registerWithEmail, loginWithEmail } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface LoginProps {
  initialIsRegistering?: boolean;
}

import BrandLogo from './BrandLogo';

// OTP input digit component
function OtpDigit({
  value,
  inputRef,
  onChange,
  onKeyDown,
  onPaste,
}: {
  key?: React.Key;
  value: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      className={cn(
        'w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all',
        'bg-black/40 text-white placeholder-transparent',
        'focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1]',
        value
          ? 'border-[#6366f1]/60 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
          : 'border-white/[0.08]'
      )}
    />
  );
}

export default function Login({ initialIsRegistering = false }: LoginProps) {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(initialIsRegistering);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP step
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const otpRefs = useRef<Array<React.RefObject<HTMLInputElement>>>(
    Array.from({ length: 6 }, () => React.createRef<HTMLInputElement>())
  );

  // Cooldown timer
  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const t = setTimeout(() => setOtpResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpResendCooldown]);

  // Reset OTP when switching modes
  useEffect(() => {
    setStep('form');
    setOtpDigits(['', '', '', '', '', '']);
    setError(null);
    setPassword('');
    setConfirmPassword('');
    setEmail('');
  }, [isRegistering]);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pass)) return 'Password must contain an uppercase letter.';
    if (!/[a-z]/.test(pass)) return 'Password must contain a lowercase letter.';
    if (!/[0-9]/.test(pass)) return 'Password must contain a number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return 'Password must contain a special character.';
    return null;
  };

  // ─── Send OTP ────────────────────────────────────────────────────────────────
  const sendOtp = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/sendOtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP.');

      // In dev mode, show the OTP via toast so you can test without email
      if (data.devOtp) {
        toast(`🔐 Dev OTP: ${data.devOtp}`, {
          duration: 30000,
          style: {
            background: '#1a1a2e',
            color: '#a5b4fc',
            border: '1px solid rgba(99,102,241,0.3)',
            fontFamily: 'monospace',
            fontSize: '16px',
            fontWeight: 'bold',
            letterSpacing: '0.15em',
          },
        });
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'Could not send OTP. Please try again.');
      return false;
    }
  };

  // ─── Verify OTP + Create Account ─────────────────────────────────────────────
  const verifyOtpAndCreateAccount = async () => {
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify OTP via API
      const res = await fetch('/api/sendOtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP verification failed.');

      // OTP correct — create account
      await registerWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
      setIsLoading(false);
    }
  };

  // ─── Form Submit (Step 1) ─────────────────────────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (isRegistering) {
      const passErr = validatePassword(password);
      if (passErr) { setError(passErr); return; }

      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }

      // Move to OTP step
      setIsLoading(true);
      const sent = await sendOtp();
      setIsLoading(false);
      if (sent) {
        setStep('otp');
        setOtpResendCooldown(60);
        setTimeout(() => otpRefs.current[0]?.current?.focus(), 100);
      }
    } else {
      setIsLoading(true);
      try {
        await loginWithEmail(email, password);
      } catch (err: any) {
        setError(err.message || 'Authentication failed.');
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (code === 'auth/unauthorized-domain') {
        setError(
          'This domain is not authorised in Firebase. Add localhost to authorised domains in Firebase Console.'
        );
      } else {
        setError(err.message || 'Error authenticating with Google.');
      }
      setIsLoading(false);
    }
  };

  // ─── OTP digit handlers ───────────────────────────────────────────────────────
  const handleOtpChange = (index: number, val: string) => {
    const digits = [...otpDigits];
    digits[index] = val.slice(-1);
    setOtpDigits(digits);
    if (val && index < 5) otpRefs.current[index + 1]?.current?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.current?.focus();
    }
    if (e.key === 'Enter' && otpDigits.join('').length === 6) {
      verifyOtpAndCreateAccount();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const digits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) digits[i] = pasted[i];
    setOtpDigits(digits);
    const nextIndex = Math.min(pasted.length, 5);
    otpRefs.current[nextIndex]?.current?.focus();
  };

  const handleResendOtp = async () => {
    if (otpResendCooldown > 0) return;
    setError(null);
    setIsLoading(true);
    const sent = await sendOtp();
    setIsLoading(false);
    if (sent) {
      setOtpResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      toast.success('New OTP sent!');
      setTimeout(() => otpRefs.current[0]?.current?.focus(), 100);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex font-sans selection:bg-[#6366f1]/30">
      {/* Left Column - Presentation */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 lg:p-20 overflow-hidden bg-[#0a0a0b]">
        {/* Background */}
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
        {/* Mobile Header */}
        <div className="absolute top-8 left-8 flex items-center space-x-3 lg:hidden">
          <div className="w-8 h-8 bg-[#6366f1]/10 rounded-lg border border-[#6366f1]/20 flex items-center justify-center">
            <BrandLogo className="w-5 h-5 text-[#6366f1]" />
          </div>
          <span className="text-lg font-medium tracking-wide text-white font-headline">ArchRevenue</span>
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Form ── */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[420px]"
            >
              <div className="mb-10">
                <div className="inline-flex items-center px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 mr-2" />
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest">
                    End-to-end Encrypted
                  </span>
                </div>
                <h2 className="text-[32px] font-medium tracking-tight text-white mb-2 font-headline">
                  {isRegistering ? 'Create secure account' : 'Secure Login'}
                </h2>
                <p className="text-[15px] text-[#a1a1aa] font-light">
                  {isRegistering
                    ? 'Start your revenue intelligence journey.'
                    : 'Enter your credentials to access your terminal.'}
                </p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center mb-2">
                    {error}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1.5 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-text-tertiary" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/[0.06] rounded-xl text-[14px] text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] transition-all"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1.5 ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-text-tertiary" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-11 py-3.5 bg-black/40 border border-white/[0.06] rounded-xl text-[14px] text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] transition-all"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-tertiary hover:text-text-secondary transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Re-enter Password (signup only) */}
                {isRegistering && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <label className="block text-[13px] font-medium text-text-secondary mb-1.5 ml-1">
                      Re-enter Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <ShieldCheck
                          className={cn(
                            'h-4 w-4 transition-colors',
                            confirmPassword && password === confirmPassword
                              ? 'text-emerald-400'
                              : 'text-text-tertiary'
                          )}
                        />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={cn(
                          'block w-full pl-11 pr-11 py-3.5 bg-black/40 border rounded-xl text-[14px] text-white placeholder-text-tertiary focus:outline-none focus:ring-1 transition-all',
                          confirmPassword && password !== confirmPassword
                            ? 'border-red-500/40 focus:ring-red-500 focus:border-red-500'
                            : confirmPassword && password === confirmPassword
                            ? 'border-emerald-500/40 focus:ring-emerald-500 focus:border-emerald-500'
                            : 'border-white/[0.06] focus:ring-[#6366f1] focus:border-[#6366f1]'
                        )}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-tertiary hover:text-text-secondary transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Match indicator */}
                    {confirmPassword && (
                      <p
                        className={cn(
                          'text-[11px] mt-1.5 ml-1 transition-colors',
                          password === confirmPassword ? 'text-emerald-400' : 'text-red-400'
                        )}
                      >
                        {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-[14px] px-4 rounded-xl text-[15px] font-medium text-white bg-[#6366f1] hover:bg-[#5355e1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0b] focus:ring-[#6366f1] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6 gap-2"
                >
                  {isLoading ? (
                    'Processing...'
                  ) : isRegistering ? (
                    <>Continue <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    'Sign In'
                  )}
                </button>

                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-white/[0.06]" />
                  <span className="flex-shrink-0 mx-4 text-text-tertiary text-xs">OR</span>
                  <div className="flex-grow border-t border-white/[0.06]" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-[14px] px-4 rounded-xl text-[15px] font-medium text-black bg-surface-card hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0b] focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>{isLoading ? 'Processing...' : isRegistering ? 'Sign up with Google' : 'Sign in with Google'}</span>
                </button>

                <div className="mt-8 text-center pt-2">
                  <span className="text-text-tertiary text-[13px] font-medium">
                    {isRegistering ? 'Already have an account? ' : "Don't have access? "}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(isRegistering ? '/login' : '/signup')}
                    className="text-[13px] text-[#7b81ff] hover:text-[#9b9fff] font-semibold transition-colors"
                  >
                    {isRegistering ? 'Sign In' : 'Request an account'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[420px]"
            >
              {/* Header */}
              <div className="mb-10">
                <div className="w-14 h-14 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-7 h-7 text-[#6366f1]" />
                </div>
                <h2 className="text-[30px] font-medium tracking-tight text-white mb-2 font-headline">
                  Verify your email
                </h2>
                <p className="text-[14px] text-[#a1a1aa] font-light leading-relaxed">
                  We sent a 6-digit code to{' '}
                  <span className="text-white font-medium">{email}</span>.
                  <br />Enter it below to complete your account setup.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center mb-6">
                  {error}
                </div>
              )}

              {/* OTP digits */}
              <div className="flex gap-3 justify-center mb-8">
                {otpDigits.map((digit, i) => (
                  <OtpDigit
                    key={i}
                    value={digit}
                    inputRef={otpRefs.current[i] as React.RefObject<HTMLInputElement>}
                    onChange={(v) => handleOtpChange(i, v)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                  />
                ))}
              </div>

              {/* Verify button */}
              <button
                type="button"
                onClick={verifyOtpAndCreateAccount}
                disabled={isLoading || otpDigits.join('').length < 6}
                className="w-full flex items-center justify-center py-[14px] px-4 rounded-xl text-[15px] font-medium text-white bg-[#6366f1] hover:bg-[#5355e1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0b] focus:ring-[#6366f1] disabled:opacity-40 disabled:cursor-not-allowed transition-all gap-2"
              >
                {isLoading ? (
                  'Creating account...'
                ) : (
                  <>Verify &amp; Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {/* Resend + back */}
              <div className="mt-6 flex items-center justify-between text-[13px]">
                <button
                  type="button"
                  onClick={() => { setStep('form'); setError(null); setOtpDigits(['', '', '', '', '', '']); }}
                  className="text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  ← Change email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpResendCooldown > 0 || isLoading}
                  className={cn(
                    'flex items-center gap-1.5 transition-colors font-medium',
                    otpResendCooldown > 0
                      ? 'text-text-tertiary cursor-default'
                      : 'text-[#7b81ff] hover:text-[#9b9fff]'
                  )}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {otpResendCooldown > 0 ? `Resend in ${otpResendCooldown}s` : 'Resend code'}
                </button>
              </div>

              <p className="text-center text-[11px] text-text-tertiary mt-8">
                Check your spam folder if you don't see the email.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Links */}
        <div className="absolute bottom-8 w-full left-0 flex justify-center space-x-6 text-[11px] font-medium text-text-tertiary items-center">
          <Link to="/privacy" className="hover:text-text-secondary transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-text-secondary transition-colors">Terms of Service</Link>
          <Link to="/security" className="hover:text-text-secondary transition-colors">Security &amp; Trust</Link>
          <span className="w-1 h-1 rounded-full bg-white/[0.06]" />
          <Link to="/admin" className="hover:text-red-400 transition-colors flex items-center group">
            <Lock className="w-3 h-3 mr-1 opacity-50 group-hover:opacity-100" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">Admin</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
