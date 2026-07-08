import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Lead } from '../lib/types';
import { Building, Sparkles, Loader2, Users, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { getFollowUpStatus } from '../lib/utils';
import { EmptyState } from '../components/ui/EmptyState';
import { PipelineAnalytics } from '../components/PipelineAnalytics';
import { Page, PageHeader, PageActions, PageContent } from '../components/layout/PageLayout';
import { AppButton } from '../components/ui/AppButton';

export default function PipelinePage() {
  const {
    leads, loading, openDetailsPanel, handleScoreLead, aiScoringLoading, setIsModalOpen, setIsImportModalOpen, setEditingLead
  } = useOutletContext<any>();

  if (loading) {
    return (
      <Page>
        <PageHeader title="Pipeline" />
        <PageContent className="items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center justify-center space-y-4 text-text-tertiary">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-[13px] font-medium">Loading pipeline...</span>
          </div>
        </PageContent>
      </Page>
    );
  }

  if (leads.length === 0) {
    return (
      <Page>
        <PageHeader title="Pipeline" />
        <PageContent className="items-center justify-center min-h-[60vh]">
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="Pipeline Empty"
            description="You don't have any leads in your pipeline yet. Add some leads to see them organized by stage."
            action={
              <div className="flex items-center justify-center gap-3 mt-2">
                <AppButton variant="primary" onClick={() => { setEditingLead(null); setIsModalOpen(true); }}>
                  Add First Lead
                </AppButton>
                <AppButton variant="secondary" onClick={() => setIsImportModalOpen(true)}>
                  Import CSV
                </AppButton>
              </div>
            }
          />
        </PageContent>
      </Page>
    );
  }

  const stageCount = leads.length;
  const wonCount = leads.filter((l: Lead) => l.status === 'won').length;

  return (
    <Page className="h-screen overflow-hidden">
      <PageHeader title="Pipeline" description="Drag and drop cards to update their stage.">
        <PageActions>
          <div className="flex items-center space-x-2 mr-3 border-r border-border-default pr-4">
            <span className="text-[11px] font-bold text-text-secondary px-2 py-0.5 rounded-full bg-surface-secondary border border-border-default font-mono">
              {stageCount} active
            </span>
            <span className="text-[11px] font-bold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 font-mono">
              {wonCount} won
            </span>
          </div>
          <AppButton variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setEditingLead(null); setIsModalOpen(true); }}>
            New Lead
          </AppButton>
        </PageActions>
      </PageHeader>
      
      <div className="flex-1 flex flex-col min-h-0 px-8 pb-8 pt-6 w-full max-w-[1600px] mx-auto gap-4">
        <div className="flex-none">
          <PipelineAnalytics leads={leads} />
        </div>
      
      <div className="flex-1 min-h-0 rounded-[var(--radius-card)] border border-border-default shadow-sm bg-surface-card overflow-hidden flex flex-col relative mt-2">
        <div className="flex-1 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-2 w-full hide-scrollbar">
          {['new', 'contacted', 'qualified', 'meeting_booked', 'proposal', 'lost', 'won'].map((status, index) => (
            <div key={status} className={cn(
              "w-[85vw] sm:w-auto sm:flex-1 shrink-0 min-w-[260px] p-4 h-full flex flex-col snap-center relative overflow-hidden",
              index !== 6 && "border-r border-border-default",
              status === 'won' ? 'bg-emerald-50/30' :
              status === 'lost' ? 'bg-red-50/30' :
              status === 'proposal' ? 'bg-purple-50/30' :
              status === 'meeting_booked' ? 'bg-teal-50/30' :
              status === 'qualified' ? 'bg-amber-50/30' :
              status === 'contacted' ? 'bg-indigo-50/30' :
              'bg-surface-secondary/50'
            )}>
              <div className={cn("absolute inset-0 pointer-events-none opacity-50",
                status === 'won' ? 'bg-gradient-to-b from-emerald-100/20 to-transparent' :
                status === 'lost' ? 'bg-gradient-to-b from-red-100/20 to-transparent' :
                status === 'proposal' ? 'bg-gradient-to-b from-purple-100/20 to-transparent' :
                status === 'meeting_booked' ? 'bg-gradient-to-b from-teal-100/20 to-transparent' :
                status === 'qualified' ? 'bg-gradient-to-b from-amber-100/20 to-transparent' :
                status === 'contacted' ? 'bg-gradient-to-b from-indigo-100/20 to-transparent' :
                'bg-gradient-to-b from-surface-secondary/50 to-transparent'
              )} />
              <h3 className="relative z-10 text-text-primary text-sm font-semibold uppercase tracking-wider mb-5 flex items-center justify-between">
                <span>{status === 'new' ? 'New Lead' : status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                <span className="text-text-secondary bg-surface-background border border-border-default px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  {leads.filter((l: Lead) => l.status === status).length}
                </span>
              </h3>
              <div className="relative z-10 space-y-3 flex-1 overflow-y-auto pr-1 pb-2 hide-scrollbar">
                {leads.filter((l: Lead) => l.status === status).map((lead: Lead) => (
                  <div key={lead.id} onClick={() => openDetailsPanel(lead)} className="bg-surface-card shadow-sm border border-border-default rounded-[var(--radius-button)] p-4 cursor-pointer hover:border-border-hover hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                    <div className="font-semibold text-text-primary mb-1.5 tracking-wide flex items-center justify-between">
                      <span className="truncate pr-2">{lead.fullName || 'Unknown'}</span>
                      {(() => {
                        const status = getFollowUpStatus(lead);
                        if (!status) return null;
                        if (status === 'overdue') return <span title="Overdue" className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>;
                        if (status === 'due_today') return <span title="Due Today" className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>;
                        if (status === 'scheduled') return <span title="Scheduled" className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>;
                        if (status === 'completed') return <span title="Completed" className="w-2 h-2 rounded-full bg-surface-secondary0 shrink-0"></span>;
                        return null;
                      })()}
                    </div>
                    {lead.company && <div className="text-xs font-medium text-text-secondary flex items-center mb-2"><Building className="w-3.5 h-3.5 mr-1" />{lead.company}</div>}
                    <div className="text-[11px] text-text-secondary font-medium mt-3">{lead.createdAt?.toDate ? new Date(lead.createdAt.toDate()).toLocaleDateString() : 'Just now'}</div>
                    {/* AI score inline in pipeline card */}
                    {lead.aiAnalysis && (
                      <div className="mt-3 pt-3 border-t border-border-default flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Revenue Opportunity</span>
                        <span className={cn(
                          "text-[11px] font-bold px-2 py-0.5 rounded-md border",
                          lead.aiAnalysis.category === 'Hot' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                          lead.aiAnalysis.category === 'Warm' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          lead.aiAnalysis.category === 'Cold' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                          'bg-surface-secondary text-text-secondary border-border-default'
                        )}>{lead.aiAnalysis.score} · {lead.aiAnalysis.category}</span>
                      </div>
                    )}
                    {/* AI score button on pipeline card */}
                    <button
                      onClick={e => { e.stopPropagation(); handleScoreLead(lead); }}
                      disabled={aiScoringLoading[lead.id!]}
                      className="absolute top-3 right-3 p-1.5 text-text-secondary hover:text-violet-400 hover:bg-violet-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Analyze Opportunity"
                    >
                      {aiScoringLoading[lead.id!]
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Sparkles className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </Page>
  );
}
