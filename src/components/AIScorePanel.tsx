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
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
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
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    ring: '#3b82f6',
    icon: Minus,
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.15)]',
  },
  Dead: {
    color: 'text-zinc-500',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/30',
    ring: '#71717a',
    icon: TrendingDown,
    glow: 'shadow-[0_0_40px_rgba(113,113,122,0.1)]',
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
        "relative bg-black border rounded-2xl p-6 overflow-hidden",
        cfg.border,
        cfg.glow
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative">
        <div className="flex items-center space-x-2">
          <Sparkles className={cn("w-4 h-4", cfg.color)} />
          <span className="text-sm font-semibold text-white tracking-tight">AI Lead Score</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors"
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
              className="text-3xl font-bold text-white tabular-nums leading-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {score.score}
            </motion.span>
            <span className="text-[10px] text-zinc-500 font-medium mt-0.5">/100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 mb-1 font-medium">Lead</p>
          <p className="text-base font-semibold text-white truncate mb-3">{leadName}</p>
          <div className={cn(
            "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border",
            cfg.bg, cfg.border, cfg.color
          )}>
            <CategoryIcon className="w-3 h-3 mr-1.5" />
            {score.category}
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="relative border-t border-white/[0.06] pt-4">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
          AI Analysis
        </p>
        <p className="text-[13px] text-zinc-300 leading-relaxed">{score.reason}</p>
      </div>
    </motion.div>
  );
}
