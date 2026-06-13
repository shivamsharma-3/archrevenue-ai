import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CreditCard, Sparkles, Check, Zap, ArrowRight, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTokenUsage } from '../hooks/useTokenUsage';

export default function BillingPage() {
  const { tokensUsed, limit, isLoading } = useTokenUsage();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const usagePercent = limit > 0 ? Math.min((tokensUsed / limit) * 100, 100) : 0;
  const isNearLimit = usagePercent > 80;

  const plans = [
    {
      name: 'Starter',
      price: '$49',
      period: '/mo',
      tokens: '50k Tokens/mo',
      features: ['Basic AI Scoring', 'Standard Outreach', 'Email Support'],
      current: true
    },
    {
      name: 'Pro',
      price: '$99',
      period: '/mo',
      tokens: '150k Tokens/mo',
      features: ['Advanced AI Intelligence', 'Automated Workflows', 'Priority Support', 'Custom Outreach Styles'],
      popular: true,
      current: false
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
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Billing & Usage</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your subscription, tokens, and payment methods.</p>
        </div>
        <button
          onClick={() => alert('Stripe Customer Portal integration coming soon.')}
          className="px-4 py-2 bg-white/[0.05] border border-white/[0.1] text-white text-sm font-semibold rounded-xl hover:bg-white/[0.1] transition-colors flex items-center space-x-2"
        >
          <CreditCard className="w-4 h-4" />
          <span>Manage Payments</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Token Usage Summary */}
        <div className="md:col-span-3 bg-gradient-to-br from-[#110a00] to-[#070400] border border-orange-500/20 rounded-[24px] p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.04] to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between relative z-10 mb-8">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">AI Token Quota</h2>
                <p className="text-sm text-zinc-400 mt-0.5">Your monthly intelligence budget</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <div className="text-3xl font-bold text-white font-mono tracking-tight">
                {isLoading ? '...' : tokensUsed.toLocaleString()} <span className="text-lg text-zinc-500 font-sans font-medium">/ {limit.toLocaleString()}</span>
              </div>
              <p className={cn("text-xs font-semibold mt-1", isNearLimit ? "text-orange-400" : "text-emerald-400")}>
                {isLoading ? 'Loading...' : `${(limit - tokensUsed).toLocaleString()} tokens remaining`}
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/[0.05] shadow-inner mb-3">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000 relative overflow-hidden",
                  isNearLimit ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"
                )}
                style={{ width: `${usagePercent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', transform: 'skewX(-20deg)' }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              <span>0</span>
              <span>{usagePercent.toFixed(1)}% Used</span>
              <span>{limit.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/[0.05] flex justify-end relative z-10">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-5 py-2.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold rounded-xl text-sm hover:bg-orange-500/20 transition-colors flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Buy More Tokens</span>
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        {plans.map((plan, i) => (
          <div 
            key={i} 
            className={cn(
              "bg-white/[0.03] border rounded-2xl p-6 relative flex flex-col transition-all duration-300",
              plan.current ? "border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)]" : "border-white/[0.07] hover:border-white/[0.15]",
              plan.popular ? "scale-105 z-10 bg-white/[0.05] shadow-2xl border-white/[0.15]" : ""
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 inset-x-0 flex justify-center">
                <span className="bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-sm font-medium text-zinc-500 ml-1">{plan.period}</span>
              </div>
              <p className="text-sm font-medium text-indigo-400 mt-2">{plan.tokens}</p>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, j) => (
                <div key={j} className="flex items-start space-x-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-300">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              className={cn(
                "w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center",
                plan.current 
                  ? "bg-white/[0.05] text-zinc-400 cursor-default border border-white/[0.05]" 
                  : plan.popular
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/[0.05]"
              )}
            >
              {plan.current ? 'Current Plan' : 'Upgrade Plan'}
            </button>
          </div>
        ))}
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-[#1c1c1f] border border-white/[0.08] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Buy Extra Tokens</h2>
            <p className="text-zinc-400 text-sm mb-6">Need more AI power this month? Purchase a one-time token pack.</p>
            
            <div className="space-y-3 mb-8">
              {[
                { tokens: '50,000', price: '$20' },
                { tokens: '200,000', price: '$50', popular: true },
                { tokens: '500,000', price: '$100' }
              ].map((pack, i) => (
                <div key={i} className={cn(
                  "p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors",
                  pack.popular ? "bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20" : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05]"
                )}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{pack.tokens}</p>
                      <p className="text-xs text-zinc-500">AI Tokens</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-lg text-white">{pack.price}</span>
                    {pack.popular && <span className="bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Popular</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => alert('Stripe checkout for token packs coming soon.')}
                className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
