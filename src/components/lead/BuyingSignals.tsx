import React, { memo } from 'react';
import { Lead } from '../../lib/types';
import { AppCard } from '../ui/AppCard';
import { Zap, Activity, AlertTriangle, Target } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BuyingSignals = memo(({ lead, isPanel = false }: { lead: Lead, isPanel?: boolean }) => {
  if (!lead.research?.signals && !lead.aiAnalysis?.evidence) return null;

  const buyingSignals = lead.research?.signals?.buying || [];
  const likelihood = lead.aiAnalysis?.evidence?.buyingLikelihood || 'Unknown';
  const confidence = lead.aiAnalysis?.score || 0;

  return (
    <AppCard level={1}>
      <div className="flex items-center gap-2 mb-6 border-b border-border-default pb-4">
        <Zap className="w-5 h-5 text-amber-500" />
        <h2 className="text-[16px] font-semibold text-text-primary">Buying Signals & Intent</h2>
      </div>

      <div className={cn("grid gap-8", isPanel ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary mb-4">Detected Signals</h3>
          {buyingSignals.length > 0 ? (
            <ul className="space-y-3">
              {buyingSignals.map((sig, i) => (
                <li key={i} className="text-[13px] text-text-secondary flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  {sig}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-[13px] text-text-tertiary">
              <Activity className="w-4 h-4" />
              <span>No explicit buying signals detected recently.</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary mb-2">Buying Likelihood</h3>
            <p className={`text-[15px] font-semibold ${likelihood.includes('High') ? 'text-emerald-600' : likelihood.includes('Low') ? 'text-amber-600' : 'text-text-primary'}`}>
              {likelihood}
            </p>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary mb-2">Decision Confidence</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${confidence >= 75 ? 'bg-emerald-500' : confidence >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                  style={{ width: `${confidence}%` }} 
                />
              </div>
              <span className="text-[13px] font-bold text-text-primary w-10">{confidence}%</span>
            </div>
          </div>
          
          {confidence < 50 && (
            <div className="flex items-start gap-2 bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[12px] font-medium leading-relaxed">
                Momentum is currently low. Focus on nurturing and identifying new pain points before pushing for a decision.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppCard>
  );
});

BuyingSignals.displayName = 'BuyingSignals';
