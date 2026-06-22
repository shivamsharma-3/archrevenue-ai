import React from 'react';
import { motion } from 'motion/react';
import { Lead } from '../lib/types';
import { cn } from '../lib/utils';

interface Props {
  lead: Lead;
  compact?: boolean;
}

interface Signal {
  icon: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}

function deriveSignals(lead: Lead): Signal[] {
  const signals: Signal[] = [];
  const r = lead.research;
  if (!r) return signals;

  // Hiring signals
  (r.hiringSignals ?? []).forEach((s) => {
    if (s && s.trim()) {
      signals.push({
        icon: '👥',
        label: s.length > 40 ? s.substring(0, 40) + '…' : s,
        color: 'text-teal-300',
        bg: 'bg-teal-500/10',
        border: 'border-teal-500/20',
      });
    }
  });

  // Growth signals
  (r.growthSignals ?? []).forEach((s) => {
    if (s && s.trim()) {
      const lc = s.toLowerCase();
      const isFunded = lc.includes('fund') || lc.includes('raised') || lc.includes('invest');
      signals.push({
        icon: isFunded ? '💰' : '📈',
        label: s.length > 40 ? s.substring(0, 40) + '…' : s,
        color: isFunded ? 'text-teal-300' : 'text-amber-300',
        bg: isFunded ? 'bg-teal-500/10' : 'bg-amber-500/10',
        border: isFunded ? 'border-teal-500/20' : 'border-amber-500/20',
      });
    }
  });

  // Urgency signal
  if (lead.urgency === 'High' || lead.urgency === 'Critical') {
    signals.push({
      icon: '🔥',
      label: `${lead.urgency} urgency`,
      color: 'text-red-300',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    });
  }

  // Business maturity
  if (r.businessMaturity && r.businessMaturity !== 'Unknown') {
    const matColor =
      r.businessMaturity === 'Enterprise' ? { color: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/20' } :
      r.businessMaturity === 'Mature'     ? { color: 'text-teal-300', bg: 'bg-teal-500/10', border: 'border-teal-500/20' } :
      r.businessMaturity === 'Growth'     ? { color: 'text-cyan-300',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20'   } :
      null;
    if (matColor) {
      signals.push({
        icon: '🏢',
        label: `${r.businessMaturity} stage company`,
        ...matColor,
      });
    }
  }

  // Pain points as signals (first 2)
  (r.painPoints ?? []).slice(0, 2).forEach((p) => {
    if (p && p.trim()) {
      signals.push({
        icon: '⚡',
        label: p.length > 40 ? p.substring(0, 40) + '…' : p,
        color: 'text-yellow-300',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
      });
    }
  });

  return signals.slice(0, compact ? 4 : 8);

  function compact() { return false; }
}

export default function OpportunitySignals({ lead, compact = false }: Props) {
  const signals = deriveSignals(lead);

  if (signals.length === 0) {
    return (
      <div className="text-xs text-text-secondary italic py-2">
        No signals detected — run AI analysis to surface opportunity signals.
      </div>
    );
  }

  const confidenceLabel = lead.research?.confidenceLevel ?? 'Low';
  const confidenceColor =
    confidenceLabel === 'High'   ? 'text-teal-400' :
    confidenceLabel === 'Medium' ? 'text-amber-400'   : 'text-text-tertiary';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-tertiary">
          Opportunity Signals
        </p>
        <span className={cn('text-[9px] font-bold uppercase tracking-wider', confidenceColor)}>
          {confidenceLabel} confidence
        </span>
      </div>
      <div className={cn('flex flex-wrap gap-1.5', compact ? 'gap-1' : 'gap-1.5')}>
        {signals.map((signal, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold',
              signal.bg,
              signal.border,
              signal.color
            )}
            title={signal.label}
          >
            <span className={compact ? 'text-xs' : 'text-sm'}>{signal.icon}</span>
            <span className={cn('leading-none', compact ? 'max-w-[100px]' : 'max-w-[160px]', 'truncate')}>
              {signal.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
