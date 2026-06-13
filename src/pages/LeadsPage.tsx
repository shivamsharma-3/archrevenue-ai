import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Lead, LeadStatus } from '../lib/types';
import { 
  Building, Sparkles, Loader2, Users, MoreHorizontal, Upload, 
  TrendingUp, CalendarCheck, CheckCircle, Trash2, X, Lightbulb, Edit2, Eye 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getFollowUpStatus } from '../lib/utils';

export default function LeadsPage() {
  const {
    leads, filteredLeads, loading, 
    showHint, setShowHint, showHelpTooltip, setShowHelpTooltip,
    showDirectoryMenu, setShowDirectoryMenu,
    filterHotOnly, setFilterHotOnly,
    filterUnanalyzed, setFilterUnanalyzed,
    filterFollowUpsDueToday, setFilterFollowUpsDueToday,
    selectedLeads, setSelectedLeads, toggleSelectLead, toggleSelectAll,
    allVisibleSelected, someSelected,
    handleExportCsv, handleBulkDelete, handleDelete,
    handleStatusChange, handleScoreLead,
    openDetailsPanel, openEditModal, setIsModalOpen, setEditingLead,
    aiScoringLoading, statusColors
  } = useOutletContext<any>();

  const directoryMenuRef = useRef<HTMLDivElement>(null);

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
    <div className="max-w-[1600px] mx-auto space-y-4 pb-10">
      {showHint && (
        <div className="px-6 py-3 bg-[#1c1c1f] border border-white/[0.08] rounded-2xl flex items-center justify-between shadow-lg">
          <p className="text-xs text-zinc-300"><strong>Tip:</strong> Click any lead to view AI analysis, research, outreach, and activity history.</p>
          <button onClick={() => { setShowHint(false); localStorage.setItem('hideLeadDiscoveryHint', 'true'); }} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X className="w-4 h-4"/></button>
        </div>
      )}
      
      <div className="bg-white/[0.05] border border-white/[0.08] shadow-2xl rounded-[24px] overflow-hidden backdrop-blur-xl flex flex-col h-full">
        <div className="px-6 py-5 flex items-center justify-between border-b border-white/[0.04]">
          <h2 className="text-[17px] font-semibold text-white tracking-tight">Active Directory</h2>
          <div className="flex items-center space-x-2">
            <div 
              className="relative"
              onMouseEnter={() => setShowHelpTooltip(true)}
              onMouseLeave={() => setShowHelpTooltip(false)}
            >
              <button className="p-1.5 text-yellow-500 hover:text-yellow-400 transition-colors rounded-lg hover:bg-white/[0.05] cursor-default">
                <Lightbulb className="w-5 h-5" fill="currentColor" />
              </button>
              {showHelpTooltip && (
                  <div className="absolute top-10 right-0 w-72 bg-[#1c1c1f] border border-white/[0.1] rounded-2xl p-5 shadow-2xl z-50 text-left cursor-default pointer-events-none">
                    <p className="text-sm font-medium text-white mb-3">Click any lead to open the AI Intelligence Panel.</p>
                    <p className="text-xs text-zinc-400 mb-2">Inside each lead you can view:</p>
                    <ul className="text-xs text-zinc-300 space-y-1.5 list-disc pl-4">
                      <li>AI Score</li>
                      <li>AI Reasoning</li>
                      <li>Company Research</li>
                      <li>Outreach Scripts</li>
                      <li>Activity Timeline</li>
                      <li>Qualification Data</li>
                    </ul>
                  </div>
              )}
            </div>
            <div className="relative" ref={directoryMenuRef}>
              <button onClick={() => { setShowDirectoryMenu(!showDirectoryMenu); setShowHelpTooltip(false); }} className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showDirectoryMenu && (
                <div className="absolute top-10 right-0 w-52 bg-[#141416] border border-white/[0.1] rounded-2xl py-2 shadow-2xl z-50 text-left overflow-hidden">
                  <button
                    onClick={handleExportCsv}
                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center space-x-2.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{selectedLeads.size > 0 ? `Export ${selectedLeads.size} Selected` : 'Export All as CSV'}</span>
                  </button>
                  <div className="h-px bg-white/[0.05] my-1" />
                  <button
                    onClick={() => { setFilterHotOnly((v: boolean) => !v); setFilterUnanalyzed(false); setShowDirectoryMenu(false); }}
                    className={cn("w-full text-left px-4 py-2.5 text-xs flex items-center justify-between", filterHotOnly ? "text-emerald-400 bg-emerald-500/[0.06]" : "text-zinc-300 hover:text-white hover:bg-white/[0.06]")}
                  >
                    <div className="flex items-center space-x-2.5">
                      <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Hot Leads Only</span>
                    </div>
                    {filterHotOnly && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                  <button
                    onClick={() => { setFilterUnanalyzed((v: boolean) => !v); setFilterHotOnly(false); setShowDirectoryMenu(false); }}
                    className={cn("w-full text-left px-4 py-2.5 text-xs flex items-center justify-between", filterUnanalyzed ? "text-violet-400 bg-violet-500/[0.06]" : "text-zinc-300 hover:text-white hover:bg-white/[0.06]")}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Unanalyzed Only</span>
                    </div>
                    {filterUnanalyzed && <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                  </button>
                  <button
                    onClick={() => { setFilterFollowUpsDueToday((v: boolean) => !v); setShowDirectoryMenu(false); }}
                    className={cn("w-full text-left px-4 py-2.5 text-xs flex items-center justify-between", filterFollowUpsDueToday ? "text-amber-400 bg-amber-500/[0.06]" : "text-zinc-300 hover:text-white hover:bg-white/[0.06]")}
                  >
                    <div className="flex items-center space-x-2.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Follow-Ups Due</span>
                    </div>
                    {filterFollowUpsDueToday && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </button>
                  <div className="h-px bg-white/[0.05] my-1" />
                  <button
                    onClick={() => { toggleSelectAll(); setShowDirectoryMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center space-x-2.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{allVisibleSelected ? 'Deselect All' : 'Select All'}</span>
                  </button>
                  {someSelected && (
                    <button
                      onClick={() => { handleBulkDelete(); setShowDirectoryMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/[0.06] flex items-center space-x-2.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete {selectedLeads.size} Selected</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {someSelected && (
          <div className="px-5 py-3 flex items-center justify-between bg-indigo-500/10 border-b border-indigo-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[13px] font-semibold text-indigo-300">{selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''} selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCsv}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Export Selected</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Selected</span>
              </button>
              <button
                onClick={() => setSelectedLeads(new Set())}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-colors"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto overflow-y-auto shadow-2xl flex-1" style={{ height: 'calc(100vh - 220px)' }}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-white/[0.04] text-[10px] uppercase font-bold text-zinc-500 tracking-widest sticky top-0 z-10 bg-[#121214] backdrop-blur-xl">
              <tr>
                <th className="pl-5 pr-2 py-4 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0",
                      allVisibleSelected
                        ? "bg-indigo-500 border-indigo-500"
                        : "border-white/[0.15] hover:border-indigo-500/60"
                    )}
                  >
                    {allVisibleSelected && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </th>
                <th className="px-4 py-4">CONTACT</th>
                <th className="px-4 py-4">BUSINESS / ROLE</th>
                <th className="px-4 py-4">STATUS</th>
                <th className="px-4 py-4">AI SCORE</th>
                <th className="px-4 py-4">DATE ADDED</th>
                <th className="px-4 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse bg-white/[0.01]">
                    <td className="pl-5 pr-2 py-5 w-10"><div className="w-4 h-4 bg-white/[0.05] rounded" /></td>
                    <td className="px-4 py-5"><div className="h-4 bg-white/[0.05] rounded w-28 mb-2"/><div className="h-3 bg-white/[0.03] rounded w-36"/></td>
                    <td className="px-4 py-5"><div className="h-4 bg-white/[0.05] rounded w-24"/></td>
                    <td className="px-4 py-5"><div className="h-6 bg-white/[0.05] rounded-full w-20"/></td>
                    <td className="px-4 py-5"><div className="h-6 bg-white/[0.05] rounded-md w-20"/></td>
                    <td className="px-4 py-5"><div className="h-4 bg-white/[0.05] rounded w-16"/></td>
                    <td className="px-4 py-5"></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-24 text-center text-zinc-500">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-5 relative">
                        <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping opacity-20" />
                        <Users className="w-7 h-7 text-white/20" />
                      </div>
                      <p className="font-semibold text-lg text-white mb-2">No leads found</p>
                      <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-5">Create a new lead or clear your active filters.</p>
                      <button
                        onClick={() => { setEditingLead(null); setIsModalOpen(true); }}
                        className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl text-sm hover:bg-zinc-200 transition-colors"
                      >
                        Add First Lead
                      </button>
                    </div>
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
                        "hover:bg-white/[0.03] transition-colors duration-200 group cursor-pointer",
                        isSelected && "bg-indigo-500/[0.05]"
                      )}
                    >
                      <td className="pl-5 pr-2 py-5 w-10">
                        <button
                          onClick={(e) => toggleSelectLead(lead.id!, e)}
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-indigo-500 border-indigo-500"
                              : "border-white/[0.15] hover:border-indigo-500/60 opacity-0 group-hover:opacity-100"
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
                          <div className="w-8 h-8 rounded-full bg-[#1c1c1f] text-zinc-400 border border-white/[0.05] flex items-center justify-center text-[10px] font-bold tracking-wider mr-3 shrink-0">
                            {lead.fullName ? lead.fullName.substring(0, 2).toUpperCase() : '??'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white tracking-wide flex items-center text-[13px] truncate">
                              <span className="truncate">{lead.fullName || 'Unknown'}</span>
                              {(() => {
                                const s = getFollowUpStatus(lead);
                                if (s === 'overdue')   return <span title="Overdue"   className="w-2 h-2 rounded-full bg-red-500   ml-2 shrink-0 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />;
                                if (s === 'due_today') return <span title="Due Today" className="w-2 h-2 rounded-full bg-amber-500 ml-2 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />;
                                if (s === 'scheduled') return <span title="Scheduled" className="w-2 h-2 rounded-full bg-emerald-500 ml-2 shrink-0" />;
                                return null;
                              })()}
                            </div>
                            {lead.email && <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{lead.email}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        {lead.company ? (
                          <div className="flex items-center text-[12px] font-medium text-white truncate">
                            <Building className="w-3 h-3 mr-1.5 text-zinc-500 flex-shrink-0" />
                            <span className="truncate">{lead.company}</span>
                          </div>
                        ) : <span className="text-zinc-600 text-[12px]">—</span>}
                        {lead.phone && <div className="text-[11px] text-zinc-500 mt-0.5 pl-4 truncate">{lead.phone}</div>}
                      </td>

                      <td className="px-4 py-5">
                        <div className="relative">
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "px-2.5 py-1.5 rounded-md text-[11px] font-medium border appearance-none outline-none cursor-pointer pr-6 transition-colors w-full",
                              statusColors[lead.status],
                              "hover:opacity-80"
                            )}
                          >
                            <option value="new"       className="bg-zinc-900 text-white">New</option>
                            <option value="contacted" className="bg-zinc-900 text-white">Contacted</option>
                            <option value="qualified" className="bg-zinc-900 text-white">Qualified</option>
                            <option value="lost"      className="bg-zinc-900 text-white">Lost</option>
                            <option value="won"       className="bg-zinc-900 text-white">Won</option>
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
                            <svg width="8" height="5" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        {lead.aiAnalysis ? (
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold border tracking-wide",
                            lead.aiAnalysis.category === 'Hot'  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]" :
                            lead.aiAnalysis.category === 'Warm' ? "bg-amber-500/15  text-amber-400  border-amber-500/20" :
                                                                   "bg-blue-500/15   text-blue-400   border-blue-500/20"
                          )}>
                            {lead.aiAnalysis.score} · {lead.aiAnalysis.category}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleScoreLead(lead); }}
                            disabled={aiScoringLoading[lead.id!]}
                            className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-violet-500/30 text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 transition-colors flex items-center"
                          >
                            {aiScoringLoading[lead.id!] ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                            Score
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-5 text-zinc-500 text-[12px]">
                        {lead.createdAt?.toDate
                          ? new Date(lead.createdAt.toDate()).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: '2-digit' })
                          : '—'}
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openDetailsPanel(lead); }}
                            className="p-1.5 text-zinc-500 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(lead); }}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(lead.id!); }}
                            className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
