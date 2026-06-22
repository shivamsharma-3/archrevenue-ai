import React, { useState } from 'react';
import { SellerProfile, Lead } from '../lib/types';
import { CheckCircle2, Circle, ChevronRight, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

interface Props {
  sellerProfile: SellerProfile | null;
  leads: Lead[];
}

export function OnboardingChecklist({ sellerProfile, leads }: Props) {
  const [isDismissed, setIsDismissed] = useState(localStorage.getItem('onboardingDismissed') === 'true');

  const steps = [
    {
      id: 'profile',
      title: 'Complete Company Profile',
      description: 'Tell AI about your company to personalize outreach.',
      isComplete: !!(sellerProfile?.companyName && sellerProfile?.primaryOffer),
      actionText: 'Update Profile',
      actionLink: '/settings'
    },
    {
      id: 'first-lead',
      title: 'Add Your First Lead',
      description: 'Create a lead manually or import from a CSV file.',
      isComplete: leads.length > 0,
      actionText: 'Go to Leads',
      actionLink: '/leads'
    },
    {
      id: 'ai-score',
      title: 'Run AI Lead Score',
      description: 'Let AI analyze a lead and give you a confidence score.',
      isComplete: leads.some(l => l.aiAnalysis),
      actionText: 'View Pipeline',
      actionLink: '/pipeline'
    }
  ];

  const completedCount = steps.filter(s => s.isComplete).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  if (isDismissed || progress === 100) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mb-8 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md"
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <button 
          onClick={() => {
            setIsDismissed(true);
            localStorage.setItem('onboardingDismissed', 'true');
          }}
          className="absolute top-4 right-4 p-2 text-text-tertiary hover:text-text-primary bg-black/20 hover:bg-black/40 rounded-full transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col md:flex-row gap-8 relative z-10">
          <div className="md:w-1/3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Getting Started</h3>
            </div>
            <p className="text-sm text-text-tertiary mb-6 leading-relaxed">
              Complete these steps to unlock the full power of Arch Intel and set up your AI-driven sales process.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-teal-400">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-border-default">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-500 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step) => (
              <div key={step.id} className={cn(
                "p-4 rounded-2xl border transition-all relative overflow-hidden group",
                step.isComplete 
                  ? "bg-teal-500/5 border-teal-500/20" 
                  : "bg-black/40 border-border-default hover:border-teal-500/30"
              )}>
                {step.isComplete && (
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-teal-500/10 rounded-full blur-xl" />
                )}
                
                <div className="flex items-start gap-3 mb-3">
                  {step.isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-text-secondary shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className={cn("text-sm font-bold mb-1", step.isComplete ? "text-teal-400" : "text-text-primary")}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-text-tertiary leading-relaxed mb-4">
                      {step.description}
                    </p>
                  </div>
                </div>

                {!step.isComplete && (
                  <Link 
                    to={step.actionLink}
                    className="inline-flex items-center text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors ml-8"
                  >
                    {step.actionText} <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
