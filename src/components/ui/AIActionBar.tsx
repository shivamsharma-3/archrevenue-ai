import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export interface AIAction {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  title?: string;
}

interface AIActionBarProps {
  actions: AIAction[];
  label?: string;
  className?: string;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm hover:shadow-md',
  secondary: 'bg-surface-card hover:bg-surface-hover text-text-primary border-border-default hover:border-border-hover',
  ghost: 'bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary border-transparent',
  danger: 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 hover:border-rose-300',
};

export function AIActionBar({ actions, label, className }: AIActionBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: 0.15 }}
      className={cn("flex flex-wrap items-center gap-2 pt-4 border-t border-border-default", className)}
    >
      {label && (
        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest w-full mb-1">
          {label}
        </span>
      )}
      {actions.map((action, i) => {
        const Icon = action.icon;
        const variant = action.variant ?? 'secondary';
        return (
          <button
            key={i}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.title ?? action.label}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed",
              variantStyles[variant]
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {action.label}
          </button>
        );
      })}
    </motion.div>
  );
}
