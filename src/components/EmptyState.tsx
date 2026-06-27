import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction
}: EmptyStateProps) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center p-12 text-center bg-surface-card/[0.02] border border-border-default rounded-2xl shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-surface-secondary border border-border-default flex items-center justify-center mb-6 shadow-sm">
        <Icon className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-tertiary max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-text-primary text-sm font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
            >
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-5 py-2.5 bg-surface-hover hover:bg-slate-200 border border-border-default text-text-primary text-sm font-medium rounded-xl transition-all"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
