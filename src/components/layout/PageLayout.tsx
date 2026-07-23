import React from 'react';
import { cn } from '../../lib/utils';

export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-h-screen bg-surface-background flex flex-col w-full", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  children
}: {
  title: string;
  description?: string;
  breadcrumbs?: React.ReactNode;
  children?: React.ReactNode; // For PageActions
}) {
  return (
    <div className="w-full bg-surface-header backdrop-blur-md border-b border-border-default sticky top-0 z-30 px-8 py-6 shrink-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
        <h1 className="text-[24px] font-semibold tracking-tight text-text-primary leading-none">
          {title}
        </h1>
        {description && (
          <p className="text-[13px] text-text-secondary mt-1 max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

export function PageActions({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function PageMetrics({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-8 pt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {children}
    </div>
  );
}

export function PageContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex-1 px-6 md:px-10 py-6 flex flex-col gap-6 w-full max-w-none", className)}>
      {children}
    </div>
  );
}

export function PageSection({
  title,
  description,
  children,
  className
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {(title || description) && (
        <div className="flex flex-col gap-1 px-1">
          {title && <h2 className="text-[16px] font-semibold text-text-primary">{title}</h2>}
          {description && <p className="text-[13px] text-text-secondary">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full border-t border-border-default bg-surface-card px-8 py-6 mt-auto shrink-0", className)}>
      {children}
    </div>
  );
}
