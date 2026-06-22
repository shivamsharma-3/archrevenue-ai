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
import { 
  Plus, Upload, Search, MessageSquare, Calendar, FolderOpen,
  DollarSign, Target, Activity, Clock
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

  const fmtRev = (n: number) =>
    n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` :
    n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  // --- Handlers ---
  const handleAddLead = () => { setEditingLead(null); setIsModalOpen(true); };
  const handleImport = () => setIsImportModalOpen(true);

  if (!loading && leads.length === 0) {
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
                      <AppButton variant="ghost" size="sm">Review</AppButton>
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
                  <div className="relative pl-6">
                    <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-surface-card" />
                    <p className="text-[13px] font-medium text-text-primary">Deal Advanced: Acme Corp</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">Moved to Proposal stage.</p>
                  </div>
                  <div className="relative pl-6">
                    <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-surface-card" />
                    <p className="text-[13px] font-medium text-text-primary">Lead Scored: TechFlow Inc</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">AI identified a peak buying window.</p>
                  </div>
                  <div className="relative pl-6">
                    <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-surface-card" />
                    <p className="text-[13px] font-medium text-text-primary">Meeting Booked</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">Discovery call with Sarah Jenkins scheduled for tomorrow.</p>
                  </div>
                </div>
              </AppCard>
            </PageSection>
          </div>

          <div className="space-y-8">
            {/* SECTION 3: Revenue Pipeline */}
            <PageSection title="Pipeline Health">
              <AppCard className="flex flex-col gap-5">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[12px] text-text-secondary font-medium">Win Rate</span>
                    <span className="text-[14px] font-semibold text-text-primary">{closeRate}%</span>
                  </div>
                  <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${closeRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[12px] text-text-secondary font-medium">Pipeline Coverage</span>
                    <span className="text-[14px] font-semibold text-text-primary">3.2x</span>
                  </div>
                  <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
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
