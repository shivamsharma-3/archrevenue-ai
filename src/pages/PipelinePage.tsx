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
    leads, loading, openDetailsPanel, handleScoreLead, aiScoringLoading, setIsModalOpen, setIsImportModalOpen, setEditingLead, handleKanbanStatusChange
  } = useOutletContext<any>();

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      handleKanbanStatusChange(leadId, status);
    }
  };

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
          {['new', 'contacted', 'qualified', 'meeting_booked', 'proposal', 'lost', 'won'].map((status, index) => {
            const columnLeads = leads.filter((l: Lead) => l.status === status);
            return (
              <div key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className={cn(
                "w-[85vw] sm:w-auto sm:flex-1 shrink-0 min-w-[260px] p-4 h-full flex flex-col snap-center relative overflow-hidden bg-slate-50/40",
                index !== 6 && "border-r border-slate-200"
              )}>
                <h3 className="relative z-10 text-slate-800 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>{status === 'new' ? 'New Lead' : status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                  <span className="text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full text-xs font-mono font-medium">
                    {columnLeads.length}
                  </span>
                </h3>

                <div className="relative z-10 space-y-3 flex-1 overflow-y-auto pr-1 pb-2 hide-scrollbar">
                  {columnLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-lg bg-white/50">
                      <p className="text-[11px] font-medium text-slate-400">No leads at this stage</p>
                    </div>
                  ) : (
                    columnLeads.map((lead: Lead) => (
                      <div key={lead.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id!)}
                        onClick={() => openDetailsPanel(lead)} className="bg-white border border-slate-200 rounded-lg p-3.5 cursor-pointer hover:border-slate-300 hover:shadow-xs transition-all duration-200 group relative overflow-hidden">
                        <div className="font-semibold text-slate-900 mb-1 text-[13px] tracking-tight flex items-center justify-between">
                          <span className="truncate pr-2">{lead.fullName || 'Unknown'}</span>
                          {(() => {
                            const status = getFollowUpStatus(lead);
                            if (!status) return null;
                            if (status === 'overdue') return <span title="Overdue" className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>;
                            if (status === 'due_today') return <span title="Due Today" className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>;
                            if (status === 'scheduled') return <span title="Scheduled" className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>;
                            return null;
                          })()}
                        </div>
                        {lead.company && <div className="text-[12px] font-medium text-slate-500 flex items-center mb-1.5"><Building className="w-3 h-3 mr-1 text-slate-400" />{lead.company}</div>}
                        <div className="text-[11px] text-slate-400 font-medium">{lead.createdAt?.toDate ? new Date(lead.createdAt.toDate()).toLocaleDateString() : 'Just now'}</div>
                        
                        {/* AI score inline in pipeline card */}
                        {lead.aiAnalysis && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Score</span>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded border",
                              lead.aiAnalysis.category === 'Hot' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              lead.aiAnalysis.category === 'Warm' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              lead.aiAnalysis.category === 'Cold' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                              'bg-slate-50 text-slate-500 border-slate-200'
                            )}>{lead.aiAnalysis.score} · {lead.aiAnalysis.category}</span>
                          </div>
                        )}
                        {/* AI score button on pipeline card */}
                        <button
                          onClick={e => { e.stopPropagation(); handleScoreLead(lead); }}
                          disabled={aiScoringLoading[lead.id!]}
                          className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Analyze Opportunity"
                        >
                          {aiScoringLoading[lead.id!]
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Sparkles className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </Page>
  );
}
