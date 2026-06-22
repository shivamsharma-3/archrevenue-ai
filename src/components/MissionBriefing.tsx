import React, { useMemo } from 'react';
import { Lead, SellerProfile, CompanyIntelligenceRecord } from '../lib/types';
import { buildMissionBriefing, LeadIntelligenceSummary } from '../lib/opportunityEngine';
import { AppCard } from './ui/AppCard';
import { AppBadge } from './ui/AppBadge';
import { AppButton } from './ui/AppButton';
import { getFollowUpStatus } from '../lib/utils';
import { 
  Sparkles, AlertTriangle, TrendingUp, Target, 
  ArrowRight, Flame, Clock, Brain 
} from 'lucide-react';

interface MissionBriefingProps {
  leads: Lead[];
  sellerProfile: SellerProfile | null;
  onLeadClick: (lead: Lead) => void;
  userName?: string;
  overdueCount: number;
  dueTodayCount: number;
}

export default function MissionBriefing({ 
  leads, 
  sellerProfile, 
  onLeadClick, 
  userName = 'Founder',
  overdueCount,
  dueTodayCount
}: MissionBriefingProps) {
  const briefing = useMemo(() => {
    const summaries: LeadIntelligenceSummary[] = leads
      .filter(l => l.research && l.status !== 'lost')
      .map(l => {
        const record = l.research as CompanyIntelligenceRecord;
        return {
          record,
          events: record.activeEvents || [],
          leadName: l.fullName,
        };
      });

    return buildMissionBriefing(summaries, userName, sellerProfile);
  }, [leads, sellerProfile, userName]);

  const domainToLead = useMemo(() => {
    const map = new Map<string, Lead>();
    leads.forEach(l => {
      const domain = l.research?.domain || l.website || l.company || '';
      if (domain) map.set(domain, l);
    });
    return map;
  }, [leads]);

  const topOpportunity = briefing.hotOpportunities[0];
  const biggestRisk = briefing.coolingOpportunities[0];
  const peakBuyingWindows = briefing.hotOpportunities.filter(o => o.buyingWindow.status === 'Peak').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. Executive Summary */}
      <AppCard className="flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-text-secondary" />
          <h2 className="text-[16px] font-semibold text-text-primary">Executive Summary</h2>
        </div>
        <p className="text-[13px] text-text-secondary leading-relaxed mb-6">
          Good morning, {briefing.userName}. You have <span className="font-semibold text-text-primary">${(briefing.estimatedRevenueUnlocked / 1000).toFixed(0)}K</span> of potential pipeline that changed overnight. 
          There are <span className="font-semibold text-text-primary">{peakBuyingWindows} accounts</span> entering peak buying windows today.
        </p>
        
        <div className="space-y-4 mt-auto">
          {topOpportunity && (
            <div className="flex items-start justify-between p-4 bg-surface-secondary rounded-xl border border-border-default">
              <div className="flex gap-3">
                <Target className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Top Priority</span>
                  <span className="text-[13px] font-medium text-text-primary">{topOpportunity.companyName || topOpportunity.companyDomain}</span>
                  <span className="text-[12px] text-text-secondary line-clamp-1">{topOpportunity.whatToDo}</span>
                </div>
              </div>
              <AppButton 
                variant="primary" 
                size="sm" 
                onClick={() => {
                  const l = domainToLead.get(topOpportunity.companyDomain);
                  if (l) onLeadClick(l);
                }}
              >
                Review
              </AppButton>
            </div>
          )}
        </div>
      </AppCard>

      {/* 2. Today's Priorities */}
      <AppCard className="flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-text-secondary" />
          <h2 className="text-[16px] font-semibold text-text-primary">Today's Priorities</h2>
        </div>
        
        <div className="flex flex-col gap-3">
          {overdueCount > 0 ? (
            <div className="flex items-center justify-between p-3 border border-border-default rounded-xl hover:border-border-hover transition-colors">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span className="text-[13px] font-medium text-text-primary">{overdueCount} Overdue Follow-ups</span>
              </div>
              <AppButton variant="danger" size="sm">Resolve Now</AppButton>
            </div>
          ) : dueTodayCount > 0 ? (
            <div className="flex items-center justify-between p-3 border border-border-default rounded-xl hover:border-border-hover transition-colors">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-[13px] font-medium text-text-primary">{dueTodayCount} Follow-ups Due</span>
              </div>
              <AppButton variant="secondary" size="sm">View List</AppButton>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 border border-border-default rounded-xl bg-surface-secondary">
              <span className="text-[13px] text-text-secondary">No urgent follow-ups scheduled for today.</span>
            </div>
          )}

          {briefing.watchList.slice(0, 1).map((watch) => (
             <div key={watch.companyDomain} className="flex items-center justify-between p-3 border border-border-default rounded-xl hover:border-border-hover transition-colors">
             <div className="flex items-center gap-3 min-w-0">
               <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />
               <div className="flex flex-col truncate">
                 <span className="text-[13px] font-medium text-text-primary truncate">{watch.companyName || watch.companyDomain} is surging</span>
                 <span className="text-[12px] text-text-secondary truncate">{watch.reason}</span>
               </div>
             </div>
             <AppButton 
               variant="ghost" 
               size="sm"
               rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
               onClick={() => {
                 const l = domainToLead.get(watch.companyDomain);
                 if (l) onLeadClick(l);
               }}
             >
               View
             </AppButton>
           </div>
          ))}

          {biggestRisk && (
            <div className="flex items-center justify-between p-3 border border-border-default rounded-xl hover:border-border-hover transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle className="w-4 h-4 text-text-tertiary shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="text-[13px] font-medium text-text-primary truncate">{biggestRisk.companyName || biggestRisk.companyDomain} is cooling</span>
                  <span className="text-[12px] text-text-secondary truncate">No events in {biggestRisk.daysSinceLastEvent} days.</span>
                </div>
              </div>
              <AppButton 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  const l = domainToLead.get(biggestRisk.companyDomain);
                  if (l) onLeadClick(l);
                }}
              >
                Nudge
              </AppButton>
            </div>
          )}
        </div>
      </AppCard>

    </div>
  );
}
