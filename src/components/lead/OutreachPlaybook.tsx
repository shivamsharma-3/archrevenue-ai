import React, { memo } from 'react';
import { Lead } from '../../lib/types';
import { AppCard } from '../ui/AppCard';
import { AppButton } from '../ui/AppButton';
import { MessageSquare, Mail, Linkedin, PhoneCall, Loader2, Sparkles, Copy, Send } from 'lucide-react';

interface OutreachPlaybookProps {
  lead: Lead;
  onCopy: (text: string, type: string) => void;
  copiedText: string | null;
  onSendEmail: () => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

export const OutreachPlaybook = memo(({ 
  lead, 
  onCopy, 
  copiedText,
  onSendEmail,
  onGenerate,
  isGenerating = false
}: OutreachPlaybookProps) => {
  const followUp = lead.aiAnalysis?.followUp;

  if (!followUp) {
    return (
      <AppCard level={2} className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center mb-4">
          <MessageSquare className="w-7 h-7 text-violet-500" />
        </div>
        <div className="w-full max-w-[384px] mx-auto text-center">
          <p className="text-text-secondary mb-4 font-medium">
            No outreach playbook available. Analyze the opportunity first to generate outreach strategies.
          </p>
          {onGenerate && (
            <AppButton variant="primary" onClick={onGenerate} disabled={isGenerating}>
              {isGenerating ? 'Analyzing...' : 'Generate Playbook'}
            </AppButton>
          )}
        </div>
      </AppCard>
    );
  }

  const { objective, messagingAngle, painPoints, email, linkedin, callScript } = followUp;

  const renderScriptSection = (
    type: 'email' | 'linkedin' | 'callScript',
    title: string,
    content: string | undefined,
    icon: React.ReactNode,
    colorClass: string,
    bgClass: string,
    borderClass: string
  ) => {
    if (!content) {
      return (
        <div className={`p-5 rounded-xl border ${bgClass} ${borderClass} flex flex-col items-center justify-center text-center gap-3`}>
          <div className={`p-2 rounded-lg bg-surface-card shadow-sm border ${borderClass}`}>
            {icon}
          </div>
          <span className="text-[13px] text-text-secondary font-medium">No {title.toLowerCase()} generated yet.</span>
        </div>
      );
    }

    return (
      <div className={`p-5 rounded-xl border ${bgClass} ${borderClass} flex flex-col gap-4 group`}>
        <div className="flex items-center justify-between">
          <h4 className={`text-[12px] font-bold uppercase tracking-wider flex items-center gap-2 ${colorClass}`}>
            {icon} {title}
          </h4>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onCopy(content, type)}
              className="p-1.5 text-text-tertiary hover:text-indigo-600 bg-surface-card border border-border-default rounded-lg transition-colors"
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
            {type === 'email' && (
              <button 
                onClick={onSendEmail}
                className="p-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                title="Send Email"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {copiedText === type && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-max">
            Copied to clipboard!
          </span>
        )}

        <div className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap font-medium">
          {content}
        </div>
      </div>
    );
  };

  return (
    <AppCard level={1} className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          <h2 className="text-[16px] font-semibold text-text-primary">Outreach Playbook</h2>
        </div>
      </div>

      {/* Playbook Strategy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-secondary rounded-xl p-4 border border-border-default flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Objective</span>
          <p className="text-[13px] text-text-primary font-medium">{objective}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Messaging Angle</span>
          <p className="text-[13px] text-indigo-900 font-semibold">{messagingAngle}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Target Pain Points</span>
          <ul className="text-[12px] text-red-900 font-medium list-disc list-inside space-y-1">
            {painPoints?.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        {renderScriptSection('email', 'Email Draft', email, <Mail className="w-4 h-4" />, 'text-indigo-600', 'bg-indigo-50/30', 'border-indigo-100')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderScriptSection('linkedin', 'LinkedIn Message', linkedin, <Linkedin className="w-4 h-4" />, 'text-blue-600', 'bg-blue-50/30', 'border-blue-100')}
          {renderScriptSection('callScript', 'Call Opener', callScript, <PhoneCall className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50/30', 'border-emerald-100')}
        </div>
      </div>
    </AppCard>
  );
});

OutreachPlaybook.displayName = 'OutreachPlaybook';
