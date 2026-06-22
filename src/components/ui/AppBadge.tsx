import React from 'react';
import { cn } from '../../lib/utils';

export interface AppBadgeProps extends React.ComponentProps<'span'> {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'primary';
  className?: string;
  children: React.ReactNode;
}

export function AppBadge({
  children,
  className,
  variant = 'neutral',
  ...props
}: AppBadgeProps) {
  const variants = {
    neutral: "bg-surface-secondary text-text-secondary border-border-default",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    primary: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-2.5 py-0.5 rounded-badge text-[11px] font-semibold tracking-wide border uppercase shrink-0",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
