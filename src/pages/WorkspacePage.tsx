import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { Lead } from '../lib/types';
import { getFollowUpStatus } from '../lib/utils';
import { Page, PageHeader, PageActions, PageContent } from '../components/layout/PageLayout';
import { AppButton } from '../components/ui/AppButton';
import { AppBadge } from '../components/ui/AppBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { 
  Plus, Upload, Search, Filter, LayoutList, Kanban, Building, 
  Sparkles, Loader2, Clock, Flame, AlertTriangle, ArrowUpDown, Download, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function WorkspacePage() {
  const {
    leads = [], loading, openDetailsPanel, handleScoreLead, aiScoringLoading = {},
    setIsModalOpen, setIsImportModalOpen, setEditingLead, handleKanbanStatusChange, handleExportCsv
  } = useOutletContext<any>();

  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial view mode based on route (e.g. /pipeline defaults to board, /leads to table)
  const initialViewMode = location.pathname.includes('/pipeline') ? 'board' : 'table';
  const [viewMode, setViewMode] = useState<'table' | 'board'>(initialViewMode);
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'hot' | 'unanalyzed' | 'overdue' | 'won' | 'lost'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'newest' | 'name'>('score');
  const [isTaskStripOpen, setIsTaskStripOpen] = useState(true);

  // Computed metrics & Task Queue
  const { filteredLeads, hotCount, unscoredCount, overdueCount, dueTodayCount } = useMemo(() => {
    const all = (leads || []) as Lead[];
    let hot = 0, unscored = 0, overdue = 0, dueToday = 0;

    all.forEach(l => {
      if (l.status === 'won' || l.status === 'lost') return;
      if (!l.aiAnalysis) unscored++;
      else if (l.aiAnalysis.category === 'Hot') hot++;

      const fuStatus = getFollowUpStatus(l);
      if (fuStatus === 'overdue') overdue++;
      if (fuStatus === 'due_today') dueToday++;
    });

    let res = all.filter(l => {
      // Search
      const q = search.toLowerCase().trim();
      const matchSearch = !q || (
        l.fullName?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q)
      );
      if (!matchSearch) return false;

      // Filter Pill
      if (activeFilter === 'hot') return l.aiAnalysis?.category === 'Hot';
      if (activeFilter === 'unanalyzed') return !l.aiAnalysis;
      if (activeFilter === 'overdue') return getFollowUpStatus(l) === 'overdue';
      if (activeFilter === 'won') return l.status === 'won';
      if (activeFilter === 'lost') return l.status === 'lost';
      return true;
    });

    // Sort
    res.sort((a, b) => {
      if (sortBy === 'score') return (b.aiAnalysis?.score ?? -1) - (a.aiAnalysis?.score ?? -1);
      if (sortBy === 'newest') {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return tB - tA;
      }
      return (a.fullName || '').localeCompare(b.fullName || '');
    });

    return {
      filteredLeads: res,
      hotCount: hot,
      unscoredCount: unscored,
      overdueCount: overdue,
      dueTodayCount: dueToday,
    };
  }, [leads, search, activeFilter, sortBy]);

  // Drag & Drop handlers for Board view
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId && handleKanbanStatusChange) {
      handleKanbanStatusChange(leadId, status);
    }
  };

  const handleAddLead = () => { setEditingLead(null); setIsModalOpen(true); };
  const handleImport = () => setIsImportModalOpen(true);

  if (loading) {
    return (
      <Page>
        <PageHeader title="Workspace" />
        <PageContent className="items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center justify-center space-y-3 text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
            <span className="text-[13px] font-medium">Loading Workspace...</span>
          </div>
        </PageContent>
      </Page>
    );
  }

  // Consistent Status Pill renderer
  const renderStatusPill = (status: Lead['status']) => {
    const map: Record<string, { label: string; style: string }> = {
      new: { label: 'New Lead', style: 'bg-slate-100 text-slate-700 border-slate-200' },
      contacted: { label: 'Contacted', style: 'bg-blue-50 text-blue-700 border-blue-200' },
      qualified: { label: 'Qualified', style: 'bg-amber-50 text-amber-700 border-amber-200' },
      meeting_booked: { label: 'Meeting Booked', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      proposal: { label: 'Proposal', style: 'bg-purple-50 text-purple-700 border-purple-200' },
      won: { label: 'Won', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      lost: { label: 'Lost', style: 'bg-rose-50 text-rose-700 border-rose-200' },
    };
    const item = map[status] || { label: status, style: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium border inline-block whitespace-nowrap', item.style)}>
        {item.label}
      </span>
    );
  };

  return (
    <Page>
      {/* HEADER */}
      <PageHeader 
        title="Workspace" 
        description="Unified lead intelligence and pipeline management."
      >
        <PageActions>
          <AppButton variant="secondary" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={handleExportCsv}>
            Export CSV
          </AppButton>
          <AppButton variant="secondary" leftIcon={<Upload className="w-3.5 h-3.5" />} onClick={handleImport}>
            Import CSV
          </AppButton>
          <AppButton variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddLead}>
            Add Lead
          </AppButton>
        </PageActions>
      </PageHeader>

      <PageContent className="space-y-4 pt-2">
        {/* COLLAPSIBLE TODAY'S TASKS BANNER */}
        {(unscoredCount > 0 || overdueCount > 0 || dueTodayCount > 0) && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div 
              onClick={() => setIsTaskStripOpen(!isTaskStripOpen)}
              className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <h3 className="text-[13px] font-semibold text-slate-900">Today's Workspace Tasks</h3>
                <div className="flex items-center gap-2">
                  {unscoredCount > 0 && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {unscoredCount} unscored
                    </span>
                  )}
                  {overdueCount > 0 && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                      {overdueCount} overdue
                    </span>
                  )}
                  {dueTodayCount > 0 && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                      {dueTodayCount} due today
                    </span>
                  )}
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1 font-medium">
                {isTaskStripOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isTaskStripOpen && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {unscoredCount > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-semibold text-slate-800">{unscoredCount} leads need AI scoring</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Run scoring to identify high-value ICP fit.</p>
                    </div>
                    <button 
                      onClick={() => setActiveFilter('unanalyzed')}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shrink-0 transition-colors"
                    >
                      Filter Unscored
                    </button>
                  </div>
                )}
                {overdueCount > 0 && (
                  <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-semibold text-rose-900">{overdueCount} follow-ups overdue</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">Action immediately before leads cold out.</p>
                    </div>
                    <button 
                      onClick={() => setActiveFilter('overdue')}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md shrink-0 transition-colors"
                    >
                      Filter Overdue
                    </button>
                  </div>
                )}
                {hotCount > 0 && (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-semibold text-emerald-900">{hotCount} 🔥 Hot opportunities ready</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">High score leads awaiting outreach.</p>
                    </div>
                    <button 
                      onClick={() => setActiveFilter('hot')}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shrink-0 transition-colors"
                    >
                      View Hot Deals
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CONTROLS BAR: SEARCH + FILTER PILLS + VIEW TOGGLE */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
          {/* Search & Sort */}
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search leads, companies, emails..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:bg-white text-slate-900 placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-600 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent focus:outline-none font-medium text-slate-800 cursor-pointer"
              >
                <option value="score">Sort: Highest Score</option>
                <option value="newest">Sort: Newest First</option>
                <option value="name">Sort: Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 hide-scrollbar">
            {[
              { id: 'all', label: `All (${leads.length})` },
              { id: 'hot', label: `🔥 Hot (${hotCount})` },
              { id: 'unanalyzed', label: `⚡ Unscored (${unscoredCount})` },
              { id: 'overdue', label: `⚠️ Overdue (${overdueCount})` },
              { id: 'won', label: `Won` },
              { id: 'lost', label: `Lost` },
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setActiveFilter(pill.id as any)}
                className={cn(
                  "px-3 py-1 text-[12px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0",
                  activeFilter === pill.id 
                    ? "bg-indigo-600 text-white font-semibold shadow-xs" 
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* View Switcher (Table ↔ Board) */}
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "px-3 py-1 text-[12px] font-semibold rounded-md flex items-center gap-1.5 transition-all",
                viewMode === 'table' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                "px-3 py-1 text-[12px] font-semibold rounded-md flex items-center gap-1.5 transition-all",
                viewMode === 'board' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Kanban className="w-3.5 h-3.5" />
              Board
            </button>
          </div>
        </div>

        {/* ── TABLE VIEW MODE ──────────────────────────────────────────────────────── */}
        {viewMode === 'table' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {filteredLeads.length === 0 ? (
              <EmptyState
                title="No leads match your filter"
                description="Try clearing your search query or switching active filter pills."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">AI Score</th>
                      <th className="py-3 px-4">Follow-up</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead: Lead) => {
                      const fuStatus = getFollowUpStatus(lead);
                      return (
                        <tr 
                          key={lead.id}
                          onClick={() => openDetailsPanel(lead)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          {/* Name & Email */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {lead.fullName || 'Unnamed Lead'}
                            </div>
                            <div className="text-[12px] text-slate-400">{lead.email || 'No email provided'}</div>
                          </td>

                          {/* Company */}
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {lead.company || '—'}
                          </td>

                          {/* Status Pill */}
                          <td className="py-3.5 px-4">
                            {renderStatusPill(lead.status)}
                          </td>

                          {/* AI Score Badge */}
                          <td className="py-3.5 px-4">
                            {lead.aiAnalysis ? (
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block",
                                lead.aiAnalysis.category === 'Hot' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                lead.aiAnalysis.category === 'Warm' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                lead.aiAnalysis.category === 'Cold' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                                'bg-slate-50 text-slate-500 border-slate-200'
                              )}>
                                {lead.aiAnalysis.score}/100 · {lead.aiAnalysis.category}
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                                Unscored
                              </span>
                            )}
                          </td>

                          {/* Follow-up Status */}
                          <td className="py-3.5 px-4">
                            {fuStatus === 'overdue' ? (
                              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                ⚠️ Overdue
                              </span>
                            ) : fuStatus === 'due_today' ? (
                              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                ⏰ Due Today
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-400">Scheduled</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleScoreLead(lead)}
                                disabled={aiScoringLoading[lead.id!]}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded border border-slate-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                {aiScoringLoading[lead.id!] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                Score
                              </button>
                              <button
                                onClick={() => openDetailsPanel(lead)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-200 transition-colors"
                              >
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── BOARD VIEW MODE (KANBAN) ─────────────────────────────────────────────── */}
        {viewMode === 'board' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs p-4">
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 hide-scrollbar">
              {['new', 'contacted', 'qualified', 'meeting_booked', 'proposal', 'lost', 'won'].map((status, index) => {
                const colLeads = filteredLeads.filter((l: Lead) => l.status === status);
                return (
                  <div 
                    key={status}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                    className="w-[280px] shrink-0 p-3 bg-slate-50/60 rounded-xl border border-slate-200/80 flex flex-col snap-center min-h-[500px]"
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[12px] font-semibold text-slate-800 uppercase tracking-wider">
                        {status === 'new' ? 'New Lead' : status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                        {colLeads.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5 hide-scrollbar">
                      {colLeads.length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg bg-white/60">
                          <p className="text-[11px] font-medium text-slate-400">No leads at this stage</p>
                        </div>
                      ) : (
                        colLeads.map((lead: Lead) => (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={e => handleDragStart(e, lead.id!)}
                            onClick={() => openDetailsPanel(lead)}
                            className="bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-slate-300 hover:shadow-xs transition-all group relative"
                          >
                            <div className="font-semibold text-slate-900 text-[13px] mb-1 flex items-center justify-between">
                              <span className="truncate pr-2">{lead.fullName || 'Unnamed Lead'}</span>
                              {getFollowUpStatus(lead) === 'overdue' && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Overdue" />
                              )}
                            </div>
                            
                            {lead.company && (
                              <div className="text-[11px] font-medium text-slate-500 flex items-center mb-2">
                                <Building className="w-3 h-3 mr-1 text-slate-400" />
                                {lead.company}
                              </div>
                            )}

                            {lead.aiAnalysis && (
                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Score</span>
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded border",
                                  lead.aiAnalysis.category === 'Hot' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  lead.aiAnalysis.category === 'Warm' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-slate-100 text-slate-700 border-slate-200'
                                )}>
                                  {lead.aiAnalysis.score} · {lead.aiAnalysis.category}
                                </span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PageContent>
    </Page>
  );
}
