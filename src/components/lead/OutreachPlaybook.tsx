import React, { memo, useCallback } from 'react';
import { Lead } from '../../lib/types';
import { AppCard } from '../ui/AppCard';
import { AppButton } from '../ui/AppButton';
import { AIActionBar, AIAction } from '../ui/AIActionBar';
import { MessageSquare, Mail, Linkedin, PhoneCall, Loader2, Sparkles, Copy, ExternalLink, Phone, CheckSquare, Calendar } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { auth } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface OutreachPlaybookProps {
  lead: Lead;
  onCopy: (text: string, type: string) => void;
  copiedText: string | null;
  onSendEmail: () => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

function buildGmailLink(to: string, subject: string, body: string) {
  const encodedTo = encodeURIComponent(to);
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `https://mail.google.com/mail/?view=cm&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;
}

function extractSubjectAndBody(emailDraft: string): { subject: string; body: string } {
  const lines = emailDraft.split('\n');
  const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:'));
  const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, '').trim() : 'Following up';
  const body = lines.filter(l => !l.toLowerCase().startsWith('subject:')).join('\n').trim();
  return { subject, body };
}

async function logActivity(leadId: string, action: string) {
  try {
    const ref = doc(db, 'leads', leadId);
    await updateDoc(ref, {
      activities: arrayUnion({ id: crypto.randomUUID(), action, timestamp: new Date() }),
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Failed to log activity', e);
  }
}

export const OutreachPlaybook = memo(({
  lead,
  onCopy,
  copiedText,
  onSendEmail,
  onGenerate,
  isGenerating = false,
}: OutreachPlaybookProps) => {
  const followUp = lead.aiAnalysis?.followUp;

  // ── Open Gmail deep link ──────────────────────────────────────────────────
  const handleOpenGmail = useCallback(() => {
    if (!followUp?.email) return;
    const { subject, body } = extractSubjectAndBody(followUp.email);
    const url = buildGmailLink(lead.email || '', subject, body);
    window.open(url, '_blank', 'noopener,noreferrer');
    if (lead.id) {
      logActivity(lead.id, `📧 Gmail compose opened for ${lead.company || lead.fullName}`);
    }
    toast.success('Gmail opened — timeline updated!');
  }, [followUp, lead]);

  // ── Open LinkedIn deep link ───────────────────────────────────────────────
  const handleOpenLinkedIn = useCallback(() => {
    const linkedInUrl = (lead as any).linkedinUrl;
    const searchUrl = linkedInUrl
      ? linkedInUrl
      : `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(lead.fullName + ' ' + (lead.company || ''))}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
    if (lead.id) {
      logActivity(lead.id, `💼 LinkedIn opened for ${lead.fullName}`);
    }
  }, [lead]);

  // ── Log call ─────────────────────────────────────────────────────────────
  const handleLogCall = useCallback(() => {
    if (lead.phone) {
      window.location.href = `tel:${lead.phone}`;
    }
    if (lead.id) {
      logActivity(lead.id, `📞 Call initiated with ${lead.fullName}`);
    }
    toast.success('Call logged to timeline!');
  }, [lead]);

  if (!followUp) {
    return (
      <AppCard level={2} className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center mb-4">
          <MessageSquare className="w-7 h-7 text-violet-500" />
        </div>
        <div className="w-full max-w-[384px] mx-auto text-center">
          <p className="text-text-secondary mb-4 font-medium">
            No outreach playbook yet. Analyze this opportunity to generate personalized email, LinkedIn, and call scripts.
          </p>
          {onGenerate && (
            <AppButton variant="primary" onClick={onGenerate} disabled={isGenerating} leftIcon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}>
              {isGenerating ? 'Generating Playbook...' : 'Generate Playbook'}
            </AppButton>
          )}
        </div>
      </AppCard>
    );
  }

  // Check for low score hard-gate
  const score = lead.aiAnalysis?.score ?? 0;
  const isLowScore = score > 0 && score < 40;
  const isDead = lead.aiAnalysis?.category === 'Dead' || lead.aiAnalysis?.category === 'Cold' || lead.aiAnalysis?.priority === 'Low' || lead.aiAnalysis?.priority === 'Dead';
  const shouldBlockOutreach = isLowScore || isDead;

  if (shouldBlockOutreach) {
    return (
      <AppCard level={1} className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <h2 className="text-[16px] font-semibold text-text-primary">Outreach Playbook</h2>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-xl shrink-0">🛑</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-red-800 mb-1">Insufficient Data — Do Not Contact</p>
            <p className="text-[12px] text-red-700 leading-relaxed">
              This lead scored below the minimum threshold for engagement (Score: {score}/100). The AI Engine strongly recommends against contacting this lead due to insufficient data or poor ICP fit. Outreach generation is disabled.
            </p>
          </div>
        </div>
      </AppCard>
    );
  }

  const { objective, messagingAngle, painPoints, email, linkedin, callScript } = followUp;
  const { subject: emailSubject } = email ? extractSubjectAndBody(email) : { subject: '' };

  // All content fields are empty — AI ran but returned empty strings
  const allContentEmpty = !email && !linkedin && !callScript;

  const renderScriptSection = (
    type: 'email' | 'linkedin' | 'callScript',
    title: string,
    content: string | undefined,
    icon: React.ReactNode,
    colorClass: string,
    bgClass: string,
    borderClass: string,
    actionBar: React.ReactNode
  ) => {
    if (!content) {
      return (
        <div className={`p-5 rounded-xl border ${bgClass} ${borderClass} flex flex-col items-center justify-center text-center gap-3 min-h-[120px]`}>
          <div className={`p-2 rounded-lg bg-surface-card shadow-sm border ${borderClass}`}>{icon}</div>
          <span className="text-[13px] text-text-secondary font-medium">No {title.toLowerCase()} generated yet.</span>
          {onGenerate && (
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="mt-1 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Regenerate Playbook'}
            </button>
          )}
        </div>
      );
    }
    return (
      <div className={`p-5 rounded-xl border ${bgClass} ${borderClass} flex flex-col gap-4 group`}>
        <div className="flex items-center justify-between">
          <h4 className={`text-[12px] font-bold uppercase tracking-wider flex items-center gap-2 ${colorClass}`}>
            {icon} {title}
          </h4>
          <button
            onClick={() => onCopy(content, type)}
            className="p-1.5 text-text-tertiary hover:text-text-primary bg-surface-card border border-border-default rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Copy to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        {copiedText === type && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-max">
            ✓ Copied to clipboard
          </span>
        )}

        <div className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap font-medium">
          {content}
        </div>

        {actionBar}
      </div>
    );
  };

  const emailActions: AIAction[] = [
    { label: 'Open in Gmail', icon: ExternalLink, onClick: handleOpenGmail, variant: 'primary', title: 'Opens Gmail with the draft pre-filled' },
    { label: 'Copy Draft', icon: Copy, onClick: () => onCopy(email || '', 'email'), variant: 'secondary' },
    { label: 'Schedule Follow-up', icon: Calendar, onClick: onSendEmail, variant: 'ghost' },
  ];

  const linkedinActions: AIAction[] = [
    { label: 'Open LinkedIn', icon: ExternalLink, onClick: handleOpenLinkedIn, variant: 'primary', title: 'Opens LinkedIn profile or search' },
    { label: 'Copy Note', icon: Copy, onClick: () => onCopy(linkedin || '', 'linkedin'), variant: 'secondary' },
  ];

  const callActions: AIAction[] = [
    ...(lead.phone ? [{ label: 'Call Now', icon: Phone, onClick: handleLogCall, variant: 'primary' as const }] : []),
    { label: 'Copy Script', icon: Copy, onClick: () => onCopy(callScript || '', 'callScript'), variant: 'secondary' },
    { label: 'Log as Task', icon: CheckSquare, onClick: () => { toast('Add this to your tasks tab!'); }, variant: 'ghost' },
  ];

  return (
    <AppCard level={1} className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          <h2 className="text-[16px] font-semibold text-text-primary">Outreach Playbook</h2>
        </div>
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="text-[11px] font-semibold text-text-secondary hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Regenerate
          </button>
        )}
      </div>

      {/* Alert: outreach content is missing — offer clear recovery */}
      {allContentEmpty && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-xl shrink-0">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-amber-800 mb-1">Outreach drafts are empty</p>
            <p className="text-[12px] text-amber-700 leading-relaxed mb-3">
              The AI ran but returned empty email, LinkedIn, and call script fields. This usually happens when the analysis was interrupted. Click below to regenerate.
            </p>
            {onGenerate && (
              <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="px-4 py-2 text-[12px] font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {isGenerating ? 'Regenerating...' : 'Regenerate Playbook Now'}
              </button>
            )}
          </div>
        </div>
      )}

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
        {renderScriptSection(
          'email', 'Email Draft', email,
          <Mail className="w-4 h-4" />,
          'text-indigo-600', 'bg-indigo-50/30', 'border-indigo-100',
          <AIActionBar actions={emailActions} label="Execute" />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderScriptSection(
            'linkedin', 'LinkedIn Message', linkedin,
            <Linkedin className="w-4 h-4" />,
            'text-blue-600', 'bg-blue-50/30', 'border-blue-100',
            <AIActionBar actions={linkedinActions} label="Execute" />
          )}
          {renderScriptSection(
            'callScript', 'Call Opener', callScript,
            <PhoneCall className="w-4 h-4" />,
            'text-emerald-600', 'bg-emerald-50/30', 'border-emerald-100',
            <AIActionBar actions={callActions} label="Execute" />
          )}
        </div>
      </div>
    </AppCard>
  );
});

OutreachPlaybook.displayName = 'OutreachPlaybook';
