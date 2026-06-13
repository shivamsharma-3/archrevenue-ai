import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building, Mail, Phone, Target, Clock, ArrowRight, Activity, TrendingUp, Sparkles, FileText, Pin, PinOff, Edit2, Trash2, Loader2, ListTodo, Plus, Circle, CircleDot, CircleCheck, GitCommitHorizontal } from 'lucide-react';
import { Lead, Note, NoteType, AITask, TaskStatus } from '../lib/types';
import { cn, getFollowUpStatus } from '../lib/utils';
import { Link } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateNotesSummary, generateTasks } from '../lib/ai';
import { NOTE_TYPES } from './LeadIntelligencePage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export default function LeadDetailsPanel({ isOpen, onClose, lead }: Props) {
  if (!isOpen || !lead) return null;

  const followUpInfo = getFollowUpStatus(lead);

  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'tasks' | 'timeline'>('overview');
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState<NoteType>('General');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [editingNoteType, setEditingNoteType] = useState<NoteType>('General');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const triggerNotesSummary = async (notes: Note[]) => {
    if (!lead || !lead.id) return;
    setIsGeneratingSummary(true);
    try {
      const summary = await generateNotesSummary(notes);
      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, { notesSummary: summary, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('Failed to generate notes summary', e);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !lead.id || !newNote.trim()) return;
    try {
      const note: Note = {
        id: crypto.randomUUID(),
        content: newNote.trim(),
        type: newNoteType,
        timestamp: new Date()
      };
      const newActivities = [
        ...(lead.activities || []),
        { id: crypto.randomUUID(), action: `Note Added: `, timestamp: new Date() }
      ];
      const newNotes = [...(lead.notes || []), note];
      
      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, {
        notes: newNotes,
        activities: newActivities,
        updatedAt: serverTimestamp()
      });
      setNewNote('');
      setNewNoteType('General');
      triggerNotesSummary(newNotes);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!lead || !lead.id || !lead.notes) return;
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const newNotes = lead.notes.filter(n => n.id !== noteId);
      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, {
        notes: newNotes,
        updatedAt: serverTimestamp()
      });
      triggerNotesSummary(newNotes);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditNote = async (noteId: string, newContent: string, newType: NoteType) => {
    if (!lead || !lead.id || !lead.notes) return;
    try {
      const newNotes = lead.notes.map(n => n.id === noteId ? { ...n, content: newContent, type: newType } : n);
      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, {
        notes: newNotes,
        updatedAt: serverTimestamp()
      });
      triggerNotesSummary(newNotes);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTogglePinNote = async (noteId: string) => {
    if (!lead || !lead.id || !lead.notes) return;
    try {
      const newNotes = lead.notes.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n);
      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, {
        notes: newNotes,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleGenerateTasks = async () => {
    if (!lead || !lead.id) return;
    setIsGeneratingTasks(true);
    try {
      const tasks = await generateTasks(lead);
      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, { tasks, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error('[AI TASKS] Failed to generate tasks:', err);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string) => {
    if (!lead || !lead.id || !lead.tasks) return;
    const statusCycle: Record<string, TaskStatus> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    };
    const updatedTasks = lead.tasks.map(t => {
      if (t.id === taskId) {
        const newStatus = statusCycle[t.status] as TaskStatus;
        const newTask = { ...t, status: newStatus };
        if (newStatus === 'completed') {
          newTask.completedAt = new Date().toISOString();
        } else {
          delete newTask.completedAt;
        }
        return newTask;
      }
      return t;
    });
    const docRef = doc(db, 'leads', lead.id);
    await updateDoc(docRef, { tasks: updatedTasks, updatedAt: serverTimestamp() });
  };

  const submitManualTask = async () => {
    if (!lead || !lead.id || !newTaskTitle.trim()) return;
    const newTask: AITask = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      status: 'pending',
      source: 'manual',
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [...(lead.tasks || []), newTask];
    const docRef = doc(db, 'leads', lead.id);
    await updateDoc(docRef, { tasks: updatedTasks, updatedAt: serverTimestamp() });
    setNewTaskTitle('');
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!lead || !lead.id || !lead.tasks) return;
    const updatedTasks = lead.tasks.filter(t => t.id !== taskId);
    const docRef = doc(db, 'leads', lead.id);
    await updateDoc(docRef, { tasks: updatedTasks, updatedAt: serverTimestamp() });
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Slide-out Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-[#0a0a0a] border-l border-white/[0.08] shadow-[0_0_100px_rgba(0,0,0,1)] z-50 flex flex-col font-sans overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        {/* Subtle glow based on category */}
        {lead.aiAnalysis?.category === 'Hot' && (
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        )}
        {lead.aiAnalysis?.category === 'Warm' && (
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        )}

        {/* Header */}
        <div className="px-6 pt-5 pb-0 border-b border-white/[0.08] flex flex-col bg-black/40 backdrop-blur-md relative z-10 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#1c1c1f] border border-white/[0.05] flex items-center justify-center text-sm font-bold text-white shadow-inner">
                {lead.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white tracking-tight leading-none">{lead.fullName}</h2>
                <div className="flex items-center mt-1">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full mr-1.5",
                    lead.status === 'won' ? 'bg-emerald-500' :
                    lead.status === 'lost' ? 'bg-red-500' :
                    lead.status === 'qualified' ? 'bg-amber-500' :
                    lead.status === 'contacted' ? 'bg-purple-500' :
                    'bg-blue-500'
                  )} />
                  <p className="text-xs text-zinc-400 capitalize font-medium">{lead.status}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex space-x-6 px-1">
            <button 
              onClick={() => setActiveTab('overview')}
              className={cn("pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors", activeTab === 'overview' ? "border-blue-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300")}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={cn("pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors", activeTab === 'notes' ? "border-blue-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300")}
            >
              Notes
            </button>
            <button 
              onClick={() => setActiveTab('tasks')}
              className={cn("pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors flex items-center gap-1.5", activeTab === 'tasks' ? "border-violet-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300")}
            >
              Tasks
              {lead.tasks && lead.tasks.filter(t => t.status !== 'completed').length > 0 && (
                <span className="bg-violet-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {lead.tasks.filter(t => t.status !== 'completed').length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('timeline')}
              className={cn("pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors", activeTab === 'timeline' ? "border-cyan-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300")}
            >
              Timeline
            </button>
          </div>
        </div>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar flex flex-col">
          {activeTab === 'overview' ? (
            <div className="space-y-8">
              {/* Contact Details */}
              <section className="space-y-4">
                {lead.company && (
                  <div className="flex items-center text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mr-3">
                      <Building className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Company</span>
                      <span className="text-zinc-200 font-medium">{lead.company}</span>
                    </div>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mr-3">
                      <Mail className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Email</span>
                      <a href={`mailto:${lead.email}`} className="text-blue-400 hover:text-blue-300 font-medium">{lead.email}</a>
                    </div>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mr-3">
                      <Phone className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Phone</span>
                      <a href={`tel:${lead.phone}`} className="text-zinc-200 hover:text-white font-medium">{lead.phone}</a>
                    </div>
                  </div>
                )}
              </section>

              {/* Quick Stats Grid */}
              <section className="grid grid-cols-2 gap-3">
                {/* AI Score */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center mb-2">
                    <Sparkles className="w-3 h-3 mr-1" /> Revenue Score
                  </span>
                  {lead.aiAnalysis ? (
                    <div>
                      <span className="text-3xl font-bold text-white tracking-tighter">{lead.aiAnalysis.score}</span>
                      <span className={cn(
                        "ml-2 text-xs font-bold px-2 py-0.5 rounded-full border",
                        lead.aiAnalysis.category === 'Hot' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        lead.aiAnalysis.category === 'Warm' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      )}>
                        {lead.aiAnalysis.category}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-zinc-500 italic">Not analyzed</span>
                  )}
                </div>

                {/* Next Follow Up */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center mb-2">
                    <Clock className="w-3 h-3 mr-1" /> Next Follow-Up
                  </span>
                  {lead.followUpDate ? (
                    <div>
                        <span className={cn(
                      "text-sm font-bold uppercase tracking-wider block mb-1",
                      followUpInfo === 'overdue' ? "text-red-400" :
                      followUpInfo === 'due_today' ? "text-yellow-400" :
                      followUpInfo === 'completed' ? "text-zinc-500" : "text-emerald-400"
                    )}>
                      {followUpInfo === 'overdue' ? "Overdue" : followUpInfo === 'due_today' ? "Due Today" : followUpInfo === 'completed' ? "Completed" : "Scheduled"}
                    </span>
                      <span className="text-xs text-zinc-400">
                        {lead.followUpDate.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-zinc-500 italic">None scheduled</span>
                  )}
                </div>
              </section>

              {/* Activity Preview */}
              <section className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center mb-3">
                  <Activity className="w-3 h-3 mr-1" /> Latest Activity
                </span>
                {lead.activities && lead.activities.length > 0 ? (
                  <div className="text-sm text-zinc-300 font-medium">
                    {lead.activities[lead.activities.length - 1].action}
                  </div>
                ) : (
                  <span className="text-sm text-zinc-500 italic">No activity logged</span>
                )}
              </section>
            </div>
          ) : activeTab === 'notes' ? (
            <div className="flex-1 flex flex-col h-full space-y-6">
              {/* AI Summary */}
              {lead.notesSummary && (
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-[16px] shadow-inner relative overflow-hidden shrink-0">
                  <div className="flex items-center mb-2 space-x-2 relative z-10">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] uppercase tracking-widest font-extrabold text-blue-400">AI Summary</span>
                    {isGeneratingSummary && <Loader2 className="w-3 h-3 text-blue-400 animate-spin ml-2" />}
                  </div>
                  <div className="text-[12px] text-zinc-200 leading-relaxed font-medium whitespace-pre-wrap relative z-10">
                    {lead.notesSummary}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {(!lead.notes || lead.notes.length === 0) ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center opacity-50">
                    <FileText className="w-8 h-8 text-zinc-500 mb-2" />
                    <p className="text-xs font-medium text-zinc-400">No notes added yet.</p>
                  </div>
                ) : (
                  [...lead.notes].sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return b.timestamp?.toMillis ? b.timestamp.toMillis() - a.timestamp.toMillis() : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                  }).map((note: any, i: number) => (
                    <div key={i} className={cn("bg-black/60 p-4 rounded-[16px] border shadow-inner group/note transition-all flex flex-col relative", note.isPinned ? "border-amber-500/30" : "border-white/[0.06]")}>
                      {editingNoteId === note.id ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {NOTE_TYPES.map(t => (
                              <button key={t.type} onClick={() => setEditingNoteType(t.type)} className={cn("text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md border flex items-center transition-all", editingNoteType === t.type ? t.color : "bg-black/40 text-zinc-500 border-white/[0.05] hover:border-white/[0.2]")}>
                                <span className="mr-1">{t.icon}</span>{t.label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500/50 resize-none h-[60px]"
                          />
                          <div className="flex space-x-2">
                            <button onClick={() => { handleEditNote(note.id, editingNoteContent, editingNoteType); setEditingNoteId(null); }} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-colors">Save</button>
                            <button onClick={() => setEditingNoteId(null)} className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-white text-[11px] font-bold rounded-lg transition-colors">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-3">
                            <p className="text-[13px] text-zinc-200 leading-relaxed font-medium whitespace-pre-wrap flex-1 mr-4">{note.content}</p>
                            <div className="opacity-0 group-hover/note:opacity-100 flex items-center space-x-1 transition-opacity absolute top-2 right-2 bg-black/80 backdrop-blur-sm p-1 rounded-lg border border-white/[0.05]">
                              <button onClick={() => handleTogglePinNote(note.id)} className="p-1 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-white/[0.05] transition-colors" title={note.isPinned ? "Unpin Note" : "Pin Note"}>
                                {note.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); setEditingNoteType(note.type || 'General'); }} className="p-1 text-zinc-400 hover:text-blue-400 rounded-lg hover:bg-white/[0.05] transition-colors" title="Edit Note">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteNote(note.id)} className="p-1 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-white/[0.05] transition-colors" title="Delete Note">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center mt-auto justify-between">
                            <div className="flex items-center">
                              {note.isPinned && <Pin className="w-3 h-3 text-amber-500 mr-1.5" />}
                              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-extrabold">
                                {note.timestamp?.toDate ? note.timestamp.toDate().toLocaleDateString() : new Date(note.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                            {(() => {
                              const typeConfig = NOTE_TYPES.find(t => t.type === (note.type || 'General'));
                              return typeConfig ? (
                                <span className={cn("text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md border flex items-center", typeConfig.color)}>
                                  <span className="mr-1">{typeConfig.icon}</span>
                                  {typeConfig.label}
                                </span>
                              ) : null;
                            })()}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddNote} className="relative mt-auto shrink-0 bg-black/60 border border-white/[0.1] rounded-[16px] p-3 shadow-inner">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {NOTE_TYPES.map(t => (
                    <button type="button" key={t.type} onClick={() => setNewNoteType(t.type)} className={cn("text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md border flex items-center transition-all", newNoteType === t.type ? t.color : "bg-black/40 text-zinc-500 border-white/[0.05] hover:border-white/[0.2]")}>
                      <span className="mr-1">{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Log a call or add a note..."
                  className="w-full bg-transparent text-[13px] font-medium text-white placeholder:text-zinc-600 focus:outline-none resize-none h-[50px]"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newNote.trim()}
                    className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === 'tasks' ? (
            <div className="flex flex-col flex-1">
              {/* Generate Tasks Button */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold">AI Generated Tasks</p>
                <button
                  onClick={handleGenerateTasks}
                  disabled={isGeneratingTasks}
                  className="flex items-center px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 disabled:opacity-40 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
                >
                  {isGeneratingTasks ? (
                    <><Loader2 className="w-3 h-3 animate-spin mr-1" />Generating…</>
                  ) : (
                    <><Sparkles className="w-3 h-3 mr-1" />{lead.tasks && lead.tasks.length > 0 ? 'Regenerate' : 'Generate'}</>
                  )}
                </button>
              </div>

              {/* Task List */}
              {lead.tasks && lead.tasks.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {[...lead.tasks].sort((a, b) => {
                    const order: Record<string, number> = { pending: 0, in_progress: 1, completed: 2 };
                    return (order[a.status] ?? 0) - (order[b.status] ?? 0);
                  }).map(task => (
                    <div
                      key={task.id}
                      className={cn(
                        "group flex items-center gap-2.5 p-3 rounded-xl border transition-all",
                        task.status === 'completed' ? "opacity-50 border-white/[0.03]" :
                        task.status === 'in_progress' ? "bg-amber-500/5 border-amber-500/15" :
                        "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]"
                      )}
                    >
                      <button onClick={() => handleToggleTaskStatus(task.id)} className="shrink-0">
                        {task.status === 'completed' ? (
                          <CircleCheck className="w-4 h-4 text-emerald-400" />
                        ) : task.status === 'in_progress' ? (
                          <CircleDot className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        )}
                      </button>
                      <span className={cn(
                        "flex-1 text-[12px] font-medium leading-snug",
                        task.status === 'completed' ? "line-through text-zinc-500" : "text-zinc-200"
                      )}>
                        {task.title}
                      </span>
                      <button onClick={() => handleDeleteTask(task.id)} className="shrink-0 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center text-center mb-4">
                  <ListTodo className="w-8 h-8 text-zinc-700 mb-3" />
                  <p className="text-zinc-500 text-xs">{'Click Generate to create AI tasks.'}</p>
                </div>
              )}

              {/* Add Manual Task */}
              <div className="relative z-10 flex items-center gap-2 bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 shrink-0 mt-4">
                <Plus className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitManualTask();
                    }
                  }}
                  placeholder="Add a task manually…"
                  className="flex-1 bg-transparent text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
                />
                <button
                  onClick={submitManualTask}
                  disabled={!newTaskTitle.trim()}
                  className="text-[10px] font-bold uppercase tracking-wider text-violet-400 hover:text-violet-300 disabled:opacity-40 transition-colors shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          ) : activeTab === 'timeline' ? (
            <div className="space-y-1">
              {(!lead.activities || lead.activities.length === 0) ? (
                <div className="py-10 flex flex-col items-center justify-center text-center opacity-50">
                  <GitCommitHorizontal className="w-8 h-8 text-zinc-500 mb-2" />
                  <p className="text-xs font-medium text-zinc-400">No activity recorded yet.</p>
                  <p className="text-[10px] text-zinc-600 mt-1">Events will appear here as you interact with this lead.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-white/[0.05]" />
                  {[...lead.activities].reverse().map((activity, i) => {
                    const ts = activity.timestamp?.toDate ? activity.timestamp.toDate() : new Date(activity.timestamp);
                    const now = new Date();
                    const diffMs = now.getTime() - ts.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHours / 24);
                    const relTime = diffMins < 1 ? 'just now' : diffMins < 60 ? `${diffMins}m ago` : diffHours < 24 ? `${diffHours}h ago` : diffDays < 7 ? `${diffDays}d ago` : ts.toLocaleDateString();

                    const action = activity.action || '';
                    const isAI = action.toLowerCase().includes('ai') || action.toLowerCase().includes('scored') || action.toLowerCase().includes('generated');
                    const isStatus = action.toLowerCase().includes('status');
                    const isNote = action.toLowerCase().includes('note');
                    const isImport = action.toLowerCase().includes('import') || action.toLowerCase().includes('created');

                    const dotColor = isAI ? 'bg-indigo-500' : isStatus ? 'bg-amber-500' : isNote ? 'bg-blue-500' : isImport ? 'bg-emerald-500' : 'bg-zinc-600';
                    const icon = isAI ? '✨' : isStatus ? '🔄' : isNote ? '📝' : isImport ? '📥' : '⚡';

                    return (
                      <motion.div
                        key={activity.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-start gap-4 pl-2 py-3 group"
                      >
                        <div className="relative z-10 mt-0.5">
                          <div className={cn('w-4 h-4 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-[8px]', dotColor)}>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-zinc-200 leading-snug">
                            <span className="mr-1.5">{icon}</span>
                            {action}
                          </p>
                          <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">{relTime}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/[0.08] bg-black/60 backdrop-blur-xl relative z-10 shrink-0">
          <Link
            to={`/lead/${encodeURIComponent((lead.fullName || lead.id || '').replace(/\s+/g, ''))}`}
            state={{ leadId: lead.id }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wider text-[11px] uppercase py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center group"
          >
            View Full Intelligence
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
