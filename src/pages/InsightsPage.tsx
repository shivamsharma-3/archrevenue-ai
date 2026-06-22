import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Lead } from '../lib/types';
import { TrendingUp, DollarSign, Target, Mail, Zap, Clock, ShieldCheck, Sparkles, BarChart3, ArrowUpRight, ArrowDownRight, Upload } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Page, PageHeader, PageActions, PageContent } from '../components/layout/PageLayout';
import { AppButton } from '../components/ui/AppButton';

export default function InsightsPage() {
  const { leads = [], loading, handleExportCsv } = useOutletContext<any>();

  // Use useMemo to prevent recalculating on every re-render
  const metrics = useMemo(() => {
    const allLeads = (leads || []) as Lead[];
    
    // --- Revenue Metrics ---
    const wonLeads = allLeads.filter(l => l.status === 'won');
    const closedRevenue = wonLeads.length * 5000; // Mock $5k ACV
    
    const analyzedLeads = allLeads.filter(l => l.aiAnalysis);
    const hotLeads = analyzedLeads.filter(l => l.aiAnalysis!.category === 'Hot' && l.status !== 'won' && l.status !== 'lost');
    const warmLeads = analyzedLeads.filter(l => l.aiAnalysis!.category === 'Warm' && l.status !== 'won' && l.status !== 'lost');
    const qualLeads = allLeads.filter(l => l.status === 'qualified' && (!l.aiAnalysis || (l.aiAnalysis.category !== 'Hot' && l.aiAnalysis.category !== 'Warm')));
    
    const pipelineRevenue = hotLeads.length * 8000 + warmLeads.length * 3500 + qualLeads.length * 2000;
    const expectedRevenue = closedRevenue + pipelineRevenue;

    // --- Win Rate ---
    const lostLeads = allLeads.filter(l => l.status === 'lost');
    const totalClosed = wonLeads.length + lostLeads.length;
    const winRate = totalClosed > 0 ? Math.round((wonLeads.length / totalClosed) * 100) : 0;

    // --- AI Impact ---
    const aiScorings = analyzedLeads.length;
    const aiResearches = allLeads.filter(l => l.research).length;
    const dealCoaches = allLeads.filter(l => l.dealCoach).length;
    const totalAIActions = aiScorings + aiResearches + dealCoaches;
    
    // Assume 15 mins saved per research, 5 mins per score, 10 mins per deal coach = total minutes
    const minutesSaved = (aiResearches * 15) + (aiScorings * 5) + (dealCoaches * 10);
    const hoursSaved = Math.round((minutesSaved / 60) * 10) / 10;

    // --- Outreach Performance ---
    const emailsGenerated = allLeads.reduce((acc, l) => acc + (l.activities?.filter(a => a.action.includes('Email') || a.action.includes('Outreach')).length || 0), 0);
    const meetingsBooked = allLeads.reduce((acc, l) => acc + (l.notes?.filter(n => n.type === 'Meeting').length || 0), 0);
    const meetingRate = emailsGenerated > 0 ? Math.round((meetingsBooked / emailsGenerated) * 100) : 0;

    // --- Funnel Metrics ---
    const funnelStages = [
      { id: 'new', label: 'Lead', count: allLeads.filter(l => l.status === 'new').length },
      { id: 'contacted', label: 'Contacted', count: allLeads.filter(l => l.status === 'contacted').length },
      { id: 'qualified', label: 'Qualified', count: allLeads.filter(l => l.status === 'qualified').length },
      { id: 'won', label: 'Won', count: wonLeads.length },
    ];
    const maxFunnelCount = Math.max(...funnelStages.map(s => s.count), 1);

    return {
      expectedRevenue,
      pipelineRevenue,
      closedRevenue,
      winRate,
      leadVelocity: allLeads.length,
      aiScorings,
      aiResearches,
      dealCoaches,
      totalAIActions,
      hoursSaved,
      emailsGenerated,
      meetingsBooked,
      meetingRate,
      funnelStages,
      maxFunnelCount
    };
  }, [leads]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Page>
      <PageHeader 
        title="Executive Intelligence" 
        description="Based on your current pipeline"
      >
        <PageActions>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Live Data</span>
          </div>
          <AppButton variant="secondary" leftIcon={<Upload className="w-4 h-4" />} onClick={handleExportCsv}>
            Export Report
          </AppButton>
        </PageActions>
      </PageHeader>

      <PageContent>
        {/* Top Row: Core KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Expected Revenue */}
        <div className="bg-surface-card shadow-[0_2px_12px_rgba(15,23,42,0.06)] border border-border-default rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="absolute inset-0 bg-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-2.5 bg-teal-500/10 rounded-[var(--radius-card)] border border-teal-500/20">
              <DollarSign className="w-5 h-5 text-teal-400" />
            </div>
            <div className="flex items-center text-teal-400 text-xs font-bold bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
              <ArrowUpRight className="w-3 h-3 mr-1" /> 14.2% MoM
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Expected Revenue</p>
            <h3 className="text-4xl font-headline font-black text-text-primary">${metrics.expectedRevenue.toLocaleString()}</h3>
            <div className="flex items-center justify-between mt-6 text-sm">
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-teal-500 mr-2" />
                <span className="text-text-secondary">Pipeline: <span className="text-text-primary font-bold">${metrics.pipelineRevenue.toLocaleString()}</span></span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-teal-500 mr-2" />
                <span className="text-text-secondary">Closed: <span className="text-text-primary font-bold">${metrics.closedRevenue.toLocaleString()}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-surface-card shadow-[0_2px_12px_rgba(15,23,42,0.06)] border border-border-default rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="absolute inset-0 bg-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-2.5 bg-teal-500/10 rounded-[var(--radius-card)] border border-teal-500/20">
              <Target className="w-5 h-5 text-teal-400" />
            </div>
            <div className="flex items-center text-teal-400 text-xs font-bold bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
              <ArrowUpRight className="w-3 h-3 mr-1" /> 2.1% MoM
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Win Rate</p>
            <h3 className="text-4xl font-headline font-black text-text-primary">{metrics.winRate}%</h3>
            <div className="mt-6 w-full bg-surface-hover h-1.5 rounded-full overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full" style={{ width: `${metrics.winRate}%` }} />
            </div>
            <p className="text-xs text-text-secondary font-medium mt-2">Based on closed won vs lost opportunities.</p>
          </div>
        </div>

        {/* Lead Velocity */}
        <div className="bg-surface-card shadow-[0_2px_12px_rgba(15,23,42,0.06)] border border-border-default rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="absolute inset-0 bg-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-2.5 bg-teal-500/10 rounded-[var(--radius-card)] border border-teal-500/20">
              <TrendingUp className="w-5 h-5 text-teal-400" />
            </div>
            <div className="flex items-center text-amber-400 text-xs font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              <ArrowDownRight className="w-3 h-3 mr-1" /> 5.4% MoM
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Lead Velocity</p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-4xl font-headline font-black text-text-primary">{metrics.leadVelocity}</h3>
              <span className="text-sm font-bold text-text-secondary">Active</span>
            </div>
            <div className="mt-6 flex items-center space-x-2">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border-2 border-white bg-teal-50 flex items-center justify-center text-[10px] text-teal-600 font-bold">+12</div>
                <div className="w-6 h-6 rounded-full border-2 border-white bg-teal-50 flex items-center justify-center text-[10px] text-teal-600 font-bold">+5</div>
              </div>
              <p className="text-xs text-text-secondary font-medium ml-2">New leads added this week.</p>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Col: Conversion Funnel */}
        <div className="xl:col-span-1 space-y-6">
          <section className="bg-surface-card border border-border-default rounded-3xl p-8 relative overflow-hidden shadow-[0_2px_12px_rgba(15,23,42,0.06)] h-full flex flex-col">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-50 rounded-full blur-[80px] pointer-events-none" />
            
            <h2 className="text-sm font-bold uppercase tracking-widest text-teal-600 mb-8 flex items-center relative z-10">
              <BarChart3 className="w-4 h-4 mr-2" /> Conversion Funnel
            </h2>

            <div className="flex-1 flex flex-col justify-center space-y-6 relative z-10">
              {metrics.funnelStages.map((stage, index) => {
                const widthPercent = Math.max(8, (stage.count / metrics.maxFunnelCount) * 100);
                const isLast = index === metrics.funnelStages.length - 1;
                return (
                  <div key={stage.id} className="relative flex flex-col group">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-xs font-extrabold text-text-secondary uppercase tracking-widest">{stage.label}</span>
                      <span className="text-lg font-black text-text-primary">{stage.count}</span>
                    </div>
                    <div className="w-full h-12 bg-surface-secondary rounded-[var(--radius-card)] overflow-hidden border border-border-default flex items-center p-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3",
                          isLast ? "bg-teal-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-teal-500/40"
                        )}
                      >
                         {stage.count > 0 && <span className="text-[10px] font-bold text-white/90">{widthPercent.toFixed(0)}%</span>}
                      </motion.div>
                    </div>
                    {/* Drop-off indicator between stages */}
                    {index < metrics.funnelStages.length - 1 && (
                      <div className="absolute -bottom-5 right-2 text-[10px] text-text-secondary font-bold hidden group-hover:block z-20 bg-surface-card px-2 py-0.5 rounded border border-border-default shadow-sm">
                        {metrics.funnelStages[index].count > 0 
                          ? `${Math.round(((metrics.funnelStages[index].count - metrics.funnelStages[index+1].count) / metrics.funnelStages[index].count) * 100)}% drop-off` 
                          : '0% drop-off'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Col: AI & Outreach Metrics */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* AI Impact Metrics */}
          <section className="bg-gradient-to-br from-white to-teal-50/30 border border-border-default rounded-3xl p-8 relative overflow-hidden shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
            <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-teal-50 rounded-full blur-[100px] pointer-events-none" />
            
            <h2 className="text-sm font-bold uppercase tracking-widest text-teal-600 mb-8 flex items-center relative z-10">
              <Zap className="w-4 h-4 mr-2" /> AI Impact Metrics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
              {/* Hours Saved */}
              <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-teal-50 rounded-lg"><Clock className="w-4 h-4 text-teal-600" /></div>
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Time Saved</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-headline font-black text-text-primary">{metrics.hoursSaved}</span>
                  <span className="text-sm font-bold text-text-secondary">hours</span>
                </div>
                <p className="text-[10px] text-text-secondary font-medium mt-2">Calculated vs manual research baseline.</p>
              </div>

              {/* AI Actions Run */}
              <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-teal-50 rounded-lg"><Sparkles className="w-4 h-4 text-teal-600" /></div>
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">AI Operations</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-headline font-black text-text-primary">{metrics.totalAIActions}</span>
                  <span className="text-sm font-bold text-text-secondary">actions</span>
                </div>
                <p className="text-[10px] text-text-secondary font-medium mt-2">{metrics.aiResearches} researched, {metrics.aiScorings} scored.</p>
              </div>

              {/* Deals Coached */}
              <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-amber-50 rounded-lg"><ShieldCheck className="w-4 h-4 text-amber-500" /></div>
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Deals Coached</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-headline font-black text-text-primary">{metrics.dealCoaches}</span>
                  <span className="text-sm font-bold text-text-secondary">deals</span>
                </div>
                <p className="text-[10px] text-text-secondary font-medium mt-2">Active opportunities guided by AI.</p>
              </div>
            </div>
          </section>

          {/* Outreach Performance */}
          <section className="bg-surface-card border border-border-default rounded-3xl p-8 relative overflow-hidden shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary mb-8 flex items-center">
              <Mail className="w-4 h-4 mr-2 text-text-secondary" /> Outreach Performance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col justify-center space-y-6">
                <div className="flex items-center justify-between border-b border-border-default pb-4">
                  <div>
                    <p className="text-sm font-bold text-text-primary mb-1">Emails Drafted by AI</p>
                    <p className="text-xs text-text-secondary font-medium">Hyper-personalized outgoing touchpoints</p>
                  </div>
                  <span className="text-2xl font-black text-teal-600">{metrics.emailsGenerated}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-default pb-4">
                  <div>
                    <p className="text-sm font-bold text-text-primary mb-1">Meetings Booked</p>
                    <p className="text-xs text-text-secondary font-medium">Confirmed calls logged in notes</p>
                  </div>
                  <span className="text-2xl font-black text-teal-600">{metrics.meetingsBooked}</span>
                </div>
              </div>

              <div className="bg-surface-secondary border border-border-default rounded-[var(--radius-card)] p-6 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full border-[6px] border-teal-100 flex items-center justify-center relative mb-4">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle 
                      cx="50%" cy="50%" r="34" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="6" 
                      className="text-teal-500"
                      strokeDasharray="213"
                      strokeDashoffset={213 - (213 * metrics.meetingRate) / 100}
                    />
                  </svg>
                  <span className="text-xl font-black text-text-primary">{metrics.meetingRate}%</span>
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-1">Meeting Conversion Rate</h3>
                <p className="text-xs text-text-secondary font-medium">Based on generated emails vs booked meetings.</p>
              </div>
            </div>
          </section>

        </div>
      </div>
      </PageContent>
    </Page>
  );
}
