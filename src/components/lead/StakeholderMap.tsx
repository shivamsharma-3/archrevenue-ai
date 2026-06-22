import React, { memo } from 'react';
import { Lead } from '../../lib/types';
import { AppCard } from '../ui/AppCard';
import { Users, User, CircleHelp } from 'lucide-react';
import { cn } from '../../lib/utils';

export const StakeholderMap = memo(({ lead, isPanel = false }: { lead: Lead, isPanel?: boolean }) => {
  // Currently, we only have one explicit contact (the lead themselves).
  // This component future-proofs the UI for relationship graphing.
  const stakeholders = [
    { name: lead.fullName, role: lead.title || 'Primary Contact', type: 'Champion', email: lead.email, phone: lead.phone },
    { name: 'Unknown', role: 'Decision Maker', type: 'Economic Buyer', missing: true },
    { name: 'Unknown', role: 'Technical Evaluation', type: 'Technical Buyer', missing: true },
  ];

  return (
    <AppCard level={1}>
      <div className="flex items-center gap-2 mb-6 border-b border-border-default pb-4">
        <Users className="w-5 h-5 text-indigo-500" />
        <h2 className="text-[16px] font-semibold text-text-primary">Stakeholder Map</h2>
      </div>

      <div className={cn("grid gap-4", isPanel ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3")}>
        {stakeholders.map((person, i) => (
          <div key={i} className={`p-4 rounded-xl border ${person.missing ? 'bg-surface-background border-dashed border-border-default opacity-60' : 'bg-surface-secondary border-border-default'}`}>
            <div className="flex items-start justify-between mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${person.missing ? 'bg-surface-hover text-text-tertiary' : 'bg-indigo-100 text-indigo-700'}`}>
                {person.type}
              </span>
              {person.missing ? <CircleHelp className="w-4 h-4 text-text-tertiary" /> : <User className="w-4 h-4 text-indigo-500" />}
            </div>
            <h4 className="text-[14px] font-semibold text-text-primary">{person.name}</h4>
            <p className="text-[12px] text-text-secondary mt-0.5">{person.role}</p>
            
            {!person.missing && (person.email || person.phone) && (
              <div className="mt-3 pt-3 border-t border-border-default flex flex-col gap-1">
                {person.email && <span className="text-[11px] text-text-tertiary truncate">{person.email}</span>}
                {person.phone && <span className="text-[11px] text-text-tertiary">{person.phone}</span>}
              </div>
            )}
            
            {person.missing && (
              <p className="text-[11px] text-text-tertiary mt-3 pt-3 border-t border-border-default border-dashed">
                Identify via LinkedIn
              </p>
            )}
          </div>
        ))}
      </div>
    </AppCard>
  );
});

StakeholderMap.displayName = 'StakeholderMap';
