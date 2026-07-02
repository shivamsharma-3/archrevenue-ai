import React, { useMemo } from 'react';
import { Lead, SellerProfile, CompanyIntelligenceRecord } from '../lib/types';
import { buildMissionBriefing, LeadIntelligenceSummary } from '../lib/opportunityEngine';
import { AppCard } from './ui/AppCard';
import { AppBadge } from './ui/AppBadge';
import { AppButton } from './ui/AppButton';
import { getFollowUpStatus } from '../lib/utils';
import {
  Sparkles, AlertTriangle, TrendingUp, Target,
  ArrowRight, Flame, Clock, Brain, Zap, Users, DollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';

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
  dueTodayCount,
}: MissionBriefingProps) {
  const briefing = useMemo(() => {
    const summaries: LeadIntelligenceSummary[] = leads
      .filter(l => l.research && l.status !== 'lost')
      .map(l => {
        const record = l.research as CompanyIntelligenceRecord;
        return { record, events: record.activeEvents || [], leadName: l.fullName };
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

  // Overnight intelligence bullets
  const overnightBullets: { icon: string; text: string; lead?: Lead }[] = [];

  leads.forEach(lead => {
    const events = (lead.research as CompanyIntelligenceRecord)?.activeEvents || [];
    const recentEvents = events.filter(e => {
      const detectedAt = e.detectedAt ? new Date(e.detectedAt) : null;
      if (!detectedAt) return false;
      const hoursSince = (Date.now() - detectedAt.getTime()) / 3_600_000;
      return hoursSince < 48;
    });
    recentEvents.slice(0, 1).forEach(e => {
      overnightBullets.push({ icon: '📡', text: `${lead.company || lead.fullName}: ${e.description}`, lead });
    });
  });

  // Add structural bullets
  const hotLeadsCount = leads.filter(l => l.aiAnalysis?.category === 'Hot' && l.status !== 'won' && l.status !== 'lost').length;
  if (hotLeadsCount > 0) overnightBullets.unshift({ icon: '🔥', text: `${hotLeadsCount} Hot lead${hotLeadsCount !== 1 ? 's' : ''} need immediate attention` });
  if (overdueCount > 0) overnightBullets.unshift({ icon: '⚠️', text: `${overdueCount} follow-up${overdueCount !== 1 ? 's' : ''} overdue — act before they go cold` });

  const getHour = () => new Date().getHours();
  const greeting = getHour() < 12 ? 'Good morning' : getHour() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* 1. AI Overnight Digest */}
      <AppCard className="flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-indigo-500" />
          <h2 className="text-[16px] font-semibold text-text-primary">AI Intelligence Briefing</h2>
          <span className="ml-auto text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">Live</span>
        </div>

        <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
          {greeting}, <span className="font-semibold text-text-primary">{briefing.userName}</span>. You have{' '}
          <span className="font-semibold text-text-primary">${(briefing.estimatedRevenueUnlocked / 1000).toFixed(0)}K</span> of active pipeline momentum.{' '}
          {peakBuyingWindows > 0 && (
            <><span className="font-semibold text-text-primary">{peakBuyingWindows} account{peakBuyingWindows !== 1 ? 's' : ''}</span> {peakBuyingWindows !== 1 ? 'are' : 'is'} in peak buying window.</>
          )}
        </p>

        {/* Overnight bullets */}
        {overnightBullets.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">While you were away</p>
            {overnightBullets.slice(0, 4).map((bullet, i) => (
              <div
                key={i}
                onClick={() => bullet.lead && onLeadClick(bullet.lead)}
                className={cn(
                  "flex items-start gap-2.5 p-2.5 rounded-lg border border-border-default bg-surface-secondary/50 text-[12px] text-text-secondary font-medium",
                  bullet.lead && "cursor-pointer hover:border-border-hover hover:bg-surface-hover transition-colors"
                )}
              >
                <span className="text-base leading-none">{bullet.icon}</span>
                <span className="leading-snug">{bullet.text}</span>
                {bullet.lead && <ArrowRight className="w-3.5 h-3.5 text-text-tertiary ml-auto shrink-0 mt-0.5" />}
              </div>
            ))}
          </div>
        )}

        {topOpportunity && (
          <div className="flex items-start justify-between p-4 bg-surface-secondary rounded-xl border border-border-default mt-auto">
            <div className="flex gap-3">
              <Target className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Top Priority Right Now</span>
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
      </AppCard>

      {/* 2. Today's Priorities */}
      <AppCard className="flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-[16px] font-semibold text-text-primary">Today's Priorities</h2>
        </div>

        <div className="flex flex-col gap-3">
          {overdueCount > 0 ? (
            <div className="flex items-center justify-between p-3 border border-rose-200 rounded-xl bg-rose-50/50 hover:border-rose-300 transition-colors">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <div>
                  <p className="text-[13px] font-semibold text-rose-700">{overdueCount} Overdue Follow-up{overdueCount !== 1 ? 's' : ''}</p>
                  <p className="text-[11px] text-rose-600">These leads need your attention now</p>
                </div>
              </div>
              <AppButton variant="danger" size="sm">Resolve Now</AppButton>
            </div>
          ) : dueTodayCount > 0 ? (
            <div className="flex items-center justify-between p-3 border border-amber-200 rounded-xl bg-amber-50/50 hover:border-amber-300 transition-colors">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-[13px] font-semibold text-amber-700">{dueTodayCount} Follow-up{dueTodayCount !== 1 ? 's' : ''} Due Today</p>
                  <p className="text-[11px] text-amber-600">Don't let them slip to tomorrow</p>
                </div>
              </div>
              <AppButton variant="secondary" size="sm">View List</AppButton>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 border border-emerald-200 rounded-xl bg-emerald-50/50">
              <span className="text-base">✅</span>
              <p className="text-[13px] text-emerald-700 font-medium">No overdue follow-ups — great work!</p>
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
                  <span className="text-[12px] text-text-secondary truncate">No signals in {biggestRisk.daysSinceLastEvent} days — send a nudge</span>
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
