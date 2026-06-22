import React from 'react';
import { Target, Zap, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ChromeVariant = 'mission-briefing' | 'buying-signals';

interface ProductChromeProps {
  variant?: ChromeVariant;
  className?: string;
}

export function ProductChrome({ variant = 'mission-briefing', className }: ProductChromeProps) {
  return (
    <div className={cn("product-chrome-outer w-full", className)}>
      {/* Header Removed as requested */}
      
      <div className="p-5 md:p-6 bg-surface-card">
        {/* App Header Simulation */}
        <div className="flex justify-between items-center border-b border-border-default pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
            <span className="font-semibold text-[15px] tracking-wide">ArchRevenue</span>
          </div>
          <div className="text-[11px] uppercase tracking-widest text-text-tertiary font-mono">
            Monday, June 23
          </div>
        </div>

        {variant === 'mission-briefing' && <MissionBriefingView />}
        {variant === 'buying-signals' && <BuyingSignalsView />}

      </div>
    </div>
  );
}

function MissionBriefingView() {
  return (
    <div className="space-y-4">
      {/* Top Card - Hot Opportunity */}
      <div className="bg-surface-background border border-border-default p-5 relative">
        <div className="absolute top-0 left-0 w-[3px] h-full bg-text-primary" />
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-2">Priority Account</div>
            <h3 className="text-[22px] font-display font-medium text-text-primary">Meridian Health Group</h3>
          </div>
          <div className="text-right">
            <div className="text-[28px] font-display font-medium text-text-primary">87</div>
            <div className="text-[9px] text-text-tertiary uppercase tracking-widest">Score</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3 text-[14px]">
            <Zap className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <span className="text-text-primary font-medium block">VP of Revenue hired 12 days ago</span>
              <span className="text-text-secondary text-[13px] mt-1 block">Buying Window: Peak (closes in 9 days)</span>
            </div>
          </div>
          
          <div className="text-[13px] text-text-secondary leading-relaxed bg-surface-card border border-border-default p-4">
            Building enterprise GTM infrastructure post-hire.
          </div>
          
          <div className="pt-4">
            <div className="inline-flex items-center bg-text-primary text-surface-card text-[12px] font-medium px-4 py-2.5 cursor-default hover:bg-black transition-colors">
              Contact CFO · Reference Q3 expansion budget
            </div>
          </div>
        </div>
      </div>

      {/* Second Card - Watch List */}
      <div className="bg-surface-background border border-border-default p-4 opacity-80">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-[16px] font-display font-medium text-text-primary">Crestline Software</h3>
          <div className="text-[16px] font-display font-medium text-text-primary">64</div>
        </div>
        <div className="space-y-2 text-[13px]">
          <div className="flex items-center text-text-primary">
            <Activity className="w-4 h-4 mr-2 text-text-secondary" strokeWidth={1.5} />
            <span>Series A closed · $14M · 3 weeks ago</span>
          </div>
          <div className="text-text-secondary">Buying Window: Opening</div>
        </div>
      </div>
    </div>
  );
}

function BuyingSignalsView() {
  return (
    <div className="space-y-6">
      <div className="bg-surface-background border border-border-default p-6 md:p-8">
        <h3 className="text-[18px] font-display font-medium text-text-primary border-b border-border-default pb-4 mb-6">Signal Intel: NovaBridge Consulting</h3>
        
        <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-[15px] before:w-px before:bg-border-default">
          
          <div className="relative pl-14">
            <div className="absolute left-0 top-1 w-[32px] h-[32px] rounded-none bg-surface-card border border-border-default flex items-center justify-center z-10">
              <Zap className="w-4 h-4 text-text-primary" strokeWidth={1.5} />
            </div>
            <div className="text-[14px]">
              <div className="font-medium text-text-primary">Technology Migration Detected</div>
              <div className="text-text-secondary mt-1 leading-relaxed">Moving from Salesforce to HubSpot. Implementation phase likely active.</div>
              <div className="text-[11px] font-mono text-text-tertiary mt-2 uppercase tracking-widest">2 days ago</div>
            </div>
          </div>

          <div className="relative pl-14">
            <div className="absolute left-0 top-1 w-[32px] h-[32px] rounded-none bg-surface-card border border-border-default flex items-center justify-center z-10">
              <Activity className="w-4 h-4 text-text-primary" strokeWidth={1.5} />
            </div>
            <div className="text-[14px]">
              <div className="font-medium text-text-primary">Key Leadership Hire</div>
              <div className="text-text-secondary mt-1 leading-relaxed">Sarah Jenkins joined as VP of RevOps.</div>
              <div className="text-[11px] font-mono text-text-tertiary mt-2 uppercase tracking-widest">14 days ago</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
