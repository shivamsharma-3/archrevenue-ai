import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building, Target, Users, Settings, X, ChevronRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import posthog from 'posthog-js';
import { SellerProfile } from '../lib/types';
import { saveProfile } from '../lib/profile';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

import { AppModal } from './ui/AppModal';
import { AppButton } from './ui/AppButton';
import { AppInput } from './ui/AppInput';

type Step = 'company' | 'offer' | 'icp' | 'preferences';

interface Props {
  isOpen: boolean;
  onComplete: (profile: SellerProfile) => void;
  onSkip?: () => void;       // Only shown when editing an existing profile
  initialData?: SellerProfile | null;
  defaultStep?: Step;
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

const selectCls = () =>
  `block w-full h-10 px-4 text-[13px] bg-surface-card border border-border-default rounded-input focus:ring-2 focus:ring-blue-100 focus:border-border-active hover:border-border-hover transition-all outline-none text-text-primary appearance-none`;

export default function CompanyProfileWizard({ isOpen, onComplete, onSkip, initialData, defaultStep }: Props) {
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
    setActiveStep(defaultStep || 'company');
    setDontShowToday(false);
  }, [initialData, isOpen, defaultStep]);

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
    if (!profile.companyName?.trim()) { toast.error('Company name is required.'); return; }
    if (!profile.primaryOffer?.trim()) { toast.error('Primary offer is required.'); return; }

    setSaving(true);
    try {
      const data: SellerProfile = {
        companyName:       profile.companyName   || '',
        primaryOffer:      profile.primaryOffer  || '',
        website:           profile.website || '',
        industry:          profile.industry || '',
        description:       profile.description || '',
        offerDescription:  profile.offerDescription || '',
        pricingModel:      profile.pricingModel,
        startingPrice:     profile.startingPrice || '',
        targetIndustry:    profile.targetIndustry || '',
        targetCompanySize: profile.targetCompanySize || '',
        targetRevenueRange: profile.targetRevenueRange || '',
        targetGeography:   profile.targetGeography || '',
        tone:              profile.tone,
        outreachStyle:     profile.outreachStyle,
        ctaStyle:          profile.ctaStyle || '',
        setupComplete:     true,
      };

      // Firestore crashes if ANY field is exactly undefined.
      Object.keys(data).forEach(key => {
        if ((data as any)[key] === undefined) {
          delete (data as any)[key];
        }
      });
      await saveProfile(auth.currentUser.uid, data);
      toast.success('Profile saved successfully!');
      posthog.capture('Wizard Completed', { industry: data.industry, pricingModel: data.pricingModel });
      onComplete(data);
    } catch (err: any) {
      toast.error('Failed to save profile: ' + (err.message || 'Unknown error'));
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

  return (
    <AppModal
      isOpen={isOpen}
      onClose={() => { if (onSkip) handleSkip(); }}
      maxWidth="lg"
      noPadding
    >
      <div className="flex flex-col h-full max-h-[85vh]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border-default flex justify-between items-start shrink-0 bg-surface-card">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h2 className="text-[16px] font-semibold tracking-tight text-text-primary">
                  {initialData ? 'Edit Company Profile' : 'Set Up Your Company Profile'}
                </h2>
              </div>
              <p className="text-[13px] text-text-secondary">
                {initialData
                  ? 'Update your profile to improve AI outreach accuracy.'
                  : 'This is used by the AI in every score, outreach, and analysis. Set it once.'}
              </p>
            </div>
            {onSkip && (
              <button onClick={handleSkip} className="p-1.5 text-text-tertiary hover:text-text-primary rounded-button transition-colors hover:bg-surface-hover">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Step tabs */}
          <div className="flex border-b border-border-default shrink-0 bg-surface-secondary">
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
                    "flex-1 py-3 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center border-b-2 transition-colors",
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : isDone
                        ? "border-emerald-400 text-emerald-600"
                        : "border-transparent text-text-tertiary hover:text-text-secondary"
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
            <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-surface-card">

              {activeStep === 'company' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <AppInput
                    label="Company Name *"
                    value={profile.companyName || ''}
                    onChange={e => update('companyName', e.target.value)}
                    placeholder="Arch Revenues"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <AppInput
                      label="Website"
                      type="url"
                      value={profile.website || ''}
                      onChange={e => update('website', e.target.value)}
                      placeholder="https://archrevenues.com"
                    />
                    <AppInput
                      label="Your Industry"
                      value={profile.industry || ''}
                      onChange={e => update('industry', e.target.value)}
                      placeholder="B2B SaaS / Revenue Intelligence"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Company Description</label>
                    <textarea
                      value={profile.description || ''}
                      onChange={e => update('description', e.target.value)}
                      placeholder="What does your company do? Who do you help? How?"
                      rows={3}
                      className="block w-full px-4 py-3 text-[13px] bg-surface-card border border-border-default rounded-input focus:ring-2 focus:ring-blue-100 focus:border-border-active hover:border-border-hover transition-all outline-none placeholder:text-text-tertiary text-text-primary resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {activeStep === 'offer' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <AppInput
                    label="Primary Offer *"
                    value={profile.primaryOffer || ''}
                    onChange={e => update('primaryOffer', e.target.value)}
                    placeholder="AI-powered lead scoring & outreach automation"
                  />
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Offer Description</label>
                    <textarea
                      value={profile.offerDescription || ''}
                      onChange={e => update('offerDescription', e.target.value)}
                      placeholder="Describe specifically what your offer does and the outcome it delivers for customers."
                      rows={3}
                      className="block w-full px-4 py-3 text-[13px] bg-surface-card border border-border-default rounded-input focus:ring-2 focus:ring-blue-100 focus:border-border-active hover:border-border-hover transition-all outline-none placeholder:text-text-tertiary text-text-primary resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Pricing Model</label>
                      <div className="relative">
                        <select
                          value={profile.pricingModel || ''}
                          onChange={e => update('pricingModel', e.target.value as SellerProfile['pricingModel'])}
                          className={selectCls()}
                        >
                          <option value="">Select Model</option>
                          {pricingModels.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-tertiary">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>
                    <AppInput
                      label="Starting Price"
                      value={profile.startingPrice || ''}
                      onChange={e => update('startingPrice', e.target.value)}
                      placeholder="$499/month"
                    />
                  </div>
                </motion.div>
              )}

              {activeStep === 'icp' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-[var(--radius-card)]">
                    <p className="text-[12px] text-blue-700">The AI uses your ICP to evaluate whether a lead is a strong match — this directly affects scores and prioritization.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <AppInput
                      label="Target Industry"
                      value={profile.targetIndustry || ''}
                      onChange={e => update('targetIndustry', e.target.value)}
                      placeholder="B2B SaaS, Technology, Finance…"
                    />
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Target Company Size</label>
                      <div className="relative">
                        <select
                          value={profile.targetCompanySize || ''}
                          onChange={e => update('targetCompanySize', e.target.value)}
                          className={selectCls()}
                        >
                          <option value="">Any size</option>
                          {companySizes.map(s => <option key={s} value={s}>{s} employees</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-tertiary">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <AppInput
                      label="Target Revenue Range"
                      value={profile.targetRevenueRange || ''}
                      onChange={e => update('targetRevenueRange', e.target.value)}
                      placeholder="$1M-$20M ARR"
                    />
                    <AppInput
                      label="Target Geography"
                      value={profile.targetGeography || ''}
                      onChange={e => update('targetGeography', e.target.value)}
                      placeholder="North America, EMEA…"
                    />
                  </div>
                </motion.div>
              )}

              {activeStep === 'preferences' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Communication Tone</label>
                      <div className="grid grid-cols-2 gap-2">
                        {tones.map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => update('tone', t)}
                            className={cn(
                              "px-3 py-2 rounded-button text-[12px] font-semibold border transition-all text-center",
                              profile.tone === t
                                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                                : "bg-surface-card text-text-secondary border-border-default hover:bg-surface-hover hover:text-text-primary"
                            )}
                          >{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Outreach Style</label>
                      <div className="grid grid-cols-1 gap-2">
                        {outreachStyles.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => update('outreachStyle', s)}
                            className={cn(
                              "px-3 py-2 rounded-button text-[12px] font-semibold border transition-all text-center",
                              profile.outreachStyle === s
                                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                                : "bg-surface-card text-text-secondary border-border-default hover:bg-surface-hover hover:text-text-primary"
                            )}
                          >{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <AppInput
                    label="Preferred CTA"
                    value={profile.ctaStyle || ''}
                    onChange={e => update('ctaStyle', e.target.value)}
                    placeholder="Book a 15-minute discovery call"
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-border-default bg-surface-secondary shrink-0 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {onSkip && !initialData && (
                <div className="flex items-center space-x-2 text-[12px] text-text-secondary">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={dontShowToday}
                      onChange={(e) => setDontShowToday(e.target.checked)}
                      className="w-4 h-4 rounded border-border-default checked:bg-blue-500 checked:border-blue-500 focus:ring-blue-400 focus:ring-offset-0 transition-colors cursor-pointer"
                    />
                  </div>
                  <span>Do not show this today</span>
                </div>
              )}
              <AppButton
                variant="ghost"
                onClick={goPrev}
                disabled={currentStepIndex === 0}
                className={currentStepIndex === 0 ? "opacity-0" : ""}
              >
                Back
              </AppButton>
            </div>
            <div className="flex space-x-3">
              {onSkip && (
                <AppButton variant="secondary" onClick={handleSkip}>
                  {initialData ? 'Cancel' : 'Do it later'}
                </AppButton>
              )}
              {!isLastStep ? (
                <>
                  <AppButton variant="secondary" onClick={handleSave} isLoading={saving}>
                    Save & Close
                  </AppButton>
                  <AppButton variant="primary" onClick={goNext} rightIcon={<ChevronRight className="w-4 h-4" />}>
                    Next
                  </AppButton>
                </>
              ) : (
                <AppButton variant="primary" onClick={handleSave} isLoading={saving}>
                  {initialData ? 'Save Changes' : 'Complete Setup'}
                </AppButton>
              )}
            </div>
          </div>
        </div>
    </AppModal>
  );
}
