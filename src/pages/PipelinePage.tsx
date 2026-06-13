import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Lead } from '../lib/types';
import { Building, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { getFollowUpStatus } from '../lib/utils';

export default function PipelinePage() {
  const {
    leads, openDetailsPanel, handleScoreLead, aiScoringLoading
  } = useOutletContext<any>();

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      <div className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory rounded-[24px] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.4)]" style={{ height: 'calc(100vh - 180px)' }}>
        {['new', 'contacted', 'qualified', 'lost', 'won'].map((status, index) => (
          <div key={status} className={cn(
            "flex-1 min-w-[260px] md:min-w-[300px] p-5 h-full flex flex-col snap-center relative overflow-hidden backdrop-blur-xl",
            index !== 4 && "border-r border-white/[0.05]",
            status === 'won' ? 'bg-emerald-500/[0.02]' :
            status === 'lost' ? 'bg-red-500/[0.02]' :
            status === 'qualified' ? 'bg-amber-500/[0.02]' :
            status === 'contacted' ? 'bg-purple-500/[0.02]' :
            'bg-blue-500/[0.02]'
          )}>
            <div className={cn("absolute inset-0 pointer-events-none opacity-50",
              status === 'won' ? 'bg-gradient-to-b from-emerald-500/[0.05] to-transparent' :
              status === 'lost' ? 'bg-gradient-to-b from-red-500/[0.05] to-transparent' :
              status === 'qualified' ? 'bg-gradient-to-b from-amber-500/[0.05] to-transparent' :
              status === 'contacted' ? 'bg-gradient-to-b from-purple-500/[0.05] to-transparent' :
              'bg-gradient-to-b from-blue-500/[0.05] to-transparent'
            )} />
            <h3 className="relative z-10 text-zinc-300 text-sm font-semibold uppercase tracking-wider mb-5 flex items-center justify-between">
              <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
              <span className="text-zinc-400 bg-white/[0.05] border border-white/[0.1] px-2.5 py-0.5 rounded-full text-xs font-semibold">
                {leads.filter((l: Lead) => l.status === status).length}
              </span>
            </h3>
            <div className="relative z-10 space-y-3 flex-1 overflow-y-auto pr-1">
              {leads.filter((l: Lead) => l.status === status).map((lead: Lead) => (
                <div key={lead.id} onClick={() => openDetailsPanel(lead)} className="bg-white/[0.03] shadow-lg border border-white/[0.05] rounded-2xl p-5 cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.1] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 group relative overflow-hidden backdrop-blur-2xl">
                  <div className="font-semibold text-white mb-1.5 tracking-wide flex items-center justify-between">
                    <span className="truncate pr-2">{lead.fullName || 'Unknown'}</span>
                    {(() => {
                      const status = getFollowUpStatus(lead);
                      if (!status) return null;
                      if (status === 'overdue') return <span title="Overdue" className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>;
                      if (status === 'due_today') return <span title="Due Today" className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>;
                      if (status === 'scheduled') return <span title="Scheduled" className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>;
                      if (status === 'completed') return <span title="Completed" className="w-2 h-2 rounded-full bg-zinc-500 shrink-0"></span>;
                      return null;
                    })()}
                  </div>
                  {lead.company && <div className="text-xs font-medium text-zinc-500 flex items-center mb-2"><Building className="w-3.5 h-3.5 mr-1" />{lead.company}</div>}
                  <div className="text-[11px] text-zinc-600 font-medium mt-3">{lead.createdAt?.toDate ? new Date(lead.createdAt.toDate()).toLocaleDateString() : 'Just now'}</div>
                  {/* AI score inline in pipeline card */}
                  {lead.aiAnalysis && (
                    <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">AI Score</span>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        lead.aiAnalysis.category === 'Hot' ? 'bg-emerald-500/15 text-emerald-400' :
                        lead.aiAnalysis.category === 'Warm' ? 'bg-amber-500/15 text-amber-400' :
                        lead.aiAnalysis.category === 'Cold' ? 'bg-blue-500/15 text-blue-400' :
                        'bg-zinc-500/15 text-zinc-500'
                      )}>{lead.aiAnalysis.score} · {lead.aiAnalysis.category}</span>
                    </div>
                  )}
                  {/* AI score button on pipeline card */}
                  <button
                    onClick={e => { e.stopPropagation(); handleScoreLead(lead); }}
                    disabled={aiScoringLoading[lead.id!]}
                    className="absolute top-3 right-3 p-1.5 text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Update AI Score"
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
  );
}
