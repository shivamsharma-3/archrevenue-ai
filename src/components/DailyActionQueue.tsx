import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Lead } from '../lib/types';
import { getFollowUpStatus } from '../lib/utils';
import { Flame, Clock, AlertTriangle, Sparkles, Mail, ArrowRight, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface ActionItem {
  leadId: string;
  lead: Lead;
  priority: 1 | 2 | 3;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  label: string;
  description: string;
  estimatedValue: number;
  actions: { label: string; variant: 'primary' | 'secondary'; onClick: () => void }[];
}

interface DailyActionQueueProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onScoreLead: (lead: Lead) => void;
}

export default function DailyActionQueue({ leads, onLeadClick, onScoreLead }: DailyActionQueueProps) {
  const queue = useMemo((): ActionItem[] => {
    const items: ActionItem[] = [];

    leads.forEach(lead => {
      if (lead.status === 'won' || lead.status === 'lost') return;

      const followUpStatus = getFollowUpStatus(lead);

      // P1 — Overdue follow-ups
      if (followUpStatus === 'overdue') {
        items.push({
          leadId: lead.id!,
          lead,
          priority: 1,
          icon: AlertTriangle,
          iconColor: 'text-rose-500',
          iconBg: 'bg-rose-50',
          borderColor: 'border-rose-200',
          label: `Overdue: ${lead.fullName}`,
          description: `${lead.company ? `at ${lead.company}` : ''} — follow-up is past due. Act now before they go cold.`,
          estimatedValue: lead.aiAnalysis?.category === 'Hot' ? 8000 : 3000,
          actions: [
            { label: 'Open Deal', variant: 'primary', onClick: () => onLeadClick(lead) },
          ],
        });
      }

      // P1 — Hot leads with no outreach playbook
      else if (lead.aiAnalysis?.category === 'Hot' && !lead.aiAnalysis?.followUp?.email) {
        items.push({
          leadId: lead.id!,
          lead,
          priority: 1,
          icon: Flame,
          iconColor: 'text-orange-500',
          iconBg: 'bg-orange-50',
          borderColor: 'border-orange-200',
          label: `🔥 Hot lead needs outreach: ${lead.fullName}`,
          description: `${lead.company || ''} scored ${lead.aiAnalysis.score}/100 but has no outreach drafted yet. Strike while it's hot.`,
          estimatedValue: 8000,
          actions: [
            { label: 'Generate Playbook', variant: 'primary', onClick: () => onLeadClick(lead) },
          ],
        });
      }

      // P2 — Due today
      else if (followUpStatus === 'due_today') {
        items.push({
          leadId: lead.id!,
          lead,
          priority: 2,
          icon: Clock,
          iconColor: 'text-amber-500',
          iconBg: 'bg-amber-50',
          borderColor: 'border-amber-200',
          label: `Follow up today: ${lead.fullName}`,
          description: `${lead.company ? `at ${lead.company}` : ''} — scheduled for today.`,
          estimatedValue: lead.aiAnalysis?.category === 'Warm' ? 3500 : 2000,
          actions: [
            { label: 'Open Deal', variant: 'primary', onClick: () => onLeadClick(lead) },
          ],
        });
      }

      // P2 — Leads not yet scored
      else if (!lead.aiAnalysis && (lead.status === 'new' || lead.status === 'contacted')) {
        const descText = lead.company 
          ? `${lead.company} — awaiting initial AI revenue intelligence run.`
          : `New contact — run AI scoring to determine priority.`;
        items.push({
          leadId: lead.id!,
          lead,
          priority: 2,
          icon: Sparkles,
          iconColor: 'text-indigo-500',
          iconBg: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          label: `Score lead: ${lead.fullName}`,
          description: descText,
          estimatedValue: 2000,
          actions: [
            { label: 'Run AI Score', variant: 'primary', onClick: () => onScoreLead(lead) },
            { label: 'Open Deal', variant: 'secondary', onClick: () => onLeadClick(lead) },
          ],
        });
      }

      // P3 — Hot/Warm leads without outreach but no playbook missing
      else if (lead.aiAnalysis?.category === 'Hot' && lead.aiAnalysis?.followUp?.email && !followUpStatus) {
        items.push({
          leadId: lead.id!,
          lead,
          priority: 3,
          icon: TrendingUp,
          iconColor: 'text-emerald-500',
          iconBg: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          label: `Send outreach: ${lead.fullName}`,
          description: `${lead.company || ''} is ${lead.aiAnalysis.category} (${lead.aiAnalysis.score}/100). Outreach is ready to send.`,
          estimatedValue: 8000,
          actions: [
            { label: 'View Playbook', variant: 'primary', onClick: () => onLeadClick(lead) },
          ],
        });
      }
    });

    // Sort: P1 first, then P2, then P3 — max 5 items
    return items.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }, [leads, onLeadClick, onScoreLead]);

  const estimatedPipeline = useMemo(() => queue.reduce((sum, item) => sum + item.estimatedValue, 0), [queue]);

  if (queue.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-border-default bg-surface-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-default flex items-center justify-between bg-gradient-to-r from-surface-card to-surface-secondary/40">
        <div>
          <h2 className="text-[15px] font-bold text-text-primary flex items-center gap-2">
            <span className="text-lg">⚡</span>
            Today's Revenue Tasks
          </h2>
          <p className="text-[12px] text-text-secondary mt-0.5">Complete these to unlock <span className="font-bold text-text-primary">${(estimatedPipeline / 1000).toFixed(0)}k+ estimated pipeline</span></p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-text-secondary">{queue.length} action{queue.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Action Items */}
      <div className="divide-y divide-border-default">
        {queue.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.leadId + item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 hover:bg-surface-secondary/50 transition-colors group",
                item.priority === 1 && "bg-rose-50/30"
              )}
            >
              {/* Priority indicator + icon */}
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.iconBg, `border ${item.borderColor}`)}>
                <Icon className={cn("w-4 h-4", item.iconColor)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-text-primary truncate">{item.label}</p>
                <p className="text-[11px] text-text-secondary truncate mt-0.5">{item.description}</p>
              </div>

              {/* Value badge */}
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  +${(item.estimatedValue / 1000).toFixed(0)}k
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {item.actions.map((action, ai) => (
                  <button
                    key={ai}
                    onClick={action.onClick}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 border",
                      action.variant === 'primary'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                        : 'bg-surface-card hover:bg-surface-hover text-text-secondary border-border-default hover:border-border-hover hover:text-text-primary'
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
