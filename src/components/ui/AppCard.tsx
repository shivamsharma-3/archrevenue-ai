import React from 'react';
import { cn } from '../../lib/utils';

export type AppCardProps = React.ComponentProps<'div'> & {
  children?: React.ReactNode;
  className?: string;
  level?: 1 | 2 | 3;
  hoverable?: boolean;
  noPadding?: boolean;
};

export function AppCard({
  children,
  className,
  level = 1,
  hoverable = false,
  noPadding = false,
  ...props
}: AppCardProps) {
  return (
    <div
      className={cn(
        "bg-surface-card rounded-card border border-border-default",
        !noPadding && "p-6 lg:p-8",
        level === 1 && "shadow-sm",
        level === 2 && "shadow-md bg-surface-background",
        level === 3 && "shadow-lg bg-surface-secondary",
        hoverable && "transition-all duration-100 ease-out hover:shadow-md hover:border-border-hover hover:-translate-y-[1px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
