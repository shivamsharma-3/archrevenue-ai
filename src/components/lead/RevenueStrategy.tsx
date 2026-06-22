import React, { memo } from 'react';
import { Lead } from '../../lib/types';
import { AppCard } from '../ui/AppCard';
import { Target, Lightbulb, AlertTriangle, UserCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RevenueStrategyProps {
  lead: Lead;
  isPanel?: boolean;
}

export const RevenueStrategy = memo(({ lead, isPanel = false }: RevenueStrategyProps) => {
  const strategy = lead.dealCoach;

  if (!strategy) {
    return (
      <AppCard level={2} className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mb-4">
          <Target className="w-7 h-7 text-teal-500" />
        </div>
        <div className="w-full max-w-[384px] mx-auto text-center">
          <p className="text-text-secondary mb-4 font-medium">
            No AI strategy generated yet. Run the revenue strategy to get actionable insights on closing this deal.
          </p>
        </div>
      </AppCard>
    );
  }

  const { dealStrength, whyItWillClose, objections, decisionMaker, bestAngle, bestCta } = strategy;
  
  const strengthColor = dealStrength === 'Strong' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                        dealStrength === 'Moderate' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                        'text-red-600 bg-red-50 border-red-200';

  return (
    <AppCard level={1} className="flex flex-col gap-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
      
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-teal-600" />
          <h2 className="text-[16px] font-semibold text-text-primary">AI Revenue Strategy</h2>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className={`px-4 py-3 rounded-xl border font-bold flex items-center gap-3 w-max ${strengthColor}`}>
          <span className="text-lg">{dealStrength === 'Strong' ? '⚡' : dealStrength === 'Moderate' ? '⚖️' : '⚠️'}</span>
          <span className="text-[13px] uppercase tracking-wider">Deal Strength: {dealStrength}</span>
        </div>

        <div className={cn("grid gap-4", isPanel ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
          <div className="bg-surface-secondary rounded-xl p-5 border border-border-default flex flex-col gap-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-teal-600 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Why It Will Close
            </h4>
            <p className="text-[14px] text-text-secondary leading-relaxed font-medium">
              {whyItWillClose}
            </p>
          </div>

          <div className="bg-red-50/50 rounded-xl p-5 border border-red-100 flex flex-col gap-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Likely Objections
            </h4>
            <ul className="space-y-2">
              {objections.map((obj, i) => (
                <li key={i} className="text-[13px] text-red-900 font-medium flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 shrink-0">•</span> {obj}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={cn("grid gap-4", isPanel ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3")}>
          <div className="bg-surface-secondary rounded-xl p-5 border border-border-default flex flex-col gap-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-500" /> Target Persona
            </h4>
            <p className="text-[13px] text-text-primary font-medium">{decisionMaker}</p>
          </div>

          <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100 flex flex-col gap-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <Target className="w-4 h-4" /> Best Messaging Angle
            </h4>
            <p className="text-[13px] text-indigo-900 font-semibold">{bestAngle}</p>
          </div>

          <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100 flex flex-col gap-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Best Call-To-Action
            </h4>
            <p className="text-[13px] text-emerald-900 font-bold">{bestCta}</p>
          </div>
        </div>
      </div>
    </AppCard>
  );
});

RevenueStrategy.displayName = 'RevenueStrategy';
