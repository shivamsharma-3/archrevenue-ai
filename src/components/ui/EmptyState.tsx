import React from 'react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps extends React.ComponentProps<'div'> {
  icon?: React.ReactNode;
  className?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "w-full flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-[24px] border border-border-default bg-surface-card shadow-sm relative overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.03] to-transparent pointer-events-none" />
      
      {icon && (
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
          <div className="relative w-16 h-16 rounded-2xl bg-surface-background border border-border-default flex items-center justify-center text-indigo-500 shadow-md">
            {icon}
          </div>
        </div>
      )}
      <h3 className="relative text-[18px] font-bold text-text-primary mb-3 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="relative text-[14px] text-text-secondary max-w-[420px] w-full mx-auto mb-8 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="relative z-10 w-full flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
