import React, { useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Lead } from '../lib/types';
import { getFollowUpStatus } from '../lib/utils';
import { 
  Page, PageHeader, PageContent, PageSection, PageMetrics, PageActions 
} from '../components/layout/PageLayout';
import { AppCard } from '../components/ui/AppCard';
import { MetricCard } from '../components/ui/MetricCard';
import { AppButton } from '../components/ui/AppButton';
import { AppBadge } from '../components/ui/AppBadge';
import { EmptyState } from '../components/ui/EmptyState';
import MissionBriefing from '../components/MissionBriefing';
import DailyActionQueue from '../components/DailyActionQueue';
import { 
  Plus, Upload, Search, MessageSquare, Calendar, FolderOpen,
  DollarSign, Target, Activity, Clock, Loader2
} from 'lucide-react';

export default function DashboardPage() {
  const {
    leads, loading, sellerProfile, openDetailsPanel, 
    filterFollowUpsDueToday, setFilterFollowUpsDueToday,
    setIsModalOpen, setIsImportModalOpen, setEditingLead
  } = useOutletContext<any>();

  const navigate = useNavigate();

  // --- Computed Stats (Memoized for performance) ---
  const {
    wonLeads, lostLeads, qualLeads, activePipeline,
    revenueThisMonth, expectedRevenue,
    overdueCount, dueTodayCount, closeRate,
    hotLeads
  } = useMemo(() => {
    const now = new Date();
    let won = 0, lost = 0, qual = 0, active = 0;
    let revThisMonth = 0;
    let expected = 0;
    let overdue = 0, dueToday = 0;
    const hot: Lead[] = [];

    leads.forEach((l: Lead) => {
      const status = l.status;
      if (status === 'won') {
        won++;
        const ts = l.updatedAt?.toDate?.() ?? (l.updatedAt ? new Date(l.updatedAt) : null);
        if (ts && ts.getMonth() === now.getMonth() && ts.getFullYear() === now.getFullYear()) {
          revThisMonth += 5000; // Mock revenue value
        }
      } else if (status === 'lost') {
        lost++;
      } else {
        active++;
        if (status === 'qualified') qual++;
      }

      const fuStatus = getFollowUpStatus(l);
      if (fuStatus === 'overdue') overdue++;
      if (fuStatus === 'due_today') dueToday++;

      if (l.aiAnalysis) {
        if (l.aiAnalysis.category === 'Hot') {
          expected += 8000;
          hot.push(l);
        } else if (l.aiAnalysis.category === 'Warm') {
          expected += 3500;
        }
      }
    });

    expected += qual * 2000;
    hot.sort((a, b) => (b.aiAnalysis!.score ?? 0) - (a.aiAnalysis!.score ?? 0));

    const closedTotal = won + lost;
    const cRate = closedTotal > 0 ? Math.round((won / closedTotal) * 100) : 0;

    return {
      wonLeads: won, lostLeads: lost, qualLeads: qual, activePipeline: active,
      revenueThisMonth: revThisMonth, expectedRevenue: expected,
      overdueCount: overdue, dueTodayCount: dueToday,
      closeRate: cRate, hotLeads: hot
    };
  }, [leads]);

  const recentActivities = useMemo(() => {
    return leads.flatMap((lead: Lead) => 
      (lead.activities || []).map(a => ({
        id: a.id,
        action: a.action,
        company: lead.company || lead.fullName,
        timestamp: a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp)
      }))
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
  }, [leads]);

  const fmtRev = (n: number) =>
    n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` :
    n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  // --- Handlers ---
  const handleAddLead = () => { setEditingLead(null); setIsModalOpen(true); };
  const handleImport = () => setIsImportModalOpen(true);

  if (loading) {
    return (
      <Page>
        <PageHeader title="Command Center" />
        <PageContent className="items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center justify-center space-y-4 text-text-tertiary">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-[13px] font-medium">Loading command center...</span>
          </div>
        </PageContent>
      </Page>
    );
  }

  if (leads.length === 0) {
    return (
      <Page>
        <PageHeader title="Command Center" />
        <PageContent className="items-center justify-center min-h-[60vh]">
          <EmptyState
            title="Welcome to ArchRevenue"
            description="Your pipeline is currently empty. Get started by importing your existing leads or creating your first manual lead."
            action={
              <div className="flex items-center gap-3 mt-4">
                <AppButton variant="primary" onClick={handleAddLead} leftIcon={<Plus className="w-4 h-4"/>}>
                  Add Lead
                </AppButton>
                <AppButton variant="secondary" onClick={handleImport} leftIcon={<Upload className="w-4 h-4"/>}>
                  Import CSV
                </AppButton>
              </div>
            }
          />
        </PageContent>
      </Page>
    );
  }

  return (
    <Page>
      {/* HEADER */}
      <PageHeader 
        title="Command Center" 
        description="Your AI-powered executive overview."
      >
        <PageActions>
          <AppButton variant="secondary" leftIcon={<Upload className="w-4 h-4" />} onClick={handleImport}>
            Import
          </AppButton>
          <AppButton variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddLead}>
            Add Lead
          </AppButton>
        </PageActions>
      </PageHeader>

      <PageContent>
        {/* DAILY ACTION QUEUE — always first */}
        <DailyActionQueue
          leads={leads}
          onLeadClick={openDetailsPanel}
          onScoreLead={(lead) => { openDetailsPanel(lead); }}
        />

        {/* SECTION 1: Executive Overview */}
        <PageSection>
          <PageMetrics className="px-0 pt-0">
            <MetricCard 
              title="Expected Revenue" 
              value={fmtRev(expectedRevenue)} 
              icon={<DollarSign className="w-4 h-4 text-text-tertiary" />}
              trend={{ value: 12.5, label: "vs last month" }}
            />
            <MetricCard 
              title="Active Pipeline" 
              value={activePipeline} 
              icon={<Activity className="w-4 h-4 text-text-tertiary" />}
              trend={{ value: 5.2, label: "new this week" }}
            />
            <MetricCard 
              title="Qualified Leads" 
              value={qualLeads} 
              icon={<Target className="w-4 h-4 text-text-tertiary" />}
            />
            <MetricCard 
              title="Follow-ups Due" 
              value={overdueCount + dueTodayCount} 
              icon={<Clock className="w-4 h-4 text-text-tertiary" />}
            />
          </PageMetrics>
        </PageSection>

        {/* SECTION 2: AI Command Center */}
        <PageSection title="AI Command Center">
          <MissionBriefing 
            leads={leads}
            sellerProfile={sellerProfile}
            onLeadClick={openDetailsPanel}
            overdueCount={overdueCount}
            dueTodayCount={dueTodayCount}
          />
        </PageSection>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* SECTION 4: Critical Opportunities */}
            <PageSection title="Critical Opportunities" description="Highest scoring accounts that need immediate attention.">
              <div className="flex flex-col gap-3">
                {hotLeads.slice(0, 5).map((lead) => (
                  <AppCard key={lead.id} hoverable level={2} className="p-4 lg:p-5 flex items-center justify-between cursor-pointer" onClick={() => openDetailsPanel(lead)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-[14px]">
                        {lead.aiAnalysis?.score ?? 0}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-text-primary">{lead.fullName}</span>
                        <span className="text-[12px] text-text-secondary">{lead.company || 'Unknown Company'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getFollowUpStatus(lead) === 'overdue' && (
                        <AppBadge variant="danger">Overdue</AppBadge>
                      )}
                      <AppButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetailsPanel(lead); }}>View Deal</AppButton>
                    </div>
                  </AppCard>
                ))}
                {hotLeads.length === 0 && (
                  <AppCard level={2} className="p-6 text-center text-text-secondary text-[13px]">
                    No critical opportunities detected at this moment.
                  </AppCard>
                )}
              </div>
            </PageSection>

            {/* SECTION 5: Activity Timeline */}
            <PageSection title="Activity Timeline" description="Recent business events and milestones.">
              <AppCard level={1}>
                <div className="relative border-l border-border-default ml-3 space-y-6 pb-2">
                  {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                    <div key={activity.id || index} className="relative pl-6">
                      <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-surface-card" />
                      <p className="text-[13px] font-medium text-text-primary">{activity.action}</p>
                      <p className="text-[12px] text-text-secondary mt-0.5">{activity.company}</p>
                      <p className="text-[10px] text-text-tertiary mt-0.5">{activity.timestamp.toLocaleDateString()} {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  )) : (
                    <div className="pl-6 text-sm text-text-tertiary">No recent activity found.</div>
                  )}
                </div>
              </AppCard>
            </PageSection>
          </div>

          <div className="space-y-8">
            {/* SECTION 3: Revenue Pipeline */}
            <PageSection title="Pipeline Health">
              <AppCard className="flex flex-col gap-5">
                {['new', 'contacted', 'qualified', 'meeting_booked', 'proposal'].map(status => {
                  const count = leads.filter((l: Lead) => l.status === status).length;
                  const pct = activePipeline > 0 ? Math.round((count / activePipeline) * 100) : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[12px] text-text-secondary font-medium capitalize">{status.replace('_', ' ')}</span>
                        <span className="text-[14px] font-semibold text-text-primary">{count}</span>
                      </div>
                      <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </AppCard>
            </PageSection>

            {/* SECTION 6: Quick Actions */}
            <PageSection title="Quick Actions">
              <AppCard noPadding>
                <div className="grid grid-cols-2 divide-x divide-y divide-border-default">
                  <button onClick={handleAddLead} className="flex flex-col items-center justify-center p-6 gap-3 hover:bg-surface-hover transition-colors">
                    <Plus className="w-5 h-5 text-text-secondary" />
                    <span className="text-[12px] font-medium text-text-primary">Add Lead</span>
                  </button>
                  <button onClick={handleImport} className="flex flex-col items-center justify-center p-6 gap-3 hover:bg-surface-hover transition-colors">
                    <Upload className="w-5 h-5 text-text-secondary" />
                    <span className="text-[12px] font-medium text-text-primary">Import CSV</span>
                  </button>
                  <button onClick={() => navigate('/leads')} className="flex flex-col items-center justify-center p-6 gap-3 hover:bg-surface-hover transition-colors">
                    <Search className="w-5 h-5 text-text-secondary" />
                    <span className="text-[12px] font-medium text-text-primary">Research</span>
                  </button>
                  <button onClick={() => navigate('/pipeline')} className="flex flex-col items-center justify-center p-6 gap-3 hover:bg-surface-hover transition-colors">
                    <FolderOpen className="w-5 h-5 text-text-secondary" />
                    <span className="text-[12px] font-medium text-text-primary">Pipeline</span>
                  </button>
                </div>
              </AppCard>
            </PageSection>
          </div>
        </div>
      </PageContent>
    </Page>
  );
}
