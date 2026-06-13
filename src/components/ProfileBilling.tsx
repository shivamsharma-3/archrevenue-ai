import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, Zap, Check, ArrowRight, User, Mail, Database, ArrowLeft } from 'lucide-react';
import Shell from './Shell';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useTokenUsage } from '../hooks/useTokenUsage';
import { Link } from 'react-router-dom';

export default function ProfileBilling() {
  const user = auth.currentUser;
  const { tokensUsed, limit, isLoading } = useTokenUsage();

  // Determine current plan based on token limit
  const isStarter = limit <= 5000;
  const isPro = limit > 5000 && limit <= 50000;
  const isEnterprise = limit > 50000;

  const usagePercent = limit > 0 ? Math.min((tokensUsed / limit) * 100, 100) : 0;

  const plans = [
    {
      name: 'Starter',
      price: '$19',
      description: 'Perfect for individual sellers starting with AI outreach.',
      features: [
        '5,000 AI Tokens per month',
        'Basic Lead Intelligence',
        'Standard Email Generation',
        'Community Support'
      ],
      current: isStarter,
      buttonText: isStarter ? 'Current Plan' : 'Downgrade to Starter'
    },
    {
      name: 'Pro',
      price: '$49',
      description: 'Advanced capabilities for serious revenue professionals.',
      features: [
        '50,000 AI Tokens per month',
        'Deep Revenue Intelligence',
        'Priority AI Access (Fast generation)',
        'Advanced Analytics & Tracking',
        'Email & Calendar Integration'
      ],
      current: isPro,
      buttonText: isPro ? 'Current Plan' : 'Upgrade to Pro',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$199',
      description: 'Unlimited power for high-performing sales teams.',
      features: [
        'Unlimited AI Tokens',
        'Custom AI Model Fine-Tuning',
        'Dedicated Success Manager',
        'Custom CRM Integrations',
        'SLA & 24/7 Phone Support'
      ],
      current: isEnterprise,
      buttonText: isEnterprise ? 'Current Plan' : 'Upgrade to Enterprise'
    }
  ];

  return (
    <Shell hideSidebar={true}>
      <div className="p-4 md:p-8 lg:p-12 lg:px-16 z-10 relative max-w-[1400px] mx-auto min-h-screen">
        <header className="mb-10">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-bold text-zinc-400 hover:text-white mb-6 transition-colors group">
            <div className="p-2 bg-white/[0.05] rounded-lg mr-3 group-hover:bg-white/[0.1] transition-colors border border-white/[0.05]">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 drop-shadow-lg">
            Profile & Billing
          </h1>
          <p className="text-zinc-400 font-medium">Manage your account details and subscription plans.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="xl:col-span-1 space-y-8">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-[24px] p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/20">
                    <div className="w-full h-full bg-[#0a0a0b] rounded-2xl flex items-center justify-center text-xl font-bold text-white">
                      {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight truncate max-w-[200px]">{user?.displayName || user?.email?.split('@')[0] || 'User'}</h2>
                    <p className="text-sm text-zinc-400 font-medium flex items-center mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      {isEnterprise ? 'Enterprise' : isPro ? 'Pro' : 'Starter'} Plan Active
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-black/40 rounded-xl border border-white/[0.05]">
                    <div className="flex items-center text-zinc-400 mb-1">
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Email Address</span>
                    </div>
                    <p className="text-sm text-white font-medium pl-6 truncate">{user?.email || 'Not available'}</p>
                  </div>
                  <div className="p-4 bg-black/40 rounded-xl border border-white/[0.05]">
                    <div className="flex items-center text-zinc-400 mb-1">
                      <User className="w-4 h-4 mr-2" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Account ID</span>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono pl-6 truncate">{user?.uid || 'Not available'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Real Token Usage Widget */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 rounded-[24px] p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center space-x-2">
                   <Database className="w-5 h-5 text-indigo-400" />
                   <h3 className="text-sm font-bold text-white">AI Token Usage</h3>
                 </div>
                 {!isLoading && (
                   <span className="text-xs bg-white/[0.05] border border-white/[0.1] text-zinc-300 px-2 py-1 rounded-md font-semibold font-mono">
                     {tokensUsed.toLocaleString()} / {limit.toLocaleString()}
                   </span>
                 )}
               </div>
               
               <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/[0.05] mb-4">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${usagePercent}%` }}
                   transition={{ duration: 1, ease: "easeOut" }}
                   className={cn(
                     "h-full rounded-full bg-gradient-to-r",
                     usagePercent > 85 ? "from-amber-500 to-red-500" : "from-indigo-500 to-purple-500"
                   )}
                 />
               </div>
               <p className="text-xs text-zinc-400 font-medium">Tokens are used for AI scoring, research, and outreach generation. They reset at the beginning of each billing cycle.</p>
            </div>
          </div>

          {/* Pricing Plans Section */}
          <div className="xl:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={plan.name}
                  className={cn(
                    "relative rounded-[24px] p-6 flex flex-col border backdrop-blur-xl transition-all duration-300 group",
                    plan.popular ? "bg-white/[0.04] border-indigo-500/30 shadow-[0_20px_60px_rgba(99,102,241,0.15)]" : "bg-black/40 border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-indigo-500/30">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-between">
                      {plan.name}
                      {plan.name === 'Enterprise' && <Shield className="w-4 h-4 text-emerald-400" />}
                      {plan.name === 'Pro' && <Zap className="w-4 h-4 text-indigo-400" />}
                    </h3>
                    <div className="flex items-baseline mb-2">
                      <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                      <span className="text-sm text-zinc-500 ml-1 font-medium">/month</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium min-h-[40px]">{plan.description}</p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-sm text-zinc-300">
                        <Check className={cn("w-4 h-4 mr-3 shrink-0 mt-0.5", plan.popular ? "text-indigo-400" : "text-emerald-400")} />
                        <span className="font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    disabled={plan.current}
                    className={cn(
                      "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center group/btn",
                      plan.current 
                        ? "bg-white/[0.05] text-emerald-400 border border-emerald-500/30 cursor-default" 
                        : plan.popular 
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20"
                          : "bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1]"
                    )}
                  >
                    {plan.current && <Check className="w-4 h-4 mr-2" />}
                    {plan.buttonText}
                    {!plan.current && <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

