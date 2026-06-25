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

  const usagePercent = limit > 0 ? Math.min((tokensUsed / limit) * 100, 100) : 0;
  const isNearLimit = usagePercent > 80;
  const isPro = limit >= 150000;

  const plans = [
    {
      name: 'Starter',
      price: '$49',
      period: '/mo',
      tokens: '50k Tokens/mo',
      features: ['14-Day Free Trial', 'Basic AI Scoring', 'Standard Outreach', 'Email Support'],
      current: !isPro,
      freeTrial: true
    },
    {
      name: 'Pro',
      price: '$99',
      period: '/mo',
      tokens: '150k Tokens/mo',
      features: ['Advanced AI Intelligence', 'Automated Workflows', 'Priority Support', 'Custom Outreach Styles'],
      popular: !isPro,
      current: isPro
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      tokens: 'Unlimited Tokens',
      features: ['Dedicated Account Manager', 'Custom AI Models', 'SLA Guarantee', 'White-glove Onboarding'],
      current: false
    }
  ];

  return (
    <Page>
      <PageHeader 
        title="Billing & Usage" 
        description="Manage your subscription, tokens, and payment methods."
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

      <PageContent className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">

        {/* Token Usage Summary */}
        <div className="md:col-span-3 bg-surface-card border border-border-default rounded-[var(--radius-card)] p-8 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-orange-50/20 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between relative z-10 mb-8">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-12 h-12 rounded-[var(--radius-card)] bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary tracking-tight">AI Token Quota</h2>
                <p className="text-[13px] text-text-secondary mt-0.5">Your monthly intelligence budget</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <div className="text-3xl font-bold text-text-primary font-mono tracking-tight">
                {isLoading ? '...' : tokensUsed.toLocaleString()} <span className="text-lg text-text-tertiary font-sans font-medium">/ {limit.toLocaleString()}</span>
              </div>
              <p className={cn("text-xs font-semibold mt-1", isNearLimit ? "text-orange-400" : "text-teal-500")}>
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
          
          <div className="mt-8 pt-6 border-t border-border-default flex justify-end relative z-10">
            <AppButton
              variant="secondary"
              onClick={() => setShowUpgradeModal(true)}
              leftIcon={<Zap className="w-4 h-4 text-orange-400" />}
              className="border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-50 text-orange-600"
            >
              Buy More Tokens
            </AppButton>
          </div>
        </div>

        {/* Subscription Plans */}
        {plans.map((plan, i) => (
          <div 
            key={i} 
            className={cn(
              "bg-surface-card border rounded-[var(--radius-card)] p-6 relative flex flex-col transition-all duration-300 shadow-sm",
              plan.current ? "border-teal-200 shadow-[0_0_30px_rgba(20,184,166,0.15)]" : "border-border-default hover:border-border-hover",
              plan.popular ? "scale-105 z-10 bg-surface-secondary shadow-lg border-border-active" : "",
              (plan as any).free ? "border-border-default bg-surface-hover/50" : ""
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 inset-x-0 flex justify-center">
                <span className="bg-teal-500 text-teal-950 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-bold text-text-primary">{plan.price}</span>
                <span className="text-[13px] font-medium text-text-secondary ml-1">{plan.period}</span>
              </div>
              <p className={cn("text-[13px] font-medium mt-2", (plan as any).free ? "text-text-secondary" : "text-teal-600")}>{plan.tokens}</p>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, j) => (
                <div key={j} className="flex items-start space-x-3 text-[13px]">
                  <Check className={cn("w-4 h-4 shrink-0 mt-0.5", feature === '14-Day Free Trial' ? "text-indigo-500" : "text-teal-500")} />
                  <span className={cn(
                    "text-text-primary",
                    feature === '14-Day Free Trial' && "font-bold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md -ml-2 shadow-sm border border-indigo-100/50"
                  )}>{feature}</span>
                </div>
              ))}
            </div>

            <AppButton 
              className="w-full"
              variant={plan.popular ? "primary" : "secondary"}
              disabled={plan.current}
              onClick={async () => {
                if (plan.name === 'Enterprise') {
                  toast.success('Our sales team will be in touch!');
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
                  toast.error('Failed to start checkout: ' + err.message);
                }
              }}
            >
              {plan.current ? 'Current Plan' : (plan as any).freeTrial ? 'Start 14-Day Trial' : 'Upgrade Plan'}
            </AppButton>
          </div>
        ))}
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
