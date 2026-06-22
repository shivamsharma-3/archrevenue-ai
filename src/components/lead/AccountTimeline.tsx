import React, { memo, useState, useMemo } from 'react';
import { Lead, Note, NoteType } from '../../lib/types';
import { AppCard } from '../ui/AppCard';
import { AppButton } from '../ui/AppButton';
import { Activity, FileText, Pin, PinOff, Edit2, Trash2, Mail, Briefcase, Zap, CheckCircle2, MessageSquare, Target } from 'lucide-react';
import { cn } from '../../lib/utils';

export const NOTE_TYPES: { type: NoteType; label: string; color: string; icon: string }[] = [
  { type: 'General', label: 'General', color: 'bg-surface-hover text-text-secondary border-border-default', icon: '📝' },
  { type: 'Call', label: 'Call', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: '📞' },
  { type: 'Meeting', label: 'Meeting', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: '🤝' },
  { type: 'Objection', label: 'Objection', color: 'bg-red-50 text-red-600 border-red-200', icon: '🚫' },
  { type: 'Follow-up', label: 'Follow-up', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: '⭐' }
];

interface AccountTimelineProps {
  lead: Lead;
  onAddNote: (content: string, type: NoteType) => void;
  onDeleteNote: (id: string) => void;
  onEditNote: (id: string, content: string, type: NoteType) => void;
  onTogglePinNote: (id: string) => void;
}

type TimelineEvent = {
  id: string;
  type: 'activity' | 'note';
  date: Date;
  content: string | React.ReactNode;
  metadata?: any;
  isPinned?: boolean;
};

export const AccountTimeline = memo(({ lead, onAddNote, onDeleteNote, onEditNote, onTogglePinNote }: AccountTimelineProps) => {
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState<NoteType>('General');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [editingNoteType, setEditingNoteType] = useState<NoteType>('General');

  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add Activities
    lead.activities?.forEach(act => {
      const d = act.timestamp?.toDate ? act.timestamp.toDate() : new Date(act.timestamp);
      events.push({
        id: act.id,
        type: 'activity',
        date: d,
        content: act.action
      });
    });

    // Add Notes
    lead.notes?.forEach(note => {
      const d = note.timestamp?.toDate ? note.timestamp.toDate() : new Date(note.timestamp);
      events.push({
        id: note.id,
        type: 'note',
        date: d,
        content: note.content,
        metadata: { type: note.type, isPinned: note.isPinned },
        isPinned: note.isPinned
      });
    });

    // Sort: Pinned notes first, then chronological descending
    events.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.date.getTime() - a.date.getTime();
    });

    return events;
  }, [lead.activities, lead.notes]);

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(newNote, newNoteType);
    setNewNote('');
    setNewNoteType('General');
  };

  const getEventIcon = (action: string) => {
    if (action.includes('Email')) return { icon: Mail, color: 'bg-indigo-50 text-indigo-500 border-indigo-200', dot: 'bg-indigo-500' };
    if (action.includes('Intelligence') || action.includes('Research')) return { icon: Briefcase, color: 'bg-teal-50 text-teal-500 border-teal-200', dot: 'bg-teal-500' };
    if (action.includes('Analyzed') || action.includes('Score')) return { icon: Zap, color: 'bg-amber-50 text-amber-500 border-amber-200', dot: 'bg-amber-500' };
    if (action.includes('Stage updated')) return { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-500 border-emerald-200', dot: 'bg-emerald-500' };
    if (action.includes('outreach') || action.includes('Strategy')) return { icon: Target, color: 'bg-blue-50 text-blue-500 border-blue-200', dot: 'bg-blue-500' };
    return { icon: Activity, color: 'bg-surface-secondary text-text-tertiary border-border-default', dot: 'bg-slate-400' };
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Note Input */}
      <AppCard level={1} className="p-4 flex flex-col gap-3 border-dashed border-2">
        <form onSubmit={handleSubmitNote} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {NOTE_TYPES.map(t => (
              <button 
                type="button" 
                key={t.type} 
                onClick={() => setNewNoteType(t.type)} 
                className={cn(
                  "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border flex items-center transition-all", 
                  newNoteType === t.type ? t.color : "bg-surface-secondary text-text-secondary border-border-default hover:border-border-hover"
                )}
              >
                <span className="mr-1">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Log a call, add a note, or record an objection..."
            className="w-full bg-transparent text-[14px] font-medium text-text-primary placeholder:text-text-tertiary focus:outline-none resize-none h-[60px]"
          />
          <div className="flex justify-end">
            <AppButton type="submit" variant="primary" size="sm" disabled={!newNote.trim()}>
              Save Note
            </AppButton>
          </div>
        </form>
      </AppCard>

      {/* Timeline Feed */}
      <AppCard level={1} className="relative overflow-hidden">
        <div className="flex items-center gap-2 mb-6 border-b border-border-default pb-4">
          <Activity className="w-5 h-5 text-text-secondary" />
          <h2 className="text-[16px] font-semibold text-text-primary">Account Timeline</h2>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border-default before:to-transparent">
          {timelineEvents.map((event) => {
            if (event.type === 'note') {
              const noteConfig = NOTE_TYPES.find(t => t.type === event.metadata.type) || NOTE_TYPES[0];
              const isEditing = editingNoteId === event.id;

              return (
                <div key={event.id} className="relative">
                  <span className="absolute -left-6 top-4 w-3 h-3 rounded-full bg-surface-card border-2 border-indigo-500 shadow-sm z-10" />
                  <div className={cn(
                    "p-4 rounded-xl border flex flex-col gap-3 group relative transition-colors ml-4",
                    event.isPinned ? "bg-amber-50/30 border-amber-200" : "bg-surface-secondary border-border-default hover:border-border-hover"
                  )}>
                    {isEditing ? (
                       <div className="space-y-3">
                       <div className="flex flex-wrap gap-2 mb-2">
                         {NOTE_TYPES.map(t => (
                           <button type="button" key={t.type} onClick={() => setEditingNoteType(t.type)} className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border flex items-center transition-all", editingNoteType === t.type ? t.color : "bg-surface-card text-text-tertiary border-border-default hover:border-border-hover")}>
                             <span className="mr-1">{t.icon}</span>{t.label}
                           </button>
                         ))}
                       </div>
                       <textarea
                         value={editingNoteContent}
                         onChange={(e) => setEditingNoteContent(e.target.value)}
                         className="w-full bg-surface-card border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none h-[80px]"
                       />
                       <div className="flex space-x-2">
                         <AppButton onClick={() => { onEditNote(event.id, editingNoteContent, editingNoteType); setEditingNoteId(null); }} variant="primary" size="sm">Save</AppButton>
                         <AppButton onClick={() => setEditingNoteId(null)} variant="secondary" size="sm">Cancel</AppButton>
                       </div>
                     </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-[14px] text-text-primary leading-relaxed font-medium whitespace-pre-wrap">
                            {event.content}
                          </p>
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-surface-card border border-border-default p-1 rounded-lg shadow-sm">
                            <button onClick={() => onTogglePinNote(event.id)} className="p-1.5 text-text-tertiary hover:text-amber-500 rounded-lg hover:bg-amber-50 transition-colors">
                              {event.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => { setEditingNoteId(event.id); setEditingNoteContent(event.content as string); setEditingNoteType(event.metadata.type); }} className="p-1.5 text-text-tertiary hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onDeleteNote(event.id)} className="p-1.5 text-text-tertiary hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2">
                            {event.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                            <span className="text-[11px] text-text-tertiary font-medium">
                              {event.date.toLocaleString()}
                            </span>
                          </div>
                          <span className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border flex items-center", noteConfig.color)}>
                            <span className="mr-1">{noteConfig.icon}</span>{noteConfig.label}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            }

            // Regular Activity
            const actionStr = event.content as string;
            const style = getEventIcon(actionStr);
            const Icon = style.icon;

            return (
              <div key={event.id} className="relative flex items-start gap-4">
                <span className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-surface-card ${style.dot} shadow-sm z-10`} />
                <div className="ml-4 flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-text-primary font-semibold">{actionStr}</span>
                  </div>
                  <span className="text-[11px] text-text-tertiary mt-0.5">{event.date.toLocaleString()}</span>
                </div>
              </div>
            );
          })}

          {timelineEvents.length === 0 && (
            <div className="text-[13px] text-text-tertiary font-medium italic ml-4">
              No activity recorded yet.
            </div>
          )}
        </div>
      </AppCard>
    </div>
  );
});

AccountTimeline.displayName = 'AccountTimeline';
