import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building, Target, Users, Settings, X, ChevronRight, Sparkles } from 'lucide-react';
import { SellerProfile } from '../lib/types';
import { saveProfile } from '../lib/profile';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

type Step = 'company' | 'offer' | 'icp' | 'preferences';

interface Props {
  isOpen: boolean;
  onComplete: (profile: SellerProfile) => void;
  onSkip?: () => void;       // Only shown when editing an existing profile
  initialData?: SellerProfile | null;
}

const pricingModels: SellerProfile['pricingModel'][] = [
  'Monthly Subscription', 'Annual Contract', 'Per Seat', 'Usage-based', 'One-time'
];
const tones: SellerProfile['tone'][] = ['Professional', 'Conversational', 'Direct', 'Consultative'];
const outreachStyles: SellerProfile['outreachStyle'][] = ['Cold Email', 'LinkedIn-first', 'Phone-first', 'Multi-channel'];
const companySizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'];

const steps: { id: Step; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'company',     label: 'Company',     icon: Building  },
  { id: 'offer',       label: 'Offer',        icon: Target    },
  { id: 'icp',         label: 'ICP',          icon: Users     },
  { id: 'preferences', label: 'Preferences',  icon: Settings  },
];

const stepColors: Record<Step, string> = {
  company:     'border-indigo-500 text-indigo-400',
  offer:       'border-violet-500 text-violet-400',
  icp:         'border-emerald-500 text-emerald-400',
  preferences: 'border-amber-500 text-amber-400',
};

const focusColors: Record<Step, string> = {
  company:     'focus:border-indigo-500/50',
  offer:       'focus:border-violet-500/50',
  icp:         'focus:border-emerald-500/50',
  preferences: 'focus:border-amber-500/50',
};

const inputCls = (step: Step) =>
  `block w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl ${focusColors[step]} focus:ring-0 focus:bg-white/[0.04] transition-all text-sm outline-none placeholder:text-zinc-600 text-white`;

const selectCls = (step: Step) =>
  `block w-full px-4 py-3 bg-[#121214] border border-white/[0.08] rounded-xl ${focusColors[step]} focus:ring-0 transition-all text-sm outline-none text-white appearance-none`;

export default function CompanyProfileWizard({ isOpen, onComplete, onSkip, initialData }: Props) {
  const [activeStep, setActiveStep] = useState<Step>('company');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<SellerProfile>>({});
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    if (initialData) {
      setProfile(initialData);
    } else {
      setProfile({});
    }
    setActiveStep('company');
    setDontShowToday(false);
  }, [initialData, isOpen]);

  const handleSkip = () => {
    if (dontShowToday) {
      localStorage.setItem('hideCompanyProfileWizardDate', new Date().toDateString());
    }
    if (onSkip) onSkip();
  };

  const update = (field: keyof SellerProfile, value: any) =>
    setProfile(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!auth.currentUser) return;
    if (!profile.companyName?.trim()) { alert('Company name is required.'); return; }
    if (!profile.primaryOffer?.trim()) { alert('Primary offer is required.'); return; }

    setSaving(true);
    try {
      const data: SellerProfile = {
        companyName:       profile.companyName   || '',
        primaryOffer:      profile.primaryOffer  || '',
        website:           profile.website,
        industry:          profile.industry,
        description:       profile.description,
        offerDescription:  profile.offerDescription,
        pricingModel:      profile.pricingModel,
        startingPrice:     profile.startingPrice,
        targetIndustry:    profile.targetIndustry,
        targetCompanySize: profile.targetCompanySize,
        targetRevenueRange: profile.targetRevenueRange,
        targetGeography:   profile.targetGeography,
        tone:              profile.tone,
        outreachStyle:     profile.outreachStyle,
        ctaStyle:          profile.ctaStyle,
        setupComplete:     true,
      };
      await saveProfile(auth.currentUser.uid, data);
      onComplete(data);
    } catch (err: any) {
      alert('Failed to save profile: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === activeStep);

  const goNext = () => {
    const next = steps[currentStepIndex + 1];
    if (next) setActiveStep(next.id);
  };

  const goPrev = () => {
    const prev = steps[currentStepIndex - 1];
    if (prev) setActiveStep(prev.id);
  };

  if (!isOpen) return null;

  const isLastStep = currentStepIndex === steps.length - 1;
  const color = stepColors[activeStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-black border border-white/[0.08] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden font-sans flex flex-col max-h-[90vh]"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.04] flex justify-between items-start relative shrink-0">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-lg font-medium tracking-tight text-white font-display">
                  {initialData ? 'Edit Company Profile' : 'Set Up Your Company Profile'}
                </h2>
              </div>
              <p className="text-xs text-zinc-500">
                {initialData
                  ? 'Update your profile to improve AI outreach accuracy.'
                  : 'This is used by the AI in every score, outreach, and analysis. Set it once.'}
              </p>
            </div>
            {onSkip && (
              <button onClick={handleSkip} className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors bg-white/[0.02] hover:bg-white/[0.05]">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Step tabs */}
          <div className="flex border-b border-white/[0.04] shrink-0 bg-white/[0.01]">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isDone   = idx < currentStepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={cn(
                    "flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center border-b-2 transition-colors",
                    isActive
                      ? color
                      : isDone
                        ? "border-white/20 text-zinc-400"
                        : "border-transparent text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {step.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex flex-col flex-1 overflow-hidden relative">
            <div className="p-6 overflow-y-auto flex-1 space-y-5">

              {activeStep === 'company' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Company Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={profile.companyName || ''}
                      onChange={e => update('companyName', e.target.value)}
                      placeholder="Arch Revenues"
                      className={inputCls('company')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Website</label>
                      <input
                        type="url"
                        value={profile.website || ''}
                        onChange={e => update('website', e.target.value)}
                        placeholder="https://archrevenues.com"
                        className={inputCls('company')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Your Industry</label>
                      <input
                        type="text"
                        value={profile.industry || ''}
                        onChange={e => update('industry', e.target.value)}
                        placeholder="B2B SaaS / Revenue Intelligence"
                        className={inputCls('company')}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Company Description</label>
                    <textarea
                      value={profile.description || ''}
                      onChange={e => update('description', e.target.value)}
                      placeholder="What does your company do? Who do you help? How?"
                      rows={3}
                      className={`${inputCls('company')} resize-none`}
                    />
                  </div>
                </motion.div>
              )}

              {activeStep === 'offer' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Primary Offer <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={profile.primaryOffer || ''}
                      onChange={e => update('primaryOffer', e.target.value)}
                      placeholder="AI-powered lead scoring & outreach automation"
                      className={inputCls('offer')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Offer Description</label>
                    <textarea
                      value={profile.offerDescription || ''}
                      onChange={e => update('offerDescription', e.target.value)}
                      placeholder="Describe specifically what your offer does and the outcome it delivers for customers."
                      rows={3}
                      className={`${inputCls('offer')} resize-none`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Pricing Model</label>
                      <select
                        value={profile.pricingModel || ''}
                        onChange={e => update('pricingModel', e.target.value as SellerProfile['pricingModel'])}
                        className={selectCls('offer')}
                      >
                        <option value="">Select Model</option>
                        {pricingModels.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Starting Price</label>
                      <input
                        type="text"
                        value={profile.startingPrice || ''}
                        onChange={e => update('startingPrice', e.target.value)}
                        placeholder="$499/month"
                        className={inputCls('offer')}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStep === 'icp' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="px-4 py-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                    <p className="text-xs text-blue-400">The AI uses your ICP to evaluate whether a lead is a strong match — this directly affects scores and prioritization.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Target Industry</label>
                      <input
                        type="text"
                        value={profile.targetIndustry || ''}
                        onChange={e => update('targetIndustry', e.target.value)}
                        placeholder="B2B SaaS, Technology, Finance…"
                        className={inputCls('icp')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Target Company Size</label>
                      <select
                        value={profile.targetCompanySize || ''}
                        onChange={e => update('targetCompanySize', e.target.value)}
                        className={selectCls('icp')}
                      >
                        <option value="">Any size</option>
                        {companySizes.map(s => <option key={s} value={s}>{s} employees</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Target Revenue Range</label>
                      <input
                        type="text"
                        value={profile.targetRevenueRange || ''}
                        onChange={e => update('targetRevenueRange', e.target.value)}
                        placeholder="$1M-$20M ARR"
                        className={inputCls('icp')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Target Geography</label>
                      <input
                        type="text"
                        value={profile.targetGeography || ''}
                        onChange={e => update('targetGeography', e.target.value)}
                        placeholder="North America, EMEA…"
                        className={inputCls('icp')}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStep === 'preferences' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Communication Tone</label>
                      <div className="grid grid-cols-2 gap-2">
                        {tones.map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => update('tone', t)}
                            className={cn(
                              "px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center",
                              profile.tone === t
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : "bg-white/[0.02] text-zinc-400 border-white/[0.08] hover:bg-white/[0.06] hover:text-white"
                            )}
                          >{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Outreach Style</label>
                      <div className="grid grid-cols-1 gap-2">
                        {outreachStyles.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => update('outreachStyle', s)}
                            className={cn(
                              "px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center",
                              profile.outreachStyle === s
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : "bg-white/[0.02] text-zinc-400 border-white/[0.08] hover:bg-white/[0.06] hover:text-white"
                            )}
                          >{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Preferred CTA</label>
                    <input
                      type="text"
                      value={profile.ctaStyle || ''}
                      onChange={e => update('ctaStyle', e.target.value)}
                      placeholder="Book a 15-minute discovery call"
                      className={inputCls('preferences')}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/[0.04] bg-black/50 shrink-0 flex justify-between items-center">
            <div className="flex items-center space-x-6">
              {onSkip && !initialData && (
                <div className="flex items-center space-x-2 text-xs text-white">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={dontShowToday}
                      onChange={(e) => setDontShowToday(e.target.checked)}
                      className="w-4 h-4 rounded bg-black border border-white/[0.2] checked:bg-indigo-500 checked:border-indigo-500 focus:ring-0 focus:ring-offset-0 transition-colors appearance-none cursor-pointer"
                    />
                    {dontShowToday && (
                      <svg className="w-3 h-3 text-white absolute pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <span>Do not show this today</span>
                </div>
              )}
              <button
                type="button"
                onClick={goPrev}
                disabled={currentStepIndex === 0}
                className="px-4 py-2.5 bg-transparent text-zinc-400 rounded-xl text-sm font-medium hover:text-white transition-colors disabled:opacity-0"
              >
                Back
              </button>
            </div>
            <div className="flex space-x-3">
              {onSkip && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-5 py-2.5 bg-transparent text-zinc-500 rounded-xl text-sm font-medium hover:text-zinc-300 transition-colors"
                >
                  {initialData ? 'Cancel' : 'Do it later'}
                </button>
              )}
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-semibold hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center"
                >
                  {saving ? 'Saving...' : (initialData ? 'Save Changes' : 'Complete Setup')}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
