import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Lead, LeadStatus, SellerProfile } from '../lib/types';
import { getFollowUpStatus } from '../lib/utils';
import { Activity, BarChart, CalendarCheck, TrendingUp, Users, Brain, Target, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import OpportunitySignals from '../components/OpportunitySignals';

export default function DashboardPage() {
  const {
    leads, loading, sellerProfile, openDetailsPanel, filterFollowUpsDueToday, setFilterFollowUpsDueToday
  } = useOutletContext<any>();

  const navigate = useNavigate();

  const now = new Date();
  
  // Computed stats
  const wonLeads      = leads.filter((l: Lead) => l.status === 'won');
  const lostLeads     = leads.filter((l: Lead) => l.status === 'lost');
  const qualLeads     = leads.filter((l: Lead) => l.status === 'qualified');
  const closedTotal   = wonLeads.length + lostLeads.length;
  const closeRate     = closedTotal > 0 ? Math.round((wonLeads.length / closedTotal) * 100) : 0;
  const winRate       = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : null;

  const analyzedLeads = leads.filter((l: Lead) => l.aiAnalysis);
  const hotLeads      = analyzedLeads.filter((l: Lead) => l.aiAnalysis!.category === 'Hot');
  const warmLeads     = analyzedLeads.filter((l: Lead) => l.aiAnalysis!.category === 'Warm');

  const potentialRevenue  = hotLeads.length * 8000 + warmLeads.length * 3500 + qualLeads.length * 2000;
  
  const revenueThisMonth  = wonLeads.filter((l: Lead) => {
    const ts = l.updatedAt?.toDate?.() ?? (l.updatedAt ? new Date(l.updatedAt) : null);
    if (!ts) return false;
    return ts.getMonth() === now.getMonth() && ts.getFullYear() === now.getFullYear();
  }).length * 5000; 

  const revenueAtRisk = lostLeads.filter((l: Lead) => {
    const ts = l.updatedAt?.toDate?.() ?? (l.updatedAt ? new Date(l.updatedAt) : null);
    if (!ts) return false;
    return ts.getMonth() === now.getMonth() && ts.getFullYear() === now.getFullYear();
  }).length * 3500; 

  const forecastConf  = analyzedLeads.length > 0
    ? Math.min(95, Math.round((analyzedLeads.length / leads.length) * 100))
    : leads.length > 0 ? 20 : 0;

  // Pipeline Health Score (0-100)
  const healthyCount  = analyzedLeads.filter((l: Lead) => (l.aiAnalysis!.score ?? 0) >= 70 && getFollowUpStatus(l) !== 'overdue').length;
  const overdueCount  = leads.filter((l: Lead) => getFollowUpStatus(l) === 'overdue').length;
  const pipelineScore = leads.length === 0 ? 0 : Math.max(0, Math.min(100,
    Math.round(
      (healthyCount / Math.max(leads.length, 1)) * 60 +
      (closeRate * 0.25) +
      (forecastConf * 0.15) -
      (overdueCount * 5)
    )
  ));
  const pipelineLabel = pipelineScore >= 75 ? 'Healthy' : pipelineScore >= 50 ? 'Fair' : 'Needs Attention';
  const pipelineColor = pipelineScore >= 75 ? 'text-emerald-400' : pipelineScore >= 50 ? 'text-amber-400' : 'text-red-400';

  // AI Daily Briefing items
  const overdueFU   = leads.filter((l: Lead) => getFollowUpStatus(l) === 'overdue');
  const dueTodayFU  = leads.filter((l: Lead) => getFollowUpStatus(l) === 'due_today');
  const topLead     = [...leads].filter((l: Lead) => l.aiAnalysis).sort((a: Lead, b: Lead) => (b.aiAnalysis!.score ?? 0) - (a.aiAnalysis!.score ?? 0))[0];

  const briefingItems: { emoji: string; text: string; color: string; urgent?: boolean }[] = [];
  if (overdueFU.length > 0)
    briefingItems.push({ emoji: '🔥', text: `Follow up with ${overdueFU[0].fullName}${overdueFU.length > 1 ? ` and ${overdueFU.length - 1} other${overdueFU.length > 2 ? 's' : ''}` : ''} — overdue`, color: 'text-red-400', urgent: true });
  if (dueTodayFU.length > 0)
    briefingItems.push({ emoji: '⚠️', text: `${dueTodayFU.length} follow-up${dueTodayFU.length > 1 ? 's' : ''} due today`, color: 'text-amber-400' });
  if (potentialRevenue > 0)
    briefingItems.push({ emoji: '💰', text: `Potential revenue this month: ${potentialRevenue >= 1000 ? `$${(potentialRevenue/1000).toFixed(0)}K` : `$${potentialRevenue}`}`, color: 'text-emerald-400' });
  if (topLead && closeRate > 0)
    briefingItems.push({ emoji: '📈', text: `Win rate at ${closeRate}% — ${closeRate >= 30 ? 'above' : 'below'} benchmark`, color: closeRate >= 30 ? 'text-emerald-400' : 'text-amber-400' });
  if (briefingItems.length === 0)
    briefingItems.push({ emoji: '✅', text: 'All caught up — no urgent actions today', color: 'text-emerald-400' });

  // Hot Opportunities
  const hotOpportunities = [...leads]
    .filter((l: Lead) => l.aiAnalysis && (l.aiAnalysis.category === 'Hot' || l.aiAnalysis.category === 'Warm'))
    .sort((a: Lead, b: Lead) => (b.aiAnalysis!.score ?? 0) - (a.aiAnalysis!.score ?? 0))
    .slice(0, 4);

  // AI Command Center recommendations
  type CommandAction = { label: string; lead?: typeof leads[0]; type: 'followup' | 'analyze' | 'contact' | 'review' };
  const commandActions: CommandAction[] = [];
  if (overdueFU.length > 0)
    commandActions.push({ label: `Follow up with ${overdueFU[0].fullName}`, lead: overdueFU[0], type: 'followup' });
  const unanalyzed = leads.filter((l: Lead) => !l.aiAnalysis).slice(0, 2);
  if (unanalyzed.length > 0)
    commandActions.push({ label: `Re-analyze ${unanalyzed[0].fullName}`, lead: unanalyzed[0], type: 'analyze' });
  if (dueTodayFU.length > 0)
    commandActions.push({ label: `Contact ${dueTodayFU.length} overdue lead${dueTodayFU.length > 1 ? 's' : ''}`, type: 'contact' });
  if (commandActions.length === 0 && topLead)
    commandActions.push({ label: `Review top lead: ${topLead.fullName}`, lead: topLead, type: 'review' });

  const commandImpact = commandActions.length * 2500;

  const fmtRev = (n: number) =>
    n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` :
    n >= 1000    ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  const stats = [
    { label: 'Total Pipeline', value: leads.length, subtext: `${leads.filter((l: Lead) => l.status === 'qualified').length} qualified`, subtextColor: 'text-emerald-500', trendIcon: TrendingUp, icon: Users, color: 'text-white/60', action: () => navigate('/pipeline'), active: false },
    { label: 'New Leads', value: leads.filter((l: Lead) => l.status === 'new').length, subtext: 'awaiting first contact', subtextColor: 'text-blue-500', trendIcon: Activity, icon: Clock, color: 'text-white/60', action: () => navigate('/leads'), active: false },
    { 
      label: 'Follow-Ups Due', 
      value: leads.filter((l: Lead) => { const s = getFollowUpStatus(l); return s === 'due_today' || s === 'overdue'; }).length, 
      subtext: filterFollowUpsDueToday ? 'Viewing due leads' : 'need action now', 
      subtextColor: filterFollowUpsDueToday ? 'text-indigo-400' : 'text-red-400', 
      trendIcon: CalendarCheck, 
      icon: CalendarCheck, 
      color: filterFollowUpsDueToday ? 'text-indigo-400' : 'text-amber-400', 
      action: () => { setFilterFollowUpsDueToday(!filterFollowUpsDueToday); navigate('/leads'); },
      active: filterFollowUpsDueToday
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-10">
      {/* Stats - 4 core cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            onClick={stat.action}
            className={cn(
              "bg-gradient-to-br from-white/[0.05] to-transparent border shadow-xl rounded-[20px] md:rounded-[24px] p-4 md:p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group/card",
              stat.active ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_10px_40px_rgba(99,102,241,0.2)]" : "border-white/[0.08] hover:border-white/[0.2] shadow-[0_10px_40px_rgba(0,0,0,0.3)]",
              stat.action && !stat.active && "cursor-pointer"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="flex items-start justify-between mb-2 z-10">
              <p className="text-[11px] md:text-[13px] font-semibold tracking-wide text-zinc-400 group-hover/card:text-zinc-300 transition-colors">{stat.label}</p>
              <div className={cn("p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] shadow-inner backdrop-blur-md group-hover/card:scale-110 transition-transform duration-300", stat.color)}>
                <stat.icon className="w-5 h-5 hidden sm:block" />
              </div>
            </div>
            <div className="z-10 mt-2">
              <p className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-md" style={{ fontFamily: 'var(--font-mono)' }}>{loading ? '-' : stat.value}</p>
              <div className="flex mt-3 md:mt-4 text-[10px] md:text-[12px] font-semibold min-h-[16px]">
                <span className={cn("flex items-center px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.05]", stat.subtextColor)}>
                  {stat.trendIcon && <stat.trendIcon className="w-3.5 h-3.5 mr-1.5" />}
                  {stat.subtext}
                </span>
              </div>
            </div>
          </div>
        ))}
        {/* Win Rate */}
        <div className="bg-gradient-to-br from-[#1a1423] to-[#0f0a14] border border-[#8b5cf6]/20 shadow-[0_10px_40px_rgba(139,92,246,0.15)] rounded-[20px] md:rounded-[24px] p-4 md:p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(139,92,246,0.25)] group/win">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/10 to-transparent pointer-events-none opacity-50" />
          <div className="flex items-start justify-between mb-2 z-10">
            <p className="text-[11px] md:text-[13px] font-semibold tracking-wide text-[#a78bfa] group-hover/win:text-[#c4b5fd] transition-colors">Win Rate (Avg)</p>
          </div>
          {/* Absolute positioned large circle */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 w-14 h-14 md:w-16 md:h-16 hidden sm:block pointer-events-none z-10">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]" viewBox="0 0 36 36">
              <path
                className="text-white/[0.05]"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#8b5cf6] transition-all duration-1000 ease-out"
                strokeWidth="4"
                strokeDasharray={`${winRate || 0}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
          <div className="z-10 relative h-full flex flex-col justify-end mt-2">
            <p className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-md">{loading ? '-' : (winRate === null ? '-' : `${winRate}%`)}</p>
            <div className="flex flex-col md:flex-row mt-3 md:mt-4 text-[10px] md:text-[12px] font-semibold min-h-[16px]">
              <span className="flex items-center px-2 py-1 rounded-md bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#c4b5fd]">
                <Target className="w-3.5 h-3.5 mr-1.5" />
                Based on closed won
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HERO: AI Daily Briefing */}
      <div className="intel-panel relative rounded-[24px] overflow-hidden border border-emerald-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#050f09] via-[#03080a] to-[#000000]" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-indigo-500/[0.04] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <Brain className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-white tracking-tight">AI Daily Briefing</h2>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5 tracking-wide">
                  {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-dot-live" />
              <span className="text-[10px] font-bold text-emerald-400 tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>LIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {briefingItems.map((item, i) => (
              <div
                key={i}
                className={cn(
                  "feed-item flex items-start space-x-3.5 px-4 py-3.5 rounded-xl border transition-all",
                  item.urgent
                    ? "bg-red-500/[0.06] border-red-500/20 hover:border-red-500/40"
                    : "bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]"
                )}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <span className="text-lg leading-none flex-shrink-0 mt-0.5">{item.emoji}</span>
                <p className={`text-[13px] font-medium leading-snug ${item.color}`}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {[
          { label: 'Revenue This Month', value: fmtRev(revenueThisMonth), sub: `${wonLeads.length} deals closed`, color: 'text-white', accent: 'border-white/[0.08]', glow: '' },
          { label: 'Potential Revenue', value: fmtRev(potentialRevenue), sub: `${hotLeads.length} hot + ${warmLeads.length} warm leads`, color: 'text-emerald-400', accent: 'border-emerald-500/20', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.08)]' },
          { label: 'Revenue At Risk', value: fmtRev(revenueAtRisk), sub: `${lostLeads.length} lost deals this month`, color: 'text-red-400', accent: 'border-red-500/20', glow: '' },
        ].map((card, i) => (
          <div key={i} className={`intel-panel bg-gradient-to-br from-white/[0.04] to-transparent rounded-[20px] border ${card.accent} ${card.glow} p-5 md:p-6 backdrop-blur-2xl relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-3 relative z-10">{card.label}</p>
            <p className={`text-3xl md:text-4xl font-bold relative z-10 metric-reveal ${card.color}`} style={{ fontFamily: 'var(--font-mono)' }}>{card.value}</p>
            <p className="text-[11px] text-zinc-600 mt-2 font-medium relative z-10">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Hot Opportunities + Pipeline Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Hot Opportunities - 2 cols */}
        <div className="lg:col-span-2 intel-panel bg-gradient-to-br from-[#110a00] to-[#070400] border border-orange-500/20 rounded-[24px] p-6 backdrop-blur-2xl shadow-[0_15px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.04] to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <TrendingUp className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-white tracking-tight">Hot Opportunities</h3>
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">Top leads by AI score</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-orange-400 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20" style={{ fontFamily: 'var(--font-mono)' }}>
              {hotLeads.length + warmLeads.length} active
            </span>
          </div>

          {hotOpportunities.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center relative z-10">
              <div className="w-12 h-12 rounded-full bg-orange-500/5 border border-orange-500/10 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-orange-500/30" />
              </div>
              <p className="text-[13px] text-zinc-500 font-medium">No scored leads yet</p>
              <p className="text-[11px] text-zinc-600 mt-1">Run AI Analysis on your leads to surface hot opportunities</p>
            </div>
          ) : (
            <div className="space-y-2.5 relative z-10">
              {hotOpportunities.map((lead: Lead, i: number) => {
                const isHot  = lead.aiAnalysis!.category === 'Hot';
                const revEst = isHot ? 8000 : 3500;
                return (
                  <div
                    key={lead.id}
                    onClick={() => openDetailsPanel(lead)}
                    className="group feed-item flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-orange-500/30 hover:bg-orange-500/[0.03] cursor-pointer transition-all"
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold tracking-wide flex-shrink-0 border",
                        isHot ? "bg-orange-500/15 border-orange-500/30 text-orange-300" : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                      )}>
                        {lead.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white group-hover:text-orange-100 transition-colors truncate">{lead.fullName}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{lead.company || lead.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                      <div className="text-right">
                        <span className={cn(
                          "inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border",
                          isHot ? "bg-orange-500/15 text-orange-400 border-orange-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {lead.aiAnalysis!.score} · {lead.aiAnalysis!.category}
                        </span>
                        <p className="text-[10px] text-zinc-600 mt-0.5 text-right font-medium" style={{ fontFamily: 'var(--font-mono)' }}>{fmtRev(revEst)} est.</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-orange-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pipeline Health Score - 1 col */}
        <div className="intel-panel bg-gradient-to-br from-[#080810] to-[#040408] border border-indigo-500/15 rounded-[24px] p-6 backdrop-blur-2xl shadow-[0_15px_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.04] to-transparent pointer-events-none" />
          <div className="flex items-center space-x-3 mb-6 relative z-10">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-white tracking-tight">Pipeline Health</h3>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">Overall score</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 relative z-10 py-4">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={pipelineScore >= 75 ? '#10b981' : pipelineScore >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(pipelineScore / 100) * 263.9} 263.9`}
                  style={{ filter: `drop-shadow(0 0 8px ${pipelineScore >= 75 ? 'rgba(16,185,129,0.5)' : pipelineScore >= 50 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)'})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${pipelineColor}`} style={{ fontFamily: 'var(--font-mono)' }}>{leads.length === 0 ? '—' : pipelineScore}</span>
                <span className="text-[10px] text-zinc-500 font-bold tracking-wide">/100</span>
              </div>
            </div>
            <span className={`text-[15px] font-bold ${pipelineColor}`}>{leads.length === 0 ? 'No data' : pipelineLabel}</span>
            <div className="mt-4 space-y-1.5 w-full">
              <div className="flex justify-between text-[10px] font-medium">
                <span className="text-zinc-500">Healthy leads</span>
                <span className="text-zinc-400" style={{ fontFamily: 'var(--font-mono)' }}>{healthyCount}</span>
              </div>
              <div className="flex justify-between text-[10px] font-medium">
                <span className="text-zinc-500">Overdue tasks</span>
                <span className={overdueCount > 0 ? "text-red-400" : "text-zinc-400"} style={{ fontFamily: 'var(--font-mono)' }}>{overdueCount}</span>
              </div>
              <div className="flex justify-between text-[10px] font-medium">
                <span className="text-zinc-500">Forecast conf.</span>
                <span className="text-zinc-400" style={{ fontFamily: 'var(--font-mono)' }}>{forecastConf}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Forecast (simplified) */}
      <div className="intel-panel bg-gradient-to-br from-[#0a0f1e] to-[#050810] border border-indigo-500/15 rounded-[24px] p-6 backdrop-blur-2xl shadow-[0_15px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.04] to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <BarChart className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-white tracking-tight">Revenue Forecast</h3>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">AI Pipeline Intelligence</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 status-dot-live" />
            <span className="text-[10px] font-bold text-indigo-400" style={{ fontFamily: 'var(--font-mono)' }}>LIVE</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 relative z-10">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-2">Potential Revenue</p>
            <p className="text-2xl font-bold text-white metric-reveal" style={{ fontFamily: 'var(--font-mono)' }}>{fmtRev(potentialRevenue)}</p>
            <p className="text-[10px] text-zinc-600 mt-1.5 font-medium">from active pipeline</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-2">Forecast Confidence</p>
            <p className="text-2xl font-bold text-emerald-400 metric-reveal" style={{ fontFamily: 'var(--font-mono)' }}>{forecastConf}<span className="text-base text-emerald-500/50">%</span></p>
            <div className="mt-2.5 h-1 bg-white/[0.04] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full health-bar-fill" style={{ '--target-width': `${forecastConf}%` } as React.CSSProperties} />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-2">Close Rate</p>
            <p className="text-2xl font-bold text-white metric-reveal" style={{ fontFamily: 'var(--font-mono)' }}>{closeRate}<span className="text-base text-zinc-500">%</span></p>
            <p className="text-[10px] text-zinc-600 mt-1.5 font-medium">{closedTotal} closed deals</p>
          </div>
        </div>
      </div>

      {/* AI Command Center */}
      <div className="intel-panel relative rounded-[24px] overflow-hidden border border-violet-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a060f] to-[#040208]" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.05] to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-white tracking-tight">AI Command Center</h2>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Today I recommend</p>
              </div>
            </div>
            {commandImpact > 0 && (
              <div className="px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                <span className="text-[11px] font-bold text-violet-300">+{fmtRev(commandImpact)} potential impact</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {commandActions.length === 0 ? (
              <div className="md:col-span-3 flex flex-col items-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-violet-500/5 border border-violet-500/10 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-violet-500/30" />
                </div>
                <p className="text-[13px] text-zinc-500 font-medium">All recommended actions complete</p>
                <p className="text-[11px] text-zinc-600 mt-1">Add leads or run AI Analysis to generate action recommendations</p>
              </div>
            ) : commandActions.map((cmd, i) => (
              <button
                key={i}
                onClick={() => { if (cmd.lead) openDetailsPanel(cmd.lead); }}
                className="feed-item group flex items-center justify-between px-4 py-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-violet-500/30 hover:bg-violet-500/[0.04] transition-all text-left"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-base flex-shrink-0">
                    {cmd.type === 'followup' ? '🔥' : cmd.type === 'analyze' ? '✨' : cmd.type === 'contact' ? '📞' : '👁️'}
                  </span>
                  <p className="text-[13px] font-medium text-zinc-300 group-hover:text-white transition-colors">{cmd.label}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-violet-400 transition-colors flex-shrink-0 ml-3" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
