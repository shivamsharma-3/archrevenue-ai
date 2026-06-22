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
        "w-full flex flex-col items-center justify-center p-12 text-center rounded-card border border-dashed border-border-default bg-surface-secondary/50",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-surface-card border border-border-default flex items-center justify-center mb-4 text-text-tertiary shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-[14px] font-semibold text-text-primary mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-[13px] text-text-secondary max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}
