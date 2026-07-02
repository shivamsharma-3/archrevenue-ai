import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, TrendingUp, TrendingDown, Minus, ChevronDown, CheckCircle2, AlertTriangle, Info, Globe, FileText } from 'lucide-react';
import { AIScore, AIScoreCategory, ScoringEvidence } from '../lib/types';
import { cn } from '../lib/utils';

interface AIScorePanelProps {
  score: AIScore & { evidence?: ScoringEvidence };
  leadName: string;
  onClose: () => void;
}

const categoryConfig: Record<AIScoreCategory, {
  color: string;
  bg: string;
  border: string;
  ring: string;
  icon: React.ElementType;
  glow: string;
  label: string;
}> = {
  Hot: {
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    ring: '#10b981',
    icon: TrendingUp,
    glow: 'shadow-[0_0_40px_rgba(16,185,129,0.12)]',
    label: 'Hot Opportunity',
  },
  Warm: {
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    ring: '#f59e0b',
    icon: TrendingUp,
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.12)]',
    label: 'Warm Lead',
  },
  Cold: {
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    ring: '#3b82f6',
    icon: Minus,
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.12)]',
    label: 'Cold Lead',
  },
  Dead: {
    color: 'text-text-tertiary',
    bg: 'bg-surface-hover',
    border: 'border-border-default',
    ring: '#71717a',
    icon: TrendingDown,
    glow: 'shadow-sm',
    label: 'Not a Fit',
  },
};

function ScoreMeter({ score, color }: { score: number; color: string }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const gap = circumference - progress;

  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="rotate-[-90deg]">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="9" />
      <motion.circle
        cx="60" cy="60" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: gap }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      />
    </svg>
  );
}

function EvidenceBullet({ positive, text }: { positive: boolean; text: string; key?: React.Key }) {
  return (
    <div className="flex items-start gap-2">
      {positive
        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
        : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
      }
      <span className={cn("text-[12px] leading-snug font-medium", positive ? "text-text-primary" : "text-text-secondary")}>{text}</span>
    </div>
  );
}

export default function AIScorePanel({ score, leadName, onClose }: AIScorePanelProps) {
  const cfg = categoryConfig[score.category] || categoryConfig['Cold'];
  const CategoryIcon = cfg.icon;
  const [showEvidence, setShowEvidence] = useState(false);

  const evidence = (score as any).evidence as ScoringEvidence | undefined;
  const confidence = evidence?.limitedConfidence ? Math.min(72, score.score + 5) : Math.min(97, score.score + 8);
  const websiteWeight = evidence?.websiteWeight ?? 70;
  const formWeight = evidence?.formWeight ?? 30;

  // Parse evidence signals into bullets
  const positives: string[] = [];
  const warnings: string[] = [];

  if (evidence) {
    if (evidence.growthSignal && evidence.growthSignal !== 'None detected') positives.push(`Growth signals: ${evidence.growthSignal}`);
    if (evidence.budgetSignal && evidence.budgetSignal !== 'Not provided') positives.push(`Budget stated: ${evidence.budgetSignal}`);
    if (evidence.buyingLikelihood?.startsWith('High')) positives.push(`Buying likelihood: ${evidence.buyingLikelihood.split(' – ')[0]}`);
    if (evidence.buyingLikelihood?.includes('ICP match')) positives.push('ICP match detected');
    if (evidence.buyingLikelihood?.includes('urgency')) positives.push('High urgency confirmed');
    if (websiteWeight >= 70 && !evidence.limitedConfidence) positives.push('Live website data (70% weight)');

    if (evidence.limitedConfidence) warnings.push('Limited confidence — website data unavailable');
    if (evidence.budgetSignal === 'Not provided') warnings.push('No budget stated');
    if (evidence.maturitySignal?.includes('Unknown')) warnings.push('Business maturity unclear');
    if (evidence.growthSignal === 'None detected') warnings.push('No growth signals detected');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative bg-surface-card border rounded-[var(--radius-card)] overflow-hidden",
        cfg.border,
        cfg.glow
      )}
    >
      {/* Top accent bar */}
      <div className={cn("h-[3px] w-full", `bg-gradient-to-r from-transparent via-[${cfg.ring}] to-transparent`)} style={{ background: `linear-gradient(to right, transparent, ${cfg.ring}, transparent)` }} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <Sparkles className={cn("w-4 h-4", cfg.color)} />
            <span className="text-sm font-semibold text-text-primary tracking-tight">Revenue Opportunity Analysis</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score + Meter Row */}
        <div className="flex items-center gap-5 mb-5">
          <div className="relative flex-shrink-0">
            <ScoreMeter score={score.score} color={cfg.ring} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-3xl font-bold text-text-primary tabular-nums leading-none"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              >
                {score.score}
              </motion.span>
              <span className="text-[10px] text-text-tertiary font-medium mt-0.5">/100</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-text-tertiary font-medium mb-0.5">Lead</p>
            <p className="text-[15px] font-semibold text-text-primary truncate mb-3">{leadName}</p>
            <div className={cn("inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border mb-2", cfg.bg, cfg.border, cfg.color)}>
              <CategoryIcon className="w-3 h-3 mr-1.5" />
              {cfg.label}
            </div>
            {/* Confidence bar */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", score.category === 'Hot' ? 'bg-emerald-500' : score.category === 'Warm' ? 'bg-amber-500' : 'bg-blue-500')}
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 1, delay: 0.4 }}
                />
              </div>
              <span className="text-[11px] font-bold text-text-secondary whitespace-nowrap">{confidence}% confidence</span>
            </div>
          </div>
        </div>

        {/* Data Weight Pills */}
        <div className="flex gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100">
            <Globe className="w-3 h-3 text-indigo-500" />
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Website {websiteWeight}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-secondary border border-border-default">
            <FileText className="w-3 h-3 text-text-tertiary" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Form {formWeight}%</span>
          </div>
          {evidence?.limitedConfidence && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
              <Info className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Limited data</span>
            </div>
          )}
        </div>

        {/* AI Reasoning */}
        <div className="border-t border-border-default pt-4 mb-3">
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2">AI Reasoning</p>
          <p className="text-[13px] text-text-primary leading-relaxed">{score.reason}</p>
        </div>

        {/* Evidence Accordion */}
        {(positives.length > 0 || warnings.length > 0) && (
          <div className="border-t border-border-default pt-3">
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className="flex items-center justify-between w-full text-left group"
            >
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Why this score?
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-surface-secondary border border-border-default text-text-tertiary">
                  {positives.length + warnings.length} signals
                </span>
              </span>
              <ChevronDown className={cn("w-4 h-4 text-text-tertiary transition-transform duration-200", showEvidence && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showEvidence && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2">
                    {positives.map((p, i) => <EvidenceBullet key={i} positive={true} text={p} />)}
                    {warnings.map((w, i) => <EvidenceBullet key={i} positive={false} text={w} />)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border-default flex justify-between items-center text-[10px] text-text-tertiary font-medium">
          <span className="flex items-center"><Sparkles className="w-3 h-3 mr-1" /> arch-intel-v2</span>
          <span>~15 tokens used</span>
        </div>
      </div>
    </motion.div>
  );
}
