import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Lead, LeadStatus } from '../lib/types';
import { 
  Building, Sparkles, Loader2, Users, MoreHorizontal, Upload, 
  TrendingUp, CalendarCheck, CheckCircle, Trash2, X, Lightbulb, Edit2, Eye, Mail, Brain,
  Leaf, AlertTriangle, Search, DollarSign, Menu, Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getFollowUpStatus } from '../lib/utils';
import { EmptyState } from '../components/ui/EmptyState';
import { Page, PageHeader, PageActions, PageContent } from '../components/layout/PageLayout';
import { AppButton } from '../components/ui/AppButton';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export default function LeadsPage() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [emailLoadingId, setEmailLoadingId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    action: (() => void) | null;
    title: string;
    message: string;
    confirmText: string;
    isDestructive: boolean;
  }>({
    isOpen: false,
    action: null,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDestructive: false
  });

  const openConfirm = (title: string, message: string, confirmText: string, isDestructive: boolean, action: () => void) => {
    setConfirmState({ isOpen: true, action, title, message, confirmText, isDestructive });
  };
  const {
    leads, filteredLeads, loading, 
    showHint, setShowHint, showHelpTooltip, setShowHelpTooltip,
    showDirectoryMenu, setShowDirectoryMenu,
    filterHotOnly, setFilterHotOnly,
    filterUnanalyzed, setFilterUnanalyzed,
    filterAnalyzed, setFilterAnalyzed,
    filterFollowUpsDueToday, setFilterFollowUpsDueToday,
    filterNew, setFilterNew,
    filterOverdue, setFilterOverdue,
    filterNeedsEnrichment, setFilterNeedsEnrichment,
    filterHighValue, setFilterHighValue,
    selectedLeads, setSelectedLeads, toggleSelectLead, toggleSelectAll,
    allVisibleSelected, someSelected,
    handleExportCsv, handleBulkDelete, handleDelete,
    handleStatusChange, handleScoreLead,
    openDetailsPanel, openEditModal, setIsModalOpen, setEditingLead, setEmailingLead,
    aiScoringLoading, statusColors, search, setSearch, setIsImportModalOpen
  } = useOutletContext<any>();

  const directoryMenuRef = useRef<HTMLDivElement>(null);

  const filterOptions = [
    { 
      id: 'hot', label: 'Hot', icon: <span className="text-[12px]">🔥</span>, active: filterHotOnly, 
      onClick: () => { setFilterHotOnly((v: boolean) => !v); setFilterUnanalyzed(false); setFilterAnalyzed(false); }
    },
    { 
      id: 'analyzed', label: 'Analyzed', icon: <Brain className="w-3.5 h-3.5" />, active: filterAnalyzed, 
      onClick: () => { setFilterAnalyzed((v: boolean) => !v); setFilterUnanalyzed(false); setFilterHotOnly(false); }
    },
    { 
      id: 'unanalyzed', label: 'Unanalyzed', icon: <Sparkles className="w-3.5 h-3.5" />, active: filterUnanalyzed, 
      onClick: () => { setFilterUnanalyzed((v: boolean) => !v); setFilterHotOnly(false); setFilterAnalyzed(false); }
    },
    { 
      id: 'new', label: 'New Leads', icon: <Leaf className="w-3.5 h-3.5" />, active: filterNew, 
      onClick: () => setFilterNew((v: boolean) => !v)
    },
    { 
      id: 'due_today', label: 'Due Today', icon: <CalendarCheck className="w-3.5 h-3.5" />, active: filterFollowUpsDueToday, 
      onClick: () => { setFilterFollowUpsDueToday((v: boolean) => !v); setFilterOverdue(false); }
    },
    { 
      id: 'overdue', label: 'Overdue', icon: <AlertTriangle className="w-3.5 h-3.5" />, active: filterOverdue, 
      onClick: () => { setFilterOverdue((v: boolean) => !v); setFilterFollowUpsDueToday(false); }
    },
    { 
      id: 'needs_enrichment', label: 'Needs Enrichment', icon: <Search className="w-3.5 h-3.5" />, active: filterNeedsEnrichment, 
      onClick: () => setFilterNeedsEnrichment((v: boolean) => !v)
    },
    { 
      id: 'high_value', label: 'High Value', icon: <DollarSign className="w-3.5 h-3.5" />, active: filterHighValue, 
      onClick: () => setFilterHighValue((v: boolean) => !v)
    }
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showDirectoryMenu && directoryMenuRef.current && !directoryMenuRef.current.contains(event.target as Node)) {
        setShowDirectoryMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDirectoryMenu, setShowDirectoryMenu]);

  return (
    <>
    <Page className="h-screen overflow-hidden">
      
      <PageHeader title="Directory">
        <PageActions>
          <AppButton variant="secondary" leftIcon={<Upload className="w-4 h-4" />} onClick={() => {
            openConfirm(
              "Export Leads", 
              "Are you sure you want to export all leads as a CSV file?", 
              "Export", 
              false, 
              () => handleExportCsv()
            );
          }}>
            Export
          </AppButton>
          <AppButton variant="secondary" leftIcon={<Upload className="w-4 h-4" />} onClick={() => setIsImportModalOpen(true)}>
            Import
          </AppButton>
          <AppButton variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setEditingLead(null); setIsModalOpen(true); }}>
            New Lead
          </AppButton>
        </PageActions>
      </PageHeader>

      <PageContent className="flex-1 min-h-0 pt-2 pb-8 h-full flex flex-col w-full max-w-[1600px] mx-auto gap-4 overflow-hidden">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <div className="flex flex-wrap items-center gap-1.5 flex-1 bg-surface-background border border-border-default p-1.5 rounded-[var(--radius-input)]">
            {filterOptions.map(filter => (
              <button
                key={filter.id}
                onClick={filter.onClick}
                className={cn(
                  "flex flex-shrink-0 items-center space-x-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all",
                  filter.active 
                    ? "bg-text-primary text-text-inverse shadow-sm" 
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                )}
              >
                {filter.icon}
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
          
          <div className="flex-shrink-0 w-full sm:w-[280px] relative text-text-tertiary">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by name or company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 h-full min-h-[44px] bg-surface-background border border-border-default rounded-[var(--radius-input)] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-[13px] outline-none placeholder:text-text-tertiary text-text-primary"
            />
          </div>
        </div>

      <div className="bg-surface-card border border-border-default shadow-sm rounded-[var(--radius-card)] overflow-hidden flex flex-col flex-1 relative min-h-0">

        {someSelected && (
          <div className="relative z-10 px-5 py-3 flex items-center justify-between bg-indigo-500/[0.08] border-b border-indigo-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[13px] font-semibold text-indigo-300">{selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''} selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  openConfirm(
                    "Export Selected Leads",
                    `Are you sure you want to export ${selectedLeads.size} selected leads?`,
                    "Export",
                    false,
                    () => handleExportCsv()
                  );
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 bg-surface-card hover:bg-indigo-50 border border-indigo-200 transition-all shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Export Selected</span>
              </button>
              <button
                onClick={() => {
                  openConfirm(
                    "Delete Leads",
                    `Are you sure you want to delete ${selectedLeads.size} leads? This action cannot be undone.`,
                    "Delete Leads",
                    true,
                    () => handleBulkDelete()
                  );
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Selected</span>
              </button>
              <button
                onClick={() => setSelectedLeads(new Set())}
                className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto overflow-y-auto flex-1 relative z-10 hide-scrollbar">
          <table className="hidden md:table w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-border-default text-[10px] uppercase font-bold text-text-tertiary tracking-[0.15em] sticky top-0 z-10 bg-surface-header backdrop-blur-md">
              <tr>
                <th className="pl-5 pr-2 py-4 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0",
                      allVisibleSelected
                        ? "bg-text-primary border-text-primary"
                        : "border-border-default hover:border-border-active bg-surface-background"
                    )}
                  >
                    {allVisibleSelected && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </th>
                <th className="px-4 py-4">Contact</th>
                <th className="px-4 py-4">Business / Role</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Revenue Opportunity</th>
                <th className="px-4 py-4">Date Added</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default bg-surface-card">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="pl-5 pr-2 py-5 w-10"><div className="w-4 h-4 bg-surface-secondary rounded" /></td>
                    <td className="px-4 py-5"><div className="h-4 bg-surface-secondary rounded w-28 mb-2"/><div className="h-3 bg-surface-secondary rounded w-36"/></td>
                    <td className="px-4 py-5"><div className="h-4 bg-surface-secondary rounded w-24"/></td>
                    <td className="px-4 py-5"><div className="h-6 bg-surface-secondary rounded-full w-20"/></td>
                    <td className="px-4 py-5"><div className="h-6 bg-surface-secondary rounded-md w-20"/></td>
                    <td className="px-4 py-5"><div className="h-4 bg-surface-secondary rounded w-16"/></td>
                    <td className="px-4 py-5"></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-24">
                    <EmptyState
                      icon={<Users className="w-5 h-5" />}
                      title="No leads found"
                      description="Create a new lead or clear your active filters to see results here."
                      action={
                        <div className="mt-2 flex justify-center">
                          <AppButton variant="primary" onClick={() => { setEditingLead(null); setIsModalOpen(true); }}>
                            Add First Lead
                          </AppButton>
                        </div>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead: Lead) => {
                  const isSelected = selectedLeads.has(lead.id!);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => openDetailsPanel(lead)}
                      className={cn(
                        "hover:bg-surface-hover transition-colors duration-100 group cursor-pointer",
                        isSelected && "bg-indigo-50"
                      )}
                    >
                      <td 
                        className="pl-5 pr-2 py-5 w-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelectLead(lead.id!); }}
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-indigo-500 border-indigo-500"
                              : "border-border-default hover:border-indigo-400/50 bg-surface-card opacity-0 group-hover:opacity-100"
                          )}
                        >
                          {isSelected && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-surface-hover text-text-secondary border border-border-default flex items-center justify-center text-[10px] font-bold tracking-wider mr-3 shrink-0">
                            {lead.fullName ? lead.fullName.substring(0, 2).toUpperCase() : '??'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-text-primary tracking-wide flex items-center text-[13px] truncate">
                              <span className="truncate">{lead.fullName || 'Unknown'}</span>
                              {(() => {
                                const s = getFollowUpStatus(lead);
                                if (s === 'overdue')   return <span title="Overdue"   className="w-2 h-2 rounded-full bg-red-500   ml-2 shrink-0 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />;
                                if (s === 'due_today') return <span title="Due Today" className="w-2 h-2 rounded-full bg-amber-500 ml-2 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />;
                                if (s === 'scheduled') return <span title="Scheduled" className="w-2 h-2 rounded-full bg-teal-500 ml-2 shrink-0" />;
                                return null;
                              })()}
                            </div>
                            {lead.email && <div className="text-[11px] text-text-secondary mt-0.5 truncate">{lead.email}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        {lead.company ? (
                          <div className="flex items-center text-[12px] font-medium text-text-secondary truncate">
                            <Building className="w-3 h-3 mr-1.5 text-text-tertiary flex-shrink-0" />
                            <span className="truncate">{lead.company}</span>
                          </div>
                        ) : <span className="text-text-tertiary text-[12px]">—</span>}
                        {lead.phone && <div className="text-[11px] text-text-secondary mt-0.5 pl-4 truncate">{lead.phone}</div>}
                      </td>

                      <td className="px-4 py-5">
                        <div className="relative">
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border appearance-none outline-none cursor-pointer pr-6 transition-all w-full",
                              statusColors[lead.status] || "bg-surface-secondary text-text-secondary border-border-default",
                              "hover:opacity-80"
                            )}
                          >
                            <option value="new">New Lead</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="meeting_booked">Meeting Booked</option>
                            <option value="proposal">Proposal</option>
                            <option value="lost">Lost</option>
                            <option value="won">Won</option>
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-text-secondary">
                            <svg width="8" height="5" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        {lead.aiAnalysis ? (
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border tracking-wide",
                            lead.aiAnalysis.category === 'Hot'  ? "bg-orange-50 text-orange-600 border-orange-200" :
                            lead.aiAnalysis.category === 'Warm' ? "bg-amber-50 text-amber-600 border-amber-200" :
                            lead.aiAnalysis.category === 'Cold' ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                                                                 "bg-surface-secondary text-text-secondary border-border-default"
                          )}>
                            {lead.aiAnalysis.score} · {lead.aiAnalysis.category}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleScoreLead(lead); }}
                            disabled={aiScoringLoading[lead.id!]}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors flex items-center"
                          >
                            {aiScoringLoading[lead.id!] ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                            Analyze
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-5 text-text-secondary text-[12px]">
                        {lead.createdAt?.toDate
                          ? new Date(lead.createdAt.toDate()).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: '2-digit' })
                          : '—'}
                      </td>

                      <td 
                        className="px-4 py-5 text-right relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                          <div className="flex items-center space-x-1.5 bg-surface-card rounded-[var(--radius-card)] shadow-sm p-1 border border-border-default">
                            <button
                              onClick={(e) => { e.stopPropagation(); openDetailsPanel(lead); }}
                              className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-all"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleScoreLead(lead); }}
                              disabled={aiScoringLoading[lead.id!]}
                              className="p-1.5 text-text-tertiary hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                              title="Analyze Opportunity"
                            >
                              {aiScoringLoading[lead.id!] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setEmailLoadingId(lead.id!);
                                setTimeout(() => {
                                  setEmailingLead(lead); 
                                  setEmailLoadingId(null);
                                }, 10);
                              }}
                              className="p-1.5 text-text-tertiary hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all flex items-center justify-center w-7 h-7"
                              title="Send Email"
                            >
                              {emailLoadingId === lead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            </button>
                            <div className="w-px h-4 bg-surface-200 mx-1" />
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditModal(lead); }}
                              className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                e.preventDefault();
                                openConfirm(
                                  "Delete Lead",
                                  "Are you sure you want to delete this lead? This action cannot be undone.",
                                  "Delete",
                                  true,
                                  () => handleDelete(lead.id!)
                                );
                              }}
                              className="p-1.5 text-text-tertiary hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Mobile View */}
          <div className="md:hidden flex flex-col p-4 space-y-3">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-surface-card border border-border-default rounded-xl p-4">
                  <div className="h-4 bg-surface-secondary rounded w-1/2 mb-3" />
                  <div className="h-3 bg-surface-secondary rounded w-1/3" />
                </div>
              ))
            ) : filteredLeads.length === 0 ? (
              <div className="py-12 flex justify-center">
                <span className="text-sm text-text-secondary">No leads found</span>
              </div>
            ) : (
              filteredLeads.map((lead: Lead) => (
                <div key={lead.id} className="bg-surface-card border border-border-default rounded-xl p-4 flex flex-col gap-3 shadow-sm" onClick={() => openDetailsPanel(lead)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-text-primary text-[14px]">{lead.fullName || 'Unknown'}</h3>
                      {lead.company && <p className="text-text-secondary text-[12px] mt-0.5 flex items-center"><Building className="w-3 h-3 mr-1" />{lead.company}</p>}
                    </div>
                    {lead.aiAnalysis ? (
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] font-bold border",
                        lead.aiAnalysis.category === 'Hot' ? "bg-orange-50 text-orange-600 border-orange-200" :
                        lead.aiAnalysis.category === 'Warm' ? "bg-amber-50 text-amber-600 border-amber-200" :
                        "bg-indigo-50 text-indigo-600 border-indigo-200"
                      )}>{lead.aiAnalysis.score} · {lead.aiAnalysis.category}</span>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); handleScoreLead(lead); }} disabled={aiScoringLoading[lead.id!]} className="px-2 py-1 rounded-md border border-violet-200 text-violet-600 bg-violet-50 text-[10px] font-medium flex items-center">
                        {aiScoringLoading[lead.id!] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} Analyze
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-3 border-t border-border-default">
                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold border uppercase", statusColors[lead.status] || "bg-surface-secondary text-text-secondary border-border-default")}>
                      {lead.status}
                    </span>
                    <AppButton variant="secondary" size="sm" className="h-7 text-[11px] px-3" onClick={(e) => { e.stopPropagation(); openDetailsPanel(lead); }}>
                      View HQ
                    </AppButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </PageContent>
    </Page>
    <ConfirmModal 
      isOpen={confirmState.isOpen}
      onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      onConfirm={() => {
        if (confirmState.action) confirmState.action();
      }}
      title={confirmState.title}
      message={confirmState.message}
      confirmText={confirmState.confirmText}
      isDestructive={confirmState.isDestructive}
    />
    </>
  );
}
