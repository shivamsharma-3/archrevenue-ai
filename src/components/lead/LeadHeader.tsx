import React, { memo } from 'react';
import { Lead } from '../../lib/types';
import { cn } from '../../lib/utils';
import { Building, Mail, PhoneCall } from 'lucide-react';
import { AppCard } from '../ui/AppCard';

import { AppButton } from '../ui/AppButton';

interface LeadHeaderProps {
  lead: Lead;
  onStatusChange: (status: Lead['status']) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const LeadHeader = memo(({ lead, onStatusChange, onAnalyze, isAnalyzing }: LeadHeaderProps) => {
  return (
    <AppCard level={1} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
      
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center text-xl font-bold shadow-sm shrink-0">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-indigo-600 to-violet-600">
            {lead.fullName.substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-1.5">{lead.fullName}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            {lead.company ? (
              <span className="flex items-center text-text-secondary">
                <Building className="w-4 h-4 mr-1.5 text-text-tertiary" /> {lead.company}
              </span>
            ) : (
              <span className="flex items-center text-text-tertiary">—</span>
            )}
            {lead.email && (
              <span className="flex items-center text-text-secondary">
                <Mail className="w-4 h-4 mr-1.5 text-text-tertiary" /> {lead.email}
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center text-text-secondary">
                <PhoneCall className="w-4 h-4 mr-1.5 text-text-tertiary" /> {lead.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-end gap-4 shrink-0">
        <AppButton 
          variant="primary" 
          onClick={() => {
            if (lead.aiAnalysis) {
              if (window.confirm("This account has already been analyzed. Re-running will overwrite the existing score and strategy. Continue?")) {
                onAnalyze();
              }
            } else {
              onAnalyze();
            }
          }} 
          disabled={isAnalyzing}
          className="shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white h-10"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Account'}
        </AppButton>

        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary mb-1.5">Pipeline Stage</span>
          <div className="relative">
            <select
              value={lead.status || 'new'}
              onChange={(e) => onStatusChange(e.target.value as Lead['status'])}
              className={cn(
                "appearance-none px-4 py-2 rounded-xl text-sm font-bold border outline-none cursor-pointer pr-10 transition-colors shadow-sm",
                lead.status === 'won' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                lead.status === 'lost' ? "bg-red-50 text-red-600 border-red-200" :
                lead.status === 'qualified' ? "bg-amber-50 text-amber-700 border-amber-200" :
                lead.status === 'contacted' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                "bg-indigo-50 text-indigo-700 border-indigo-200"
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
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.5 1.5L6 6L10.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </AppCard>
  );
});

LeadHeader.displayName = 'LeadHeader';
