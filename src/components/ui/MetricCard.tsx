import React from 'react';
import { AppCard } from './AppCard';
import { cn } from '../../lib/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number; // Percentage change
    label: string; // e.g., "vs last month"
  };
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, value, trend, icon, className }: MetricCardProps) {
  return (
    <AppCard className={cn("flex flex-col", className)}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-text-secondary">{title}</h3>
        {icon && <div className="text-text-tertiary">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-bold text-text-primary tracking-tight tabular-nums">
          {value}
        </span>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-[12px]">
          <span 
            className={cn(
              "font-medium",
              trend.value > 0 ? "text-emerald-600" : trend.value < 0 ? "text-rose-600" : "text-text-secondary"
            )}
          >
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-text-tertiary">{trend.label}</span>
        </div>
      )}
    </AppCard>
  );
}
