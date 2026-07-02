import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { Shield, User, Mail, Lock, Key, AlertCircle, CheckCircle2, Circle, ChevronRight, Sparkles, Building, Briefcase, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../components/layout/PageLayout';
import { AppInput } from '../components/ui/AppInput';
import { AppButton } from '../components/ui/AppButton';
import CompanyProfileWizard from '../components/CompanyProfileWizard';

export default function ProfilePage() {
  const { showToast, sellerProfile, setSellerProfile, leads, showProfileWizard, setShowProfileWizard } = useOutletContext<any>();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      if (showToast) showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !auth.currentUser.email) return;
    if (!currentPassword || !newPassword) {
      if (showToast) showToast('Please enter current and new password', 'error');
      return;
    }
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      if (showToast) showToast('Password updated successfully', 'success');
    } catch (err: any) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Setup steps based on profile & leads state
  const setupSteps = [
    {
      id: 'profile',
      title: 'Complete Company Profile',
      description: 'Tell AI about your company, product, and target customer to personalise all outreach and scoring.',
      isComplete: !!sellerProfile?.setupComplete || !!(sellerProfile?.companyName && sellerProfile?.primaryOffer),
      icon: Building,
      color: 'indigo',
      actionText: 'Go to Settings',
      actionLink: '/settings',
    },
    {
      id: 'lead',
      title: 'Add Your First Lead',
      description: 'Create a lead manually or import from a CSV file to start building your pipeline.',
      isComplete: leads && leads.length > 0,
      icon: User,
      color: 'violet',
      actionText: 'Go to Leads',
      actionLink: '/leads',
    },
    {
      id: 'ai',
      title: 'Run Your First AI Score',
      description: 'Let AI analyse a lead and give you a revenue intelligence score and personalised outreach scripts.',
      isComplete: leads && leads.some((l: any) => l.aiAnalysis),
      icon: Sparkles,
      color: 'emerald',
      actionText: 'View Pipeline',
      actionLink: '/pipeline',
    },
  ];

  const completedCount = setupSteps.filter(s => s.isComplete).length;
  const progress = Math.round((completedCount / setupSteps.length) * 100);
  const allDone = progress === 100;

  const colorMap: Record<string, { bg: string; border: string; text: string; icon: string; badge: string; ring: string }> = {
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', icon: 'text-indigo-500', badge: 'bg-indigo-100 text-indigo-700', ring: 'ring-indigo-200' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700', icon: 'text-violet-500', badge: 'bg-violet-100 text-violet-700', ring: 'ring-violet-200' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-200' },
  };

  return (
    <Page>
      <PageHeader 
        title="Your Profile" 
        description="Manage your account details, security preferences, and setup progress." 
      />
      <PageContent>
      {/* ── Setup Progress Card ───────────────────────────────── */}
      <div className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border p-6 shadow-sm",
        allDone
          ? "bg-gradient-to-br from-emerald-50/30 to-surface-card border-emerald-200/50"
          : "bg-gradient-to-br from-amber-50/40 to-surface-card border-amber-200/50"
      )}>
        {/* Top accent line */}
        <div className={cn("absolute top-0 left-0 right-0 h-1", allDone ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-gradient-to-r from-amber-400 to-orange-400")} />

        <div className={cn("flex flex-col md:flex-row md:items-start justify-between gap-6", !allDone && "mb-6")}>
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={cn("p-2.5 rounded-[var(--radius-card)] border", allDone ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100")}>
              <Sparkles className={cn("w-5 h-5", allDone ? "text-emerald-500" : "text-amber-500")} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-bold text-text-primary tracking-tight">
                {allDone ? '🎉 Setup Complete!' : 'Getting Started'}
              </h2>
              <p className="text-[13px] text-text-secondary mt-1 leading-relaxed pr-4">
                {allDone
                  ? 'You\'ve completed all setup steps. Your AI-driven pipeline is fully activated.'
                  : 'Complete these steps to unlock the full power of ArchRevenue\'s AI sales engine.'}
              </p>
            </div>
          </div>

          {/* Progress ring */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-[56px] h-[56px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke={allDone ? '#10b981' : '#f59e0b'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(progress / 100) * 94.2} 94.2`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-bold text-text-primary">{progress}%</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Progress</p>
              <p className="text-[13px] font-semibold text-text-secondary">{completedCount}/{setupSteps.length} steps</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {!allDone && (
          <>
            <div className="mb-6">
          <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn("h-full rounded-full", allDone ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-amber-400 to-orange-400")}
            />
          </div>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {setupSteps.map((step, i) => {
            const c = colorMap[step.color];
            const StepIcon = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  "rounded-[var(--radius-card)] border p-4 transition-all",
                  step.isComplete
                    ? "bg-emerald-50/50 border-emerald-100"
                    : `bg-surface-card border-border-default hover:border-border-hover hover:shadow-sm`
                )}
              >
                <div className="flex items-start gap-3 mb-3">
                  {step.isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <div className={cn("w-5 h-5 rounded-full border-2 border-border-default shrink-0 mt-0.5 flex items-center justify-center")}>
                      <span className="text-[10px] font-bold text-text-tertiary">{i + 1}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className={cn("text-[13px] font-semibold leading-tight mb-1", step.isComplete ? "text-emerald-600 line-through decoration-emerald-300" : "text-text-primary")}>
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-text-secondary leading-relaxed">{step.description}</p>
                  </div>
                </div>

                {!step.isComplete && (
                  <Link
                    to={step.actionLink}
                    className={cn("inline-flex items-center text-[11px] font-bold transition-all mt-1 px-2.5 py-1.5 rounded-lg", c.badge, "hover:opacity-80")}
                  >
                    {step.actionText}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        </>
        )}
      </div>

      {/* ── AI & Company Setup ────────────────────────────────── */}
      <div className="mt-6">
        <h2 className="text-[15px] font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Building className="w-4 h-4 text-text-secondary" />
          AI & Company Setup
        </h2>
        <div
          onClick={() => setShowProfileWizard(true)}
          className={cn(
            'intel-panel group cursor-pointer rounded-[var(--radius-card)] border p-6 transition-all duration-200 overflow-hidden relative shadow-sm',
            !!sellerProfile?.setupComplete || !!(sellerProfile?.companyName && sellerProfile?.primaryOffer)
              ? 'bg-surface-card border-border-default hover:border-blue-300'
              : 'bg-gradient-to-br from-amber-50 to-surface-card border-amber-200 hover:border-amber-300'
          )}
        >
          {/* Top accent */}
          <div className={cn('absolute top-0 left-0 right-0 h-[2px]', (!!sellerProfile?.setupComplete || !!(sellerProfile?.companyName && sellerProfile?.primaryOffer)) ? 'bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent' : 'bg-gradient-to-r from-transparent via-amber-400 to-transparent')} />

          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className={cn('p-3 rounded-[var(--radius-card)] border shrink-0', (!!sellerProfile?.setupComplete || !!(sellerProfile?.companyName && sellerProfile?.primaryOffer)) ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-200')}>
                <Building className={cn('w-5 h-5', (!!sellerProfile?.setupComplete || !!(sellerProfile?.companyName && sellerProfile?.primaryOffer)) ? 'text-indigo-500' : 'text-amber-500')} />
              </div>
              <div className={cn('flex items-center gap-1 text-[13px] font-semibold transition-colors shrink-0 mt-0.5', (!!sellerProfile?.setupComplete || !!(sellerProfile?.companyName && sellerProfile?.primaryOffer)) ? 'text-indigo-600 group-hover:text-indigo-700' : 'text-amber-600 group-hover:text-amber-700')}>
                {(!!sellerProfile?.setupComplete || !!(sellerProfile?.companyName && sellerProfile?.primaryOffer)) ? 'Edit' : 'Set Up Now'}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[15px] font-semibold text-text-primary">Company Profile</h3>
                {(!!sellerProfile?.setupComplete || !!(sellerProfile?.companyName && sellerProfile?.primaryOffer)) ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                    Action Needed
                  </span>
                )}
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Company details, offer, ICP, and AI outreach preferences. Used by AI in every score, outreach, and analysis.
              </p>
              {(!!sellerProfile?.setupComplete || !!(sellerProfile?.companyName && sellerProfile?.primaryOffer)) && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[11px] text-text-secondary">
                  {sellerProfile?.companyName && <span className="font-semibold text-text-primary">{sellerProfile.companyName}</span>}
                  {sellerProfile?.industry && <span>· {sellerProfile.industry}</span>}
                  {sellerProfile?.tone && <span>· {sellerProfile.tone} tone</span>}
                  {sellerProfile?.targetIndustry && <span>· ICP: {sellerProfile.targetIndustry}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Account & Security ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Basic Info */}
        <div className="bg-surface-card border border-border-default shadow-sm rounded-[var(--radius-card)] p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 rounded-[var(--radius-card)] bg-blue-50 border border-blue-100">
              <User className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-[15px] font-semibold text-text-primary">Basic Information</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shrink-0">
                <div className="w-full h-full bg-surface-card rounded-full flex items-center justify-center overflow-hidden">
                  {auth.currentUser?.photoURL ? (
                    <img src={auth.currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-blue-500">
                      {displayName
                        ? displayName.substring(0, 2).toUpperCase()
                        : (auth.currentUser?.email?.split('@')[0]?.substring(0, 2).toUpperCase() || '??')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Account ID</p>
                <p className="text-[11px] text-text-secondary font-mono truncate">{auth.currentUser?.uid}</p>
              </div>
            </div>

            <AppInput
              label="Display Name"
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="John Doe"
            />

            <AppInput
              label="Email Address"
              type="email"
              value={auth.currentUser?.email || ''}
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Email address cannot be changed."
            />

            <div className="pt-2">
              <AppButton
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={loading}
              >
                Save Profile
              </AppButton>
            </div>
          </form>
        </div>

        {/* Security */}
        <div className="bg-surface-card border border-border-default shadow-sm rounded-[var(--radius-card)] p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 rounded-[var(--radius-card)] bg-surface-secondary border border-border-default">
              <Shield className="w-4 h-4 text-text-secondary" />
            </div>
            <h2 className="text-[15px] font-semibold text-text-primary">Security</h2>
          </div>

          {auth.currentUser?.providerData.some(p => p.providerId === 'google.com') && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-[var(--radius-card)] flex items-start space-x-3">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-[13px] font-semibold text-amber-700">Google Authentication</h3>
                <p className="text-[12px] text-amber-600 mt-1 leading-relaxed">
                  You are logged in via Google. You do not need to set a password unless you wish to detach your Google account.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <AppInput
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <AppInput
              label="New Password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Key className="w-4 h-4" />}
            />

            <div className="pt-2">
              <AppButton
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={loading || !currentPassword || !newPassword}
                isLoading={loading}
              >
                Update Password
              </AppButton>
            </div>
          </form>
        </div>
      </div>
      </PageContent>
      {/* Company Profile Wizard */}
      {showProfileWizard && (
        <CompanyProfileWizard
          isOpen={showProfileWizard}
          onComplete={(profile: any) => { setSellerProfile(profile); setShowProfileWizard(false); }}
          onSkip={() => setShowProfileWizard(false)}
          initialData={sellerProfile}
        />
      )}
    </Page>
  );
}
