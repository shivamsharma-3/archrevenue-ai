import React, { memo } from 'react';
import { Lead } from '../../lib/types';
import { AppCard } from '../ui/AppCard';
import { AppButton } from '../ui/AppButton';
import { Briefcase, Activity, Check, Target, TrendingUp, Building, Zap, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CompanyIntelligenceGraphProps {
  lead: Lead;
  isPanel?: boolean;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

export const CompanyIntelligenceGraph = memo(({ lead, isPanel = false, onGenerate, isGenerating = false }: CompanyIntelligenceGraphProps) => {
  if (!lead.research) {
    return (
      <AppCard level={2} className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mb-4">
          <Briefcase className="w-7 h-7 text-teal-500" />
        </div>
        <div className="w-full max-w-[384px] mx-auto text-center">
          <p className="text-text-secondary mb-4 font-medium">
            {lead.website 
              ? "We haven't gathered company intelligence yet." 
              : "Add a website URL to the lead profile to enable gathering intelligence."}
          </p>
          {lead.website && onGenerate && (
            <AppButton variant="primary" onClick={onGenerate} disabled={isGenerating}>
              {isGenerating ? 'Gathering...' : 'Gather Intelligence'}
            </AppButton>
          )}
        </div>
      </AppCard>
    );
  }

  const { companyName, industry, summary, facts, growthSignals, painPoints, market } = lead.research;

  return (
    <AppCard level={1} className="flex flex-col gap-6 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-teal-600" />
          <h2 className="text-[16px] font-semibold text-text-primary">Company Intelligence</h2>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-1">{companyName || lead.company}</h3>
          <span className="text-sm text-teal-600 font-semibold">{industry}</span>
        </div>

        {/* Verified Facts Banner Grid */}
        <div className={cn("grid gap-4 p-5 bg-surface-secondary border border-border-default rounded-xl", isPanel ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4")}>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold block mb-1">Company Size</span>
            <span className="text-[13px] font-semibold text-text-primary">{facts?.employees?.value ? `${facts.employees.value} employees` : 'Unknown'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold block mb-1">Funding Stage</span>
            <span className="text-[13px] font-semibold text-text-primary">{facts?.fundingStage?.value || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold block mb-1">Technologies</span>
            <span className="text-[13px] font-semibold text-text-primary truncate block" title={facts?.technologies?.map(t => typeof t === 'string' ? t : t.value).join(', ') || 'None'}>
              {facts?.technologies?.slice(0, 2).map(t => typeof t === 'string' ? t : t.value).join(', ') || 'None detected'}
              {facts?.technologies && facts.technologies.length > 2 && '...'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold block mb-1">Target Segment</span>
            <span className="text-[13px] font-semibold text-text-primary block truncate">{lead.research.customerSegment || 'Unknown'}</span>
          </div>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-text-tertiary font-bold mb-2">Business Snapshot</h4>
          <p className="text-[14px] text-text-secondary leading-relaxed font-medium">{summary}</p>
        </div>
        
        <div className={cn("grid gap-4", isPanel ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
            <h5 className="text-[11px] uppercase font-bold text-emerald-600 tracking-[0.2em] mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" /> Growth Signals
            </h5>
            <ul className="space-y-3">
              {growthSignals.map((signal, i) => (
                <li key={i} className="text-[13px] text-emerald-900 font-medium flex items-start">
                  <Check className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 shrink-0" />{signal}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-red-50 rounded-xl p-5 border border-red-100">
            <h5 className="text-[11px] uppercase font-bold text-red-500 tracking-[0.2em] mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2" /> Key Pain Points
            </h5>
            <ul className="space-y-3">
              {painPoints.map((point, i) => (
                <li key={i} className="text-[13px] text-red-900 font-medium flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-3 mt-2 shrink-0" />{point}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Market Position */}
        {market?.competitors && market.competitors.length > 0 && (
          <div>
            <h4 className="text-[11px] uppercase tracking-wider text-text-tertiary font-bold mb-3 flex items-center">
              <Building className="w-3.5 h-3.5 mr-2" /> Market Competitors
            </h4>
            <div className="flex flex-wrap gap-2">
              {market.competitors.map((comp, i) => (
                <span key={i} className="text-[12px] font-semibold bg-surface-secondary border border-border-default px-3 py-1.5 rounded-lg text-text-primary">
                  {comp}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppCard>
  );
});

CompanyIntelligenceGraph.displayName = 'CompanyIntelligenceGraph';
