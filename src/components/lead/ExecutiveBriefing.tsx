import React, { memo } from 'react';
import { Lead } from '../../lib/types';
import { AppCard } from '../ui/AppCard';
import { AppButton } from '../ui/AppButton';
import { Brain, Zap, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ExecutiveBriefingProps {
  lead: Lead;
  isPanel?: boolean;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

export const ExecutiveBriefing = memo(({ lead, isPanel = false, onGenerate, isGenerating = false }: ExecutiveBriefingProps) => {
  if (!lead.aiAnalysis) {
    return (
      <AppCard level={2} className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center mb-4">
          <Brain className="w-7 h-7 text-violet-500" />
        </div>
        <div className="w-full max-w-[384px] mx-auto text-center">
          <p className="text-text-secondary mb-4 font-medium">
            No executive briefing available yet. Analyze this opportunity to generate a comprehensive AI strategy.
          </p>
          {onGenerate && (
            <AppButton variant="primary" onClick={onGenerate} disabled={isGenerating}>
              {isGenerating ? 'Analyzing...' : 'Analyze Opportunity'}
            </AppButton>
          )}
        </div>
      </AppCard>
    );
  }

  const { score, category, reason, recommendedAction, evidence, aiProvider, aiModel } = lead.aiAnalysis;
  const isHighPriority = score >= 75;

  return (
    <AppCard level={1} className="flex flex-col gap-6 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-600" />
          <h2 className="text-[16px] font-semibold text-text-primary">Executive Briefing</h2>
        </div>
        <div className="flex items-center">
          {aiProvider === 'gemini' ? (
            <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>{aiModel || 'Gemini 2.5 Flash'}</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-purple-600 text-white rounded-full ml-0.5">Paid</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{aiModel || 'Llama 3.3 (Groq)'}</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-full ml-0.5">Free</span>
            </div>
          )}
        </div>
      </div>

      <div className={cn("grid gap-4 md:gap-8", isPanel ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary mb-2">The Opportunity</h3>
            <p className="text-[14px] text-text-primary leading-relaxed font-medium">
              {reason}
            </p>
          </div>

          <div className="bg-surface-secondary rounded-xl p-5 border border-border-default">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Recommended Immediate Action</h3>
            <p className="text-[15px] text-indigo-900 font-semibold leading-relaxed">
              {recommendedAction}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-l border-border-default pl-8">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Buying Potential</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-[24px] font-bold ${isHighPriority ? 'text-emerald-600' : 'text-amber-600'}`}>
                {category}
              </span>
            </div>
            <p className="text-[12px] text-text-secondary mt-1">
              AI Confidence Score: {score}/100
            </p>
          </div>

          {evidence && (
            <div className="mt-2 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary block border-b border-border-default pb-2">Supporting Evidence</span>
              <ul className="space-y-2">
                <li className="text-[12px] text-text-secondary flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-text-tertiary shrink-0" />
                  Budget Signal: {evidence.budgetSignal || 'Unknown'}
                </li>
                <li className="text-[12px] text-text-secondary flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-text-tertiary shrink-0" />
                  Growth: {evidence.growthSignal || 'Stable'}
                </li>
                <li className="text-[12px] text-text-secondary flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-text-tertiary shrink-0" />
                  Buying Likelihood: {evidence.buyingLikelihood || 'Unknown'}
                </li>
              </ul>
              {evidence.limitedConfidence && (
                <div className="mt-3 text-[11px] bg-amber-50 text-amber-700 px-2 py-1.5 rounded border border-amber-200">
                  ⚠️ Limited data confidence.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppCard>
  );
});

ExecutiveBriefing.displayName = 'ExecutiveBriefing';
