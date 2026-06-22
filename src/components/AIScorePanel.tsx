import React from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { AIScore, AIScoreCategory } from '../lib/types';
import { cn } from '../lib/utils';

interface AIScorePanelProps {
  score: AIScore;
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
}> = {
  Hot: {
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    ring: '#10b981',
    icon: TrendingUp,
    glow: 'shadow-[0_0_40px_rgba(16,185,129,0.15)]',
  },
  Warm: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    ring: '#f59e0b',
    icon: TrendingUp,
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.15)]',
  },
  Cold: {
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    ring: '#3b82f6',
    icon: Minus,
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.15)]',
  },
  Dead: {
    color: 'text-text-tertiary',
    bg: 'bg-surface-hover',
    border: 'border-border-default',
    ring: '#71717a',
    icon: TrendingDown,
    glow: 'shadow-sm',
  },
};

// SVG circular progress meter
function ScoreMeter({ score, color }: { score: number; color: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const gap = circumference - progress;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg]">
      {/* Track */}
      <circle
        cx="70" cy="70" r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="10"
      />
      {/* Progress */}
      <motion.circle
        cx="70" cy="70" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: gap }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      />
    </svg>
  );
}

export default function AIScorePanel({ score, leadName, onClose }: AIScorePanelProps) {
  const cfg = categoryConfig[score.category] || categoryConfig['Cold'];
  const CategoryIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative bg-surface-card border rounded-[var(--radius-card)] p-6 overflow-hidden",
        cfg.border,
        cfg.glow
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative">
        <div className="flex items-center space-x-2">
          <Sparkles className={cn("w-4 h-4", cfg.color)} />
          <span className="text-sm font-semibold text-text-primary tracking-tight">Revenue Opportunity</span>
          <span className="text-[10px] text-text-tertiary bg-surface-secondary px-1.5 py-0.5 rounded-[var(--radius-button)] border border-border-default">
            Last run: Just now
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Score + meter */}
      <div className="flex items-center space-x-6 mb-5">
        <div className="relative flex-shrink-0">
          <ScoreMeter score={score.score} color={cfg.ring} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-3xl font-bold text-text-primary tabular-nums leading-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {score.score}
            </motion.span>
            <span className="text-[10px] text-text-secondary font-medium mt-0.5">/100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-secondary mb-1 font-medium">Lead</p>
          <p className="text-base font-semibold text-text-primary truncate mb-3">{leadName}</p>
          <div className={cn(
            "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border",
            cfg.bg, cfg.border, cfg.color
          )}>
            <CategoryIcon className="w-3 h-3 mr-1.5" />
            {score.category}
          </div>
          <div className="mt-2 text-[11px] font-medium text-text-secondary flex items-center space-x-2">
            <span className="flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5 animate-pulse" />
              {Math.min(98, score.score + 7)}% Confidence
            </span>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="relative border-t border-border-default pt-4">
        <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-2">
          AI Analysis
        </p>
        <p className="text-[13px] text-text-primary leading-relaxed">{score.reason}</p>
        <div className="mt-4 pt-3 border-t border-border-default flex justify-between items-center text-[10px] text-text-tertiary font-medium">
          <span className="flex items-center"><Sparkles className="w-3 h-3 mr-1" /> Model: arch-intel-v2</span>
          <span>Cost: 15 Tokens</span>
        </div>
      </div>
    </motion.div>
  );
}
