import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CreditCard, Sparkles, Check, Zap, ArrowRight, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTokenUsage } from '../hooks/useTokenUsage';
import toast from 'react-hot-toast';
import { Page, PageHeader, PageActions, PageContent } from '../components/layout/PageLayout';
import { AppButton } from '../components/ui/AppButton';
import { AppModal } from '../components/ui/AppModal';
import { createPortalLink, createCheckoutSession, STRIPE_PRICING } from '../lib/stripe';
import { auth } from '../lib/firebase';

export default function BillingPage() {
  const { tokensUsed, limit, isLoading } = useTokenUsage();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTokenPackIndex, setSelectedTokenPackIndex] = useState(1);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const usagePercent = limit > 0 ? Math.min((tokensUsed / limit) * 100, 100) : 0;
  const isNearLimit = usagePercent > 80;
  const isFree = limit <= 50000;
  const isStarter = limit > 50000 && limit < 250000;
  const isPro = limit >= 250000;

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/forever',
      tokens: '50k Tokens/mo',
      model: '⚡ Llama 3.3 AI Engine',
      features: [
        'No Credit Card Required',
        'Executive Lead Scoring',
        'Cold Email Drafts',
        'Unlimited Lead Uploads',
        'Community Support'
      ],
      current: isFree,
      buttonText: isFree ? 'Current Plan' : 'Free Tier',
      free: true,
    },
    {
      name: 'Starter',
      price: billingCycle === 'annual' ? '$39' : '$49',
      period: '/mo',
      tokens: '100k Tokens/mo',
      model: '✨ Gemini 2.5 Flash Engine',
      features: [
        '✨ Gemini 2.5 Flash AI Engine',
        'Multi-Channel Outreach (Email + LinkedIn + Phone)',
        '100,000 AI Tokens / Month',
        'CSV Export & Bulk Imports',
        'Standard Email Support'
      ],
      current: isStarter,
      buttonText: isStarter ? 'Current Plan' : 'Upgrade to Starter'
    },
    {
      name: 'Pro',
      price: billingCycle === 'annual' ? '$79' : '$99',
      period: '/mo',
      tokens: '250k Tokens/mo',
      model: '✨ Gemini 2.5 Flash Engine',
      popular: true,
      features: [
        '✨ Gemini 2.5 Flash AI Engine',
        'AI Deal Coach & Objections Engine',
        'Unlimited Outreach Regeneration',
        '250,000 AI Tokens / Month',
        'Priority 24/7 Support'
      ],
      current: isPro,
      buttonText: isPro ? 'Current Plan' : 'Upgrade to Pro'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      tokens: 'Unlimited Tokens',
      model: 'Dedicated AI Pipeline',
      features: [
        'Dedicated AI Pipeline',
        'Custom AI Fine-tuning & ICP Prompts',
        'Dedicated Account Manager',
        'SLA Guarantee & White-glove Onboarding',
        'Custom Security Audit'
      ],
      current: false,
      buttonText: 'Contact Sales'
    }
  ];

  return (
    <Page>
      <PageHeader 
        title="Billing & Usage" 
        description="Manage your subscription, AI tokens, and enterprise plan options."
      >
        <PageActions>
          <AppButton 
            variant="secondary" 
            leftIcon={<CreditCard className="w-4 h-4" />} 
            onClick={async () => {
              try {
                await createPortalLink();
              } catch (err: any) {
                if (err.message.includes('not found') || err.message.includes('internal')) {
                  toast.error('You need an active subscription before you can manage payments.');
                } else {
                  toast.error('Failed to open customer portal: ' + err.message);
                }
              }
            }}
          >
            Manage Payments
          </AppButton>
        </PageActions>
      </PageHeader>

      <PageContent className="w-full space-y-8 pt-4">

        {/* Token Usage Summary */}
        <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-8 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-orange-50/20 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between relative z-10 mb-8">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-12 h-12 rounded-[var(--radius-card)] bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-text-primary tracking-tight">AI Token Quota</h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                    {isFree ? '⚡ Free Tier (Llama 3.3)' : '✨ Paid Tier (Gemini 2.5 Flash)'}
                  </span>
                </div>
                <p className="text-[13px] text-text-secondary mt-0.5">Your monthly AI intelligence allocation</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <div className="text-3xl font-bold text-text-primary font-mono tracking-tight">
                {isLoading ? '...' : tokensUsed.toLocaleString()} <span className="text-lg text-text-tertiary font-sans font-medium">/ {limit.toLocaleString()}</span>
              </div>
              <p className={cn("text-xs font-semibold mt-1", isNearLimit ? "text-orange-400" : "text-teal-600")}>
                {isLoading ? 'Loading...' : `${(limit - tokensUsed).toLocaleString()} tokens remaining`}
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <div className="h-4 bg-surface-hover rounded-full overflow-hidden border border-border-default shadow-inner mb-3">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000 relative overflow-hidden",
                  isNearLimit ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-teal-500 to-teal-400"
                )}
                style={{ width: `${usagePercent}%` }}
              >
                <div className="absolute inset-0 bg-surface-card/20 w-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', transform: 'skewX(-20deg)' }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
              <span>0</span>
              <span>{usagePercent.toFixed(1)}% Used</span>
              <span>{limit.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-border-default flex items-center justify-between relative z-10">
            <p className="text-[12px] text-text-secondary">
              Tokens reset on your monthly billing date. Need extra capacity today?
            </p>
            <AppButton
              variant="secondary"
              onClick={() => setShowUpgradeModal(true)}
              leftIcon={<Zap className="w-4 h-4 text-orange-400" />}
              className="border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-50 text-orange-600"
            >
              Buy Token Pack
            </AppButton>
          </div>
        </div>

        {/* Monthly / Annual Toggle */}
        <div className="flex flex-col items-center justify-center pt-4">
          <div className="bg-surface-secondary p-1 rounded-2xl border border-border-default flex items-center gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                "px-5 py-2 text-[13px] font-bold rounded-xl transition-all",
                billingCycle === 'monthly' ? "bg-white text-text-primary shadow-xs border border-border-default" : "text-text-secondary hover:text-text-primary"
              )}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={cn(
                "px-5 py-2 text-[13px] font-bold rounded-xl transition-all flex items-center gap-2",
                billingCycle === 'annual' ? "bg-white text-text-primary shadow-xs border border-border-default" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Subscription Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className={cn(
                "bg-surface-card border rounded-[var(--radius-card)] p-6 relative flex flex-col transition-all duration-300 shadow-xs",
                plan.current ? "border-teal-500 shadow-[0_0_24px_rgba(20,184,166,0.15)] ring-1 ring-teal-500" : "border-border-default hover:border-border-hover",
                plan.popular ? "bg-surface-secondary border-indigo-200 shadow-md" : ""
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 inset-x-0 flex justify-center">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
                  {plan.current && (
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full">Active</span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline">
                  <span className="text-3xl font-bold text-text-primary">{plan.price}</span>
                  <span className="text-[13px] font-medium text-text-secondary ml-1">{plan.period}</span>
                </div>

                <p className="text-[12px] font-semibold mt-2 text-indigo-600">{plan.model}</p>
                <p className="text-[12px] text-text-tertiary mt-0.5">{plan.tokens}</p>
              </div>

              <div className="flex-1 space-y-3.5 mb-6 border-t border-border-default pt-4">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-start space-x-2.5 text-[12px]">
                    <Check className={cn("w-4 h-4 shrink-0 mt-0.5", plan.popular ? "text-indigo-600" : "text-teal-500")} />
                    <span className="text-text-primary font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <AppButton 
                className="w-full mt-auto"
                variant={plan.popular ? "primary" : plan.current ? "secondary" : "secondary"}
                disabled={plan.current}
                onClick={async () => {
                  if (plan.name === 'Enterprise') {
                    toast.success('Our sales team will be in touch!');
                    return;
                  }
                  if (plan.name === 'Free') {
                    return;
                  }
                  try {
                    if (!auth.currentUser) throw new Error('Not authenticated');
                    
                    let priceId = '';
                    if (plan.name === 'Starter') priceId = STRIPE_PRICING.STARTER;
                    else if (plan.name === 'Pro') priceId = STRIPE_PRICING.PRO;
                    
                    if (priceId && priceId.includes('placeholder')) {
                      toast.error('Please configure real Stripe Price IDs in src/lib/stripe.ts', { duration: 5000 });
                      return;
                    }
                    
                    if (priceId) {
                      await createCheckoutSession(auth.currentUser.uid, priceId);
                    }
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to start checkout process');
                  }
                }}
              >
                {plan.buttonText}
              </AppButton>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border-default text-center">
          <div className="p-4 bg-surface-card rounded-xl border border-border-default">
            <span className="text-lg block mb-1">💳</span>
            <p className="text-[12px] font-bold text-text-primary">No Credit Card Required</p>
            <p className="text-[11px] text-text-secondary mt-0.5">Free tier is forever 100% free</p>
          </div>
          <div className="p-4 bg-surface-card rounded-xl border border-border-default">
            <span className="text-lg block mb-1">⚡</span>
            <p className="text-[12px] font-bold text-text-primary">Instant Activation</p>
            <p className="text-[11px] text-text-secondary mt-0.5">Upgrade unlocks immediately</p>
          </div>
          <div className="p-4 bg-surface-card rounded-xl border border-border-default">
            <span className="text-lg block mb-1">🔄</span>
            <p className="text-[12px] font-bold text-text-primary">Cancel Anytime</p>
            <p className="text-[11px] text-text-secondary mt-0.5">No lock-in or cancellation fees</p>
          </div>
          <div className="p-4 bg-surface-card rounded-xl border border-border-default">
            <span className="text-lg block mb-1">🔒</span>
            <p className="text-[12px] font-bold text-text-primary">Encrypted & Private</p>
            <p className="text-[11px] text-text-secondary mt-0.5">Bank-grade data isolation</p>
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-8 shadow-xs">
          <h3 className="text-lg font-bold text-text-primary mb-2">Detailed Feature Matrix</h3>
          <p className="text-[13px] text-text-secondary mb-6">Full technical comparison across all plan tiers.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-border-default text-text-tertiary font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-4">Feature</th>
                  <th className="pb-4">Free ($0)</th>
                  <th className="pb-4">Starter ($49/mo)</th>
                  <th className="pb-4 text-indigo-600">Pro ($99/mo)</th>
                  <th className="pb-4">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/60">
                <tr>
                  <td className="py-3.5 font-semibold text-text-primary">AI Engine Model</td>
                  <td className="py-3.5 text-text-secondary">⚡ Llama 3.3 (Groq)</td>
                  <td className="py-3.5 text-indigo-600 font-medium">✨ Gemini 2.5 Flash</td>
                  <td className="py-3.5 text-purple-600 font-bold">✨ Gemini 2.5 Flash</td>
                  <td className="py-3.5 text-text-primary font-semibold">Custom Fine-Tuned</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold text-text-primary">Monthly AI Tokens</td>
                  <td className="py-3.5 text-text-secondary">50,000</td>
                  <td className="py-3.5 text-text-primary font-medium">100,000</td>
                  <td className="py-3.5 text-text-primary font-bold">250,000</td>
                  <td className="py-3.5 text-text-primary font-semibold">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold text-text-primary">Executive Lead Scoring</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold text-text-primary">Cold Email Generation</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold text-text-primary">LinkedIn & Phone Scripts</td>
                  <td className="py-3.5 text-text-tertiary">🔒 Locked</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold text-text-primary">AI Revenue Strategy (Deal Coach)</td>
                  <td className="py-3.5 text-text-tertiary">🔒 Locked</td>
                  <td className="py-3.5 text-text-tertiary">🔒 Locked</td>
                  <td className="py-3.5 text-purple-600 font-bold">✓ Full Access</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold text-text-primary">CSV Export & Bulk Imports</td>
                  <td className="py-3.5 text-text-tertiary">Limited</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Unlimited</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Unlimited</td>
                  <td className="py-3.5 text-emerald-600 font-bold">✓ Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      <AppModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        maxWidth="md"
        noPadding
      >
        <div className="p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Buy Extra Tokens</h2>
          <p className="text-text-secondary text-[13px] mb-6">Need more AI power this month? Purchase a one-time token pack.</p>
          
          <div className="space-y-3 mb-8">
            {[
              { tokens: '50,000', price: '$20', id: STRIPE_PRICING.TOKEN_PACK_50K },
              { tokens: '200,000', price: '$50', popular: true, id: STRIPE_PRICING.TOKEN_PACK_200K },
              { tokens: '500,000', price: '$100', id: STRIPE_PRICING.TOKEN_PACK_500K }
            ].map((pack, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedTokenPackIndex(i)}
                className={cn(
                  "p-4 rounded-[var(--radius-card)] border flex items-center justify-between cursor-pointer transition-all",
                  selectedTokenPackIndex === i
                    ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 shadow-sm"
                    : pack.popular 
                      ? "bg-teal-50 border-teal-200 hover:bg-teal-100/50" 
                      : "bg-surface-secondary border-border-default hover:border-border-hover hover:bg-surface-hover"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    selectedTokenPackIndex === i ? "bg-indigo-500/10" : "bg-orange-500/10"
                  )}>
                    <Zap className={cn("w-5 h-5", selectedTokenPackIndex === i ? "text-indigo-600" : "text-orange-400")} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">{pack.tokens}</p>
                    <p className="text-[11px] text-text-secondary uppercase tracking-wider mt-0.5">AI Tokens</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-lg text-text-primary">{pack.price}</span>
                  {pack.popular && <span className="bg-teal-500 text-teal-950 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Popular</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <AppButton 
              variant="secondary"
              className="flex-1"
              onClick={() => setShowUpgradeModal(false)}
            >
              Cancel
            </AppButton>
            <AppButton 
              variant="primary"
              className="flex-1"
              isLoading={isCheckoutLoading}
              onClick={async () => {
                try {
                  setIsCheckoutLoading(true);
                  if (!auth.currentUser) throw new Error('Not authenticated');
                  
                  const packs = [
                    STRIPE_PRICING.TOKEN_PACK_50K,
                    STRIPE_PRICING.TOKEN_PACK_200K,
                    STRIPE_PRICING.TOKEN_PACK_500K
                  ];
                  const priceId = packs[selectedTokenPackIndex];
                  
                  if (priceId && priceId.includes('placeholder')) {
                    toast.error('Please configure real Stripe Price IDs in src/lib/stripe.ts', { duration: 5000 });
                    setIsCheckoutLoading(false);
                    return;
                  }
                  
                  await createCheckoutSession(auth.currentUser.uid, priceId);
                } catch (err: any) {
                  console.error('Stripe checkout error:', err);
                  toast.error('Failed to start checkout: ' + err.message);
                  setIsCheckoutLoading(false);
                }
              }}
            >
              Continue to Payment
            </AppButton>
          </div>
        </div>
      </AppModal>
      </PageContent>
    </Page>
  );
}
