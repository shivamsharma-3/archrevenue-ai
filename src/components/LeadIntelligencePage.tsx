import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, where, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Lead, SellerProfile, NoteType, Note, AITask, TaskStatus } from '../lib/types';
import { getFollowUpStatus, cn } from '../lib/utils';
import { scoreLead, regenerateOutreach, generateNotesSummary, generateTasks, generateDealCoach, DealCoachResult } from '../lib/ai';
import { researchCompany } from '../lib/research';
import { getProfile } from '../lib/profile';
import { handleFirestoreError } from '../lib/errorHandling';
import { ArrowLeft, Building, Target, Clock, Calendar, Sparkles, Zap, Loader2, Mail, Linkedin, PhoneCall, Check, MessageSquare, Briefcase, Activity, FileText, ArrowRight, TrendingUp, Copy, RefreshCw, Send, Trash2, Edit2, Pin, PinOff, ListTodo, Plus, Circle, CircleDot, CircleCheck, CalendarCheck, Terminal } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { EmailReviewModal } from './EmailReviewModal';
import Shell from './Shell';
import TokenUpgradeModal from './TokenUpgradeModal';
import OpportunitySignals from './OpportunitySignals';

type Tab = 'overview' | 'workspace' | 'activity' | 'outreach';

export const NOTE_TYPES: { type: NoteType; label: string; color: string; icon: string }[] = [
  { type: 'General', label: 'General', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: 'ð' },
  { type: 'Call', label: 'Call', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: 'ð' },
  { type: 'Meeting', label: 'Meeting', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: 'ð' },
  { type: 'Objection', label: 'Objection', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: 'ð«' },
  { type: 'Follow-up', label: 'Follow-up', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: 'â­' }
];

export default function LeadIntelligencePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);

  // Loading states
  const [isScoring, setIsScoring] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [isRegeneratingOutreach, setIsRegeneratingOutreach] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState<NoteType>('General');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [editingNoteType, setEditingNoteType] = useState<NoteType>('General');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [emailingLead, setEmailingLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [dealCoach, setDealCoach] = useState<DealCoachResult | null>(null);
  const [isRunningDealCoach, setIsRunningDealCoach] = useState(false);

  const handleSendEmailSuccess = async (edited: boolean) => {
    showToast('Email sent successfully!', 'success');
    if (lead && lead.id) {
       try {
         const docRef = doc(db, 'leads', lead.id);
         const isNew = !lead.status || lead.status.toLowerCase() === 'new';
         const newActivities = [
           ...(lead.activities || []),
           { id: crypto.randomUUID(), action: `Email Sent to ${lead.email}`, timestamp: new Date() }
         ];
         const updates: any = {
            activities: newActivities,
            updatedAt: serverTimestamp()
         };
         if (isNew) {
            updates.status = 'contacted';
         }
         await updateDoc(docRef, updates);
         if (isNew) {
            showToast(`Moved ${lead.fullName} to Contacted stage`, 'success');
         }
       } catch(e) {
         console.error('Error logging email activity:', e);
         showToast('Error updating lead status after email', 'error');
       }
    }
  };

  // Toast notifications (simplified local state)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [tokenModalError, setTokenModalError] = useState<string | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error' && (message.toLowerCase().includes('token') || message.toLowerCase().includes('decommissioned') || (message.toLowerCase().includes('limit') && !message.toLowerCase().includes('rate limit')) || message.toLowerCase().includes('invalid_request_error'))) {
      setTokenModalError(message);
      return;
    }
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!id) return;

    // We can fetch profile independently of the snapshot
    const initProfile = async () => {
      if (auth.currentUser) {
        const profile = await getProfile(auth.currentUser.uid);
        setSellerProfile(profile);
      }
    };
    initProfile();

    const decodedId = decodeURIComponent(id || '');
    const stateLeadId = location.state?.leadId;
    
    let unsubscribeDoc: (() => void) | null = null;
    let unsubscribeQuery: (() => void) | null = null;

    if (stateLeadId) {
      // Best case: We have the exact ID from React Router state
      const docRef = doc(db, 'leads', stateLeadId);
      unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setLead({ id: docSnap.id, ...docSnap.data() } as Lead);
        } else {
          console.error('Lead not found');
          navigate('/dashboard');
        }
        setLoading(false);
      }, (error) => {
        console.error('Error fetching lead by ID:', error);
        setLoading(false);
      });
    } else {
      // Fallback: If user refreshed or shared link, we have to find by the space-stripped name
      const leadsRef = collection(db, 'leads');
      const currentUserId = auth.currentUser?.uid;
      
      if (!currentUserId) {
        console.error('User not authenticated, cannot query leads.');
        setLoading(false);
        return;
      }

      // We can't query by space-stripped name directly in Firestore, so we fetch all user leads and filter in memory.
      const q = query(leadsRef, where('userId', '==', currentUserId));
      
      unsubscribeQuery = onSnapshot(q, (snapshot) => {
        const foundDoc = snapshot.docs.find(d => {
          const name = d.data().fullName || '';
          return name.replace(/\s+/g, '') === decodedId;
        });

        if (foundDoc) {
          setLead({ id: foundDoc.id, ...foundDoc.data() } as Lead);
          setLoading(false);
        } else {
          // Last resort fallback: try treating the URL param as the Firestore ID itself
          const docRef = doc(db, 'leads', decodedId);
          unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              setLead({ id: docSnap.id, ...docSnap.data() } as Lead);
            } else {
              console.error('Lead not found');
              navigate('/dashboard');
            }
            setLoading(false);
          }, (error) => {
            console.error('Error fetching lead by fallback ID:', error);
            setLoading(false);
          });
        }
      }, (error) => {
        console.error('Error fetching leads for name matching:', error);
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribeQuery) unsubscribeQuery();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, [id, navigate, location.state]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleStatusChange = async (newStatus: Lead['status']) => {
    if (!lead || !lead.id) return;
    try {
      const docRef = doc(db, 'leads', lead.id);
      const newActivities = [
        ...(lead.activities || []),
        { id: crypto.randomUUID(), action: `Stage updated to ${newStatus}`, timestamp: new Date() }
      ];
      await updateDoc(docRef, {
        status: newStatus,
        activities: newActivities,
        updatedAt: serverTimestamp()
      });
      showToast(`Status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to update status', 'error');
    }
  };

  const handleScoreLead = async () => {
    if (!lead || !lead.id) return;
    setIsScoring(true);
    try {
      const result = await scoreLead(lead, sellerProfile) as any;
      const freshResearch = result._freshResearch ?? null;
      delete result._freshResearch;

      const isReanalysis = !!lead.aiAnalysis;
      const newActivities = [
        ...(lead.activities || []),
        ...(freshResearch ? [{ id: crypto.randomUUID(), action: 'Website Intelligence Gathered', timestamp: new Date() }] : []),
        { id: crypto.randomUUID(), action: isReanalysis ? 'Revenue Re-Analysis Generated' : 'Revenue Analysis Generated', timestamp: new Date() },
      ];

      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, {
        aiAnalysis: result,
        ...(freshResearch ? { research: freshResearch } : {}),
        activities: newActivities,
        updatedAt: serverTimestamp(),
      });

      const confidenceNote = result.evidence?.limitedConfidence ? ' (limited data)' : '';
      showToast(`AI Score: ${result.score}/100 Â· ${result.category}${confidenceNote}`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'AI scoring failed.', 'error');
    } finally {
      setIsScoring(false);
    }
  };

  const handleResearchCompany = async () => {
    if (!lead || !lead.id || !lead.website) return;
    setIsResearching(true);
    try {
      const researchData = await researchCompany(lead.website);
      const newActivities = [
        ...(lead.activities || []),
        { id: crypto.randomUUID(), action: `Website Intelligence Gathered (${researchData.confidenceLevel} confidence)`, timestamp: new Date() }
      ];

      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, {
        research: researchData,
        activities: newActivities,
        updatedAt: serverTimestamp(),
      });

      showToast(`Research complete Â· ${researchData.confidenceLevel} confidence`, 'success');
      
      // Auto score after research
      const updatedLead = { ...lead, research: researchData, activities: newActivities };
      setLead(updatedLead); // Optimistic update for the scoreLead call
      setTimeout(() => {
        // Will rely on the snapshot, but calling the function directly needs the updated lead if we passed it in.
        // Since handleScoreLead uses `lead` from state, we can just call it and it might use slightly stale state.
        // But let's let the user trigger it, or trigger it safely. 
      }, 500);

    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Company research failed.', 'error');
    } finally {
      setIsResearching(false);
    }
  };

  const handleRegenerateOutreach = async () => {
    if (!lead || !lead.id) return;
    setIsRegeneratingOutreach(true);
    try {
      const followUp = await regenerateOutreach(lead, sellerProfile);
      const newActivities = [
        ...(lead.activities || []),
        { id: crypto.randomUUID(), action: 'Outreach Scripts Regenerated', timestamp: new Date() },
      ];

      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, {
        'aiAnalysis.followUp': followUp,
        activities: newActivities,
        updatedAt: serverTimestamp(),
      });

      showToast('Outreach scripts regenerated', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to regenerate outreach.', 'error');
    } finally {
      setIsRegeneratingOutreach(false);
    }
  };

  const handleUpdateFollowUp = async (date: Date | null, status: Lead['followUpStatus']) => {
    if (!lead || !lead.id) return;
    try {
      const docRef = doc(db, 'leads', lead.id);
      const actionText = date 
        ? (lead.followUpDate ? 'Follow-Up Rescheduled' : 'Follow-Up Scheduled')
        : (status === 'completed' ? 'Follow-Up Completed' : 'Follow-Up Cleared');

      const newActivities = [
        ...(lead.activities || []),
        { id: crypto.randomUUID(), action: actionText, timestamp: new Date() }
      ];

      const updates: any = {
        followUpDate: date ? date : null,
        followUpStatus: status,
        activities: newActivities,
        updatedAt: serverTimestamp()
      };

      if (status === 'completed') {
        updates.lastContactedAt = serverTimestamp();
      }

      await updateDoc(docRef, updates);
      showToast(actionText, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update follow-up.', 'error');
    }
  };

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
        { id: crypto.randomUUID(), action: 'Note Added', timestamp: new Date() }
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
      showToast('Note added', 'success');
      triggerNotesSummary(newNotes);
    } catch (error) {
      console.error(error);
      showToast('Failed to add note.', 'error');
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
      showToast('Note deleted', 'success');
      triggerNotesSummary(newNotes);
    } catch (error) {
      console.error(error);
      showToast('Failed to delete note.', 'error');
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
      showToast('Note updated', 'success');
      triggerNotesSummary(newNotes);
    } catch (error) {
      console.error(error);
      showToast('Failed to update note.', 'error');
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
      showToast('Failed to pin/unpin note.', 'error');
    }
  };

  const handleGenerateTasks = async () => {
    if (!lead || !lead.id) return;
    setIsGeneratingTasks(true);
    try {
      const tasks = await generateTasks(lead, sellerProfile);
      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, { tasks, updatedAt: serverTimestamp() });
      showToast(`Generated ${tasks.length} AI tasks`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to generate tasks.', 'error');
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
    try {
      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, { tasks: updatedTasks, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error(error);
      showToast('Failed to update task.', 'error');
    }
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
    try {
      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, { tasks: updatedTasks, updatedAt: serverTimestamp() });
      setNewTaskTitle('');
      showToast('Task added', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to add task.', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!lead || !lead.id || !lead.tasks) return;
    const updatedTasks = lead.tasks.filter(t => t.id !== taskId);
    try {
      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, { tasks: updatedTasks, updatedAt: serverTimestamp() });
      showToast('Task removed', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to delete task.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!lead) return null;

  const followUpInfo = getFollowUpStatus(lead);

  return (
    <Shell hideSidebar={true}>
      
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 px-6 py-4 rounded-xl text-sm font-semibold shadow-2xl z-50 flex items-center animate-in slide-in-from-bottom-5 fade-in duration-300 border backdrop-blur-md",
          toast.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
        )}>
          {toast.type === 'success' ? <Check className="w-5 h-5 mr-3" /> : <Clock className="w-5 h-5 mr-3" />}
          {toast.message}
        </div>
      )}

      <div className="sticky top-0 z-50 p-4 pb-0 md:p-6 md:pb-0 lg:px-16 lg:pt-8">
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 rounded-[24px] border border-white/[0.08] bg-[#0a0a0b]/60 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden max-w-[1400px] mx-auto w-full">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none rounded-[24px]" />
          
          <div className="flex items-center space-x-4 relative z-10">
            <Link to="/dashboard" className="p-2 text-zinc-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] rounded-xl transition-all border border-white/[0.05] hover:border-white/[0.1] shadow-sm group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center mr-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] relative overflow-hidden hidden sm:flex">
                <div className="absolute inset-0 bg-blue-400/20 blur-md" />
                <BrandLogo className="w-4 h-4 text-blue-400 relative z-10" />
              </div>
              <h1 className="text-[15px] font-bold text-white tracking-tight leading-tight drop-shadow-md">
                Lead Command Center
              </h1>
            </div>
          </div>

          <div className="flex items-center relative z-10">
            <div className="flex items-center space-x-2 text-[10px] text-zinc-400 font-bold tracking-widest bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/[0.05] shadow-inner">
              <span className="uppercase text-white truncate max-w-[100px] sm:max-w-none">{lead.fullName}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span className={cn(
                "uppercase",
                lead.status === 'won' ? "text-emerald-400" :
                lead.status === 'lost' ? "text-red-400" :
                lead.status === 'qualified' ? "text-amber-400" :
                lead.status === 'contacted' ? "text-purple-400" : "text-blue-400"
              )}>{lead.status}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700 hidden md:block" />
              <span className="uppercase text-zinc-500 tracking-wider hidden md:block">
                Updated: {lead.updatedAt ? (lead.updatedAt as any).toDate ? (lead.updatedAt as any).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(lead.updatedAt as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
              </span>
            </div>
          </div>
        </header>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-12 lg:px-16 z-10">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          {/* Top Hero Section */}
          <div className="bg-gradient-to-br from-white/[0.04] to-black/40 border border-white/[0.08] rounded-[24px] p-6 md:p-8 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group hover:border-white/[0.12] transition-colors duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent pointer-events-none opacity-50 mix-blend-screen" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none" />
            
            <div className="flex items-center gap-5 z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/[0.1] flex items-center justify-center text-2xl font-bold text-white shadow-[inset_0_2px_20px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute inset-0 bg-white/[0.02]" />
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 drop-shadow-sm">{lead.fullName.substring(0, 2).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2.5 drop-shadow-lg">{lead.fullName}</h2>
                <div className="flex flex-wrap items-center gap-5 text-sm font-semibold">
                  {lead.company ? (
                    <span className="flex items-center text-zinc-300">
                      <Building className="w-4 h-4 mr-1.5 text-zinc-500" /> {lead.company}
                    </span>
                  ) : (
                    <span className="flex items-center text-zinc-500">-</span>
                  )}
                  {lead.email && (
                    <span className="flex items-center text-zinc-400">
                      <Mail className="w-4 h-4 mr-1.5 text-zinc-500" /> {lead.email}
                    </span>
                  )}
                  {lead.phone && (
                    <span className="flex items-center text-zinc-400">
                      <PhoneCall className="w-4 h-4 mr-1.5 text-zinc-500" /> {lead.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 z-10 shrink-0">
              {/* Status Selector */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Pipeline Stage</span>
                <div className="relative">
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(e.target.value as Lead['status'])}
                    className={cn(
                      "appearance-none px-4 py-2 rounded-xl text-sm font-bold border outline-none cursor-pointer pr-10 transition-colors shadow-sm",
                      lead.status === 'won' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      lead.status === 'lost' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      lead.status === 'qualified' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      lead.status === 'contacted' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}
                  >
                    <option value="new" className="bg-zinc-900 text-white">New Lead</option>
                    <option value="contacted" className="bg-zinc-900 text-white">Contacted</option>
                    <option value="qualified" className="bg-zinc-900 text-white">Qualified</option>
                    <option value="lost" className="bg-zinc-900 text-white">Lost</option>
                    <option value="won" className="bg-zinc-900 text-white">Won</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.5 1.5L6 6L10.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          
          {/* Tabs Navigation */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-black/40 border border-white/[0.08] rounded-2xl w-max relative z-20 backdrop-blur-md mb-8 shadow-inner">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-5 py-2.5 rounded-[12px] text-sm font-bold transition-all flex items-center border ${activeTab === 'overview' ? "bg-white/[0.08] text-white shadow-sm border-white/[0.05]" : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/[0.02]"}`}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('workspace')}
              className={`px-5 py-2.5 rounded-[12px] text-sm font-bold transition-all flex items-center border ${activeTab === 'workspace' ? "bg-white/[0.08] text-white shadow-sm border-white/[0.05]" : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/[0.02]"}`}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Workspace
            </button>
            <button 
              onClick={() => setActiveTab('activity')}
              className={`px-5 py-2.5 rounded-[12px] text-sm font-bold transition-all flex items-center border ${activeTab === 'activity' ? "bg-white/[0.08] text-white shadow-sm border-white/[0.05]" : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/[0.02]"}`}
            >
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </button>
            <button 
              onClick={() => setActiveTab('outreach')}
              className={`px-5 py-2.5 rounded-[12px] text-sm font-bold transition-all flex items-center border ${activeTab === 'outreach' ? "bg-white/[0.08] text-white shadow-sm border-white/[0.05]" : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/[0.02]"}`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Outreach
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-[800px_1fr] lg:grid-cols-[2fr_1fr] gap-6 xl:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              <div className="space-y-6">
                {/* Section 1: Revenue Intelligence */}
              <section className="bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[32px] p-8 shadow-[0_15px_50px_rgba(0,0,0,0.4)] relative overflow-hidden group/card hover:border-white/[0.1] transition-all duration-500 backdrop-blur-3xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none transition-opacity duration-500 group-hover/card:opacity-100 opacity-50" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 shadow-inner">
                      <Sparkles className="w-5 h-5 text-violet-400" />
                    </div>
                    <h3 className="text-[15px] font-bold tracking-widest text-white uppercase drop-shadow-md">
                      Revenue Intelligence
                    </h3>
                  </div>
                  <button 
                    onClick={handleScoreLead} 
                    disabled={isScoring}
                    className="text-xs bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 hover:from-emerald-500/20 hover:to-emerald-600/20 text-emerald-400 px-4 py-2 rounded-xl flex items-center transition-all uppercase font-extrabold tracking-widest border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                  >
                    {isScoring ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    {isScoring ? 'Analyzing...' : lead.aiAnalysis ? 'Re-Analyze Lead' : 'Analyze Lead'}
                  </button>
                </div>

                {lead.aiAnalysis ? (
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 p-5 bg-black/60 rounded-[16px] border border-white/[0.08] shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-3xl font-display font-extrabold text-white tracking-tighter leading-none">{lead.aiAnalysis.score}</span>
                          <span className="text-sm text-zinc-600 font-bold">/100</span>
                        </div>
                        <div className="w-px h-8 bg-white/[0.08]" />
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest border",
                          lead.aiAnalysis.category === 'Hot' ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                          lead.aiAnalysis.category === 'Warm' ? "bg-amber-500/15 text-amber-300 border-amber-500/30" :
                          "bg-blue-500/15 text-blue-300 border-blue-500/30"
                        )}>
                          {lead.aiAnalysis.category}
                        </span>
                      </div>
                      <div className="mt-4 md:mt-0 relative z-10">
                        <span className={cn(
                          "text-[10px] font-extrabold uppercase tracking-[0.2em] flex items-center px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]",
                          lead.aiAnalysis.priority === 'Critical' ? "text-red-400" :
                          lead.aiAnalysis.priority === 'High' ? "text-orange-400" :
                          lead.aiAnalysis.priority === 'Medium' ? "text-yellow-400" : "text-blue-400"
                        )}>
                          <Target className="w-3 h-3 mr-1.5" />
                          {lead.aiAnalysis.priority} Priority
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-[20px] p-6 border border-white/[0.06] flex flex-col group/reasoning">
                        <h4 className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                          <div className="p-1.5 rounded-lg bg-blue-500/10 mr-3">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                          </div>
                          AI Reasoning
                        </h4>
                        <p className="text-[15px] text-zinc-300 leading-relaxed flex-1 font-medium group-hover/reasoning:text-white transition-colors">
                          {lead.aiAnalysis.reason}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-500/5 to-transparent hover:from-emerald-500/10 transition-colors rounded-[20px] p-6 border border-emerald-500/10 flex flex-col group/action">
                        <h4 className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 mr-3">
                            <Target className="w-4 h-4 text-emerald-400" />
                          </div>
                          Recommended Action
                        </h4>
                        <p className="text-[15px] text-zinc-200 leading-relaxed flex-1 font-bold group-hover/action:text-white transition-colors">
                          {lead.aiAnalysis.recommendedAction}
                        </p>
                      </div>
                    </div>

                    {lead.aiAnalysis.evidence && (
                      <div className="bg-black/40 rounded-[20px] p-6 border border-white/[0.06] backdrop-blur-md">
                        <h4 className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-[0.2em] mb-5 flex items-center">
                          <ArrowRight className="w-4 h-4 mr-2 text-violet-400" /> Scoring Evidence
                        </h4>
                        {lead.aiAnalysis.evidence.limitedConfidence && (
                          <div className="mb-5 px-5 py-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center shadow-inner">
                            <Activity className="w-5 h-5 text-amber-400 mr-3 shrink-0" />
                            <p className="text-sm text-amber-300 font-bold">Limited confidence â website data unavailable. Score based on form data only.</p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
                          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 rounded-2xl border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-white/[0.15] transition-colors backdrop-blur-md">
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-extrabold mb-2">Data Weight</p>
                            <p className="text-white font-bold text-[14px] leading-snug">{lead.aiAnalysis.evidence.websiteWeight}% site / {lead.aiAnalysis.evidence.formWeight}% form</p>
                          </div>
                          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 rounded-2xl border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-white/[0.15] transition-colors backdrop-blur-md">
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-extrabold mb-2">Budget Signal</p>
                            <p className="text-white font-bold text-[14px] leading-snug">{lead.aiAnalysis.evidence.budgetSignal}</p>
                          </div>
                          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 rounded-2xl border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-white/[0.15] transition-colors backdrop-blur-md">
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-extrabold mb-2">Growth Signal</p>
                            <p className="text-white font-bold text-[14px] leading-snug">{lead.aiAnalysis.evidence.growthSignal || 'None detected'}</p>
                          </div>
                          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 rounded-2xl border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-white/[0.15] transition-colors backdrop-blur-md">
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-extrabold mb-2">Buying Likelihood</p>
                            <p className="text-white font-bold text-[14px] leading-snug">{lead.aiAnalysis.evidence.buyingLikelihood}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-violet-400" />
                    </div>
                    <p className="text-zinc-400 mb-2">No intelligence gathered yet.</p>
                    <button onClick={handleScoreLead} className="text-violet-400 font-medium hover:text-violet-300 text-sm flex items-center bg-violet-500/10 px-4 py-2 rounded-xl border border-violet-500/20 transition-all">
                      Analyze Lead Now
                      <span className="ml-3 text-[10px] text-violet-400 bg-violet-500/20 px-1.5 py-0.5 rounded-md border border-violet-500/20 font-bold tracking-widest">â¡ ~2k</span>
                    </button>
                  </div>
                )}
              </section>
              </div>
              <div className="space-y-6">                {/* AI Deal Coach + Signals Section */}
                <section className="bg-gradient-to-b from-indigo-500/5 to-transparent border border-indigo-500/20 rounded-[32px] p-8 shadow-[0_15px_50px_rgba(0,0,0,0.4)] relative overflow-hidden backdrop-blur-3xl">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20"><Sparkles className="w-5 h-5 text-indigo-400" /></div>
                      <div><h3 className="text-[15px] font-bold uppercase tracking-widest text-white">AI Deal Coach</h3><p className="text-[10px] text-zinc-500 mt-0.5">Instant deal strategy from your data</p></div>
                    </div>
                    <button onClick={async () => { if (!lead) return; setIsRunningDealCoach(true); try { const result = await generateDealCoach(lead, sellerProfile); setDealCoach(result); const docRef = doc(db, 'leads', lead.id); await updateDoc(docRef, { dealCoach: result, activities: [...(lead.activities || []), { id: crypto.randomUUID(), action: 'AI Deal Coach Run', timestamp: new Date() }], updatedAt: serverTimestamp() }); } catch(e: any) { showToast(e.message || 'Deal Coach failed', 'error'); } finally { setIsRunningDealCoach(false); } }} disabled={isRunningDealCoach} className="text-xs bg-gradient-to-r from-indigo-500/10 to-purple-600/10 hover:from-indigo-500/20 hover:to-purple-600/20 text-indigo-400 px-4 py-2 rounded-xl flex items-center transition-all uppercase font-extrabold tracking-widest border border-indigo-500/30">
                      {isRunningDealCoach ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                      {isRunningDealCoach ? 'Coaching...' : dealCoach ? 'Re-Run' : 'Run Deal Coach'}
                    </button>
                  </div>
                  {dealCoach ? (
                    <div className="relative z-10 space-y-4">
                      <div className={cn("px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2", dealCoach.dealStrength === 'Strong' ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : dealCoach.dealStrength === 'Moderate' ? "bg-amber-500/10 border-amber-500/25 text-amber-400" : "bg-red-500/10 border-red-500/25 text-red-400")}>
                        {dealCoach.dealStrength === 'Strong' ? '??' : dealCoach.dealStrength === 'Moderate' ? '?' : '??'} Deal Strength: {dealCoach.dealStrength}
                      </div>
                      <div className="bg-black/40 rounded-2xl p-4 border border-white/[0.05]"><p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 mb-2">? Why It Will Close</p><p className="text-[13px] text-zinc-200 leading-relaxed">{dealCoach.whyItWillClose}</p></div>
                      <div className="bg-black/40 rounded-2xl p-4 border border-white/[0.05]"><p className="text-[9px] font-bold uppercase tracking-widest text-red-400 mb-2">? Objections</p><ul className="space-y-1">{dealCoach.objections.map((o,i) => <li key={i} className="text-[12px] text-zinc-300 flex items-start gap-2"><span className="text-red-400 shrink-0"></span>{o}</li>)}</ul></div>
                      <div className="bg-black/40 rounded-2xl p-4 border border-white/[0.05]"><p className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mb-2">?? Decision Maker</p><p className="text-[12px] text-zinc-300">{dealCoach.decisionMaker}</p></div>
                      <div className="bg-black/40 rounded-2xl p-4 border border-white/[0.05]"><p className="text-[9px] font-bold uppercase tracking-widest text-violet-400 mb-2">?? Best Angle</p><p className="text-[12px] text-zinc-300">{dealCoach.bestAngle}</p></div>
                      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-4 border border-indigo-500/20"><p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mb-2">? Best CTA</p><p className="text-[13px] text-white font-bold">{dealCoach.bestCta}</p></div>
                    </div>
                  ) : (
                    <div className="relative z-10 py-8 flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3"><Sparkles className="w-6 h-6 text-indigo-400" /></div>
                      <p className="text-sm text-zinc-500">Click <span className="text-indigo-400">Run Deal Coach</span> for instant deal strategy.</p>
                    </div>
                  )}
                  {lead.research && <div className="mt-6 pt-6 border-t border-white/[0.05] relative z-10"><OpportunitySignals lead={lead} /></div>}
                </section>
              {/* Section 2: Website Intelligence */}
              <section className="bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[32px] p-8 shadow-[0_15px_50px_rgba(0,0,0,0.4)] relative overflow-hidden group/card hover:border-white/[0.1] transition-all duration-500 backdrop-blur-3xl">
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none transition-opacity duration-500 group-hover/card:opacity-100 opacity-50" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-inner">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-[15px] font-bold uppercase tracking-widest text-white drop-shadow-md">
                      Website Intelligence
                    </h3>
                  </div>
                  {lead.website && (
                    <button 
                      onClick={handleResearchCompany} 
                      disabled={isResearching}
                      className="text-xs bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 text-blue-400 px-4 py-2 rounded-xl flex items-center transition-all uppercase font-extrabold tracking-widest border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                    >
                      <div className="flex items-center">
                        {isResearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
                        {isResearching ? 'Gathering...' : lead.research ? 'Refresh Data' : 'Gather Data'}
                      </div>
                      <span className="ml-3 text-[9px] text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded-md border border-blue-500/20">â¡ ~1.5k</span>
                    </button>
                  )}
                </div>

                {lead.research ? (
                  <div className="relative z-10 space-y-6">
                    <div className="bg-black/40 rounded-[24px] p-8 border border-white/[0.06] shadow-inner">
                      <div className="flex flex-col md:flex-row items-start justify-between mb-4">
                        <div>
                          <h4 className="text-2xl font-bold text-white mb-1 drop-shadow-md">{lead.research.companyName}</h4>
                          <span className="text-sm text-blue-400 font-bold uppercase tracking-widest">{lead.research.industry}</span>
                        </div>
                      </div>
                      <p className="text-[15px] text-zinc-300 leading-relaxed font-medium mb-6">{lead.research.summary}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/[0.08]">
                        <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/10">
                          <h5 className="text-[11px] uppercase font-extrabold text-emerald-400 tracking-[0.2em] mb-4 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" /> Growth Signals
                          </h5>
                          <ul className="space-y-3">
                            {lead.research.growthSignals.map((signal, i) => (
                              <li key={i} className="text-sm text-zinc-200 font-medium flex items-start">
                                <Check className="w-4 h-4 text-emerald-500 mr-2.5 mt-0.5 shrink-0" />{signal}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/10">
                          <h5 className="text-[11px] uppercase font-extrabold text-red-400 tracking-[0.2em] mb-4 flex items-center">
                            <Target className="w-4 h-4 mr-2" /> Pain Points
                          </h5>
                          <ul className="space-y-3">
                            {lead.research.painPoints.map((point, i) => (
                              <li key={i} className="text-sm text-zinc-200 font-medium flex items-start">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-3 mt-1.5 shrink-0" />{point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                      <Briefcase className="w-8 h-8 text-blue-400" />
                    </div>
                    {lead.website ? (
                      <>
                        <p className="text-zinc-400 mb-2">We haven't scraped their website yet.</p>
                        <button onClick={handleResearchCompany} className="text-blue-400 font-medium hover:text-blue-300 text-sm flex items-center bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 transition-all">
                          Gather Data Now
                          <span className="ml-3 text-[10px] text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded-md border border-blue-500/20 font-bold tracking-widest">â¡ ~1.5k</span>
                        </button>
                      </>
                    ) : (
                      <p className="text-zinc-500 text-sm">Add a website URL to the lead profile to enable gathering intelligence.</p>
                    )}
                  </div>
                )}
              </section>
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="grid grid-cols-1 xl:grid-cols-[800px_1fr] lg:grid-cols-[2fr_1fr] gap-6 xl:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              <div className="space-y-6">
                {/* Section 4: Sales Notes */}
              <section className="bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[32px] p-8 shadow-[0_15px_50px_rgba(0,0,0,0.4)] flex flex-col max-h-[600px] backdrop-blur-3xl group/card hover:border-white/[0.1] transition-all">
                <div className="flex items-center space-x-3 mb-8 shrink-0">
                  <div className="p-2.5 rounded-xl bg-zinc-500/10 border border-zinc-500/20 shadow-inner">
                    <FileText className="w-5 h-5 text-zinc-300" />
                  </div>
                  <h3 className="text-[15px] font-bold uppercase tracking-widest text-white drop-shadow-md">
                    Sales Notes
                  </h3>
                </div>

                {/* AI Summary */}
                {lead.notesSummary && (
                  <div className="mb-6 p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-[20px] shadow-inner relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Sparkles className="w-24 h-24" />
                    </div>
                    <div className="flex items-center mb-3 space-x-2 relative z-10">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span className="text-[11px] uppercase tracking-widest font-extrabold text-blue-400">AI Summary</span>
                      {isGeneratingSummary && <Loader2 className="w-3 h-3 text-blue-400 animate-spin ml-2" />}
                    </div>
                    <div className="text-[14px] text-zinc-200 leading-relaxed font-medium whitespace-pre-wrap relative z-10">
                      {lead.notesSummary}
                    </div>
                  </div>
                )}
                
                <div className="flex-1 overflow-y-auto pr-4 space-y-4 mb-6 custom-scrollbar">
                  {(!lead.notes || lead.notes.length === 0) ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center opacity-50">
                      <FileText className="w-10 h-10 text-zinc-500 mb-3" />
                      <p className="text-sm font-medium text-zinc-400">No notes added yet.</p>
                    </div>
                  ) : (
                    [...lead.notes].sort((a, b) => {
                      if (a.isPinned && !b.isPinned) return -1;
                      if (!a.isPinned && b.isPinned) return 1;
                      return b.timestamp?.toMillis ? b.timestamp.toMillis() - a.timestamp.toMillis() : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                    }).map((note: any, i: number) => (
                      <div key={i} className={cn("bg-black/60 p-5 rounded-[20px] border shadow-inner group/note transition-all flex flex-col relative", note.isPinned ? "border-amber-500/30" : "border-white/[0.06]")}>
                        {editingNoteId === note.id ? (
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {NOTE_TYPES.map(t => (
                                <button key={t.type} onClick={() => setEditingNoteType(t.type)} className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border flex items-center transition-all", editingNoteType === t.type ? t.color : "bg-black/40 text-zinc-500 border-white/[0.05] hover:border-white/[0.2]")}>
                                  <span className="mr-1">{t.icon}</span>{t.label}
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={editingNoteContent}
                              onChange={(e) => setEditingNoteContent(e.target.value)}
                              className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-blue-500/50 resize-none h-[80px]"
                            />
                            <div className="flex space-x-2">
                              <button onClick={() => { handleEditNote(note.id, editingNoteContent, editingNoteType); setEditingNoteId(null); }} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-colors">Save</button>
                              <button onClick={() => setEditingNoteId(null)} className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-white text-[11px] font-bold rounded-lg transition-colors">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-3">
                              <p className="text-[15px] text-zinc-200 leading-relaxed font-medium whitespace-pre-wrap flex-1 mr-4">{note.content}</p>
                              <div className="opacity-0 group-hover/note:opacity-100 flex items-center space-x-1 transition-opacity absolute top-4 right-4 bg-black/80 backdrop-blur-sm p-1 rounded-lg border border-white/[0.05]">
                                <button onClick={() => handleTogglePinNote(note.id)} className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-white/[0.05] transition-colors" title={note.isPinned ? "Unpin Note" : "Pin Note"}>
                                  {note.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                </button>
                                <button onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); setEditingNoteType(note.type || 'General'); }} className="p-1.5 text-zinc-400 hover:text-blue-400 rounded-lg hover:bg-white/[0.05] transition-colors" title="Edit Note">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteNote(note.id)} className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-white/[0.05] transition-colors" title="Delete Note">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center mt-auto justify-between">
                              <div className="flex items-center">
                                {note.isPinned && <Pin className="w-3 h-3 text-amber-500 mr-2" />}
                                <p className="text-[11px] text-zinc-500 uppercase tracking-[0.2em] font-extrabold">
                                  {note.timestamp?.toDate ? note.timestamp.toDate().toLocaleString() : new Date(note.timestamp).toLocaleString()}
                                </p>
                              </div>
                              {(() => {
                                const typeConfig = NOTE_TYPES.find(t => t.type === (note.type || 'General'));
                                return typeConfig ? (
                                  <span className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border flex items-center", typeConfig.color)}>
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

                <form onSubmit={handleAddNote} className="relative mt-auto shrink-0 bg-black/60 border border-white/[0.1] rounded-[20px] p-4 shadow-inner">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {NOTE_TYPES.map(t => (
                      <button type="button" key={t.type} onClick={() => setNewNoteType(t.type)} className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border flex items-center transition-all", newNoteType === t.type ? t.color : "bg-black/40 text-zinc-500 border-white/[0.05] hover:border-white/[0.2]")}>
                        <span className="mr-1">{t.icon}</span>{t.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Log a call or add a note..."
                    className="w-full bg-transparent text-[15px] font-medium text-white placeholder:text-zinc-600 focus:outline-none resize-none h-[60px]"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!newNote.trim()}
                      className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-[11px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                    >
                      Save Note
                    </button>
                  </div>
                </form>
              </section>
                {/* Section 1.5: AI Tasks */}
              <section className="bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[32px] p-8 shadow-[0_15px_50px_rgba(0,0,0,0.4)] flex flex-col max-h-[600px] backdrop-blur-3xl group/card hover:border-white/[0.1] transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 shadow-inner">
                      <ListTodo className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold uppercase tracking-widest text-white drop-shadow-md">AI Tasks</h3>
                      {lead.tasks && lead.tasks.length > 0 && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {lead.tasks.filter(t => t.status !== 'completed').length} pending Â· {lead.tasks.filter(t => t.status === 'completed').length} done
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateTasks}
                    disabled={isGeneratingTasks}
                    className="flex items-center space-x-2 px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 disabled:opacity-50 border border-violet-500/20 text-violet-400 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    <div className="flex items-center">
                      {isGeneratingTasks ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Generatingâ¦</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> {lead.tasks && lead.tasks.length > 0 ? 'Regenerate' : 'Generate Tasks'}</>
                      )}
                    </div>
                    <span className="ml-2 text-[9px] text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded-md border border-violet-500/20">â¡ ~500</span>
                  </button>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto pr-4 mb-6 custom-scrollbar relative z-10">
                  {lead.tasks && lead.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {[...lead.tasks].sort((a, b) => {
                        const order: Record<string, number> = { pending: 0, in_progress: 1, completed: 2 };
                        return (order[a.status] ?? 0) - (order[b.status] ?? 0);
                      }).map(task => (
                        <div
                          key={task.id}
                          className={cn(
                            "group flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200",
                            task.status === 'completed'
                              ? "bg-white/[0.01] border-white/[0.04] opacity-60"
                              : task.status === 'in_progress'
                              ? "bg-amber-500/5 border-amber-500/15 hover:border-amber-500/30"
                              : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]"
                          )}
                        >
                          {/* Status Button */}
                          <button
                            onClick={() => handleToggleTaskStatus(task.id)}
                            className="shrink-0 transition-transform hover:scale-110"
                            title={`Status: ${task.status}. Click to advance.`}
                          >
                            {task.status === 'completed' ? (
                              <CircleCheck className="w-5 h-5 text-emerald-400" />
                            ) : task.status === 'in_progress' ? (
                              <CircleDot className="w-5 h-5 text-amber-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                            )}
                          </button>

                          {/* Task Title */}
                          <span className={cn(
                            "flex-1 text-[14px] font-medium leading-snug transition-colors",
                            task.status === 'completed' ? "line-through text-zinc-500" : "text-zinc-200"
                          )}>
                            {task.title}
                          </span>

                          {/* Source Badge */}
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0",
                            task.source === 'ai'
                              ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                              : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                          )}>
                            {task.source === 'ai' ? 'â¨ AI' : 'Manual'}
                          </span>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                        <ListTodo className="w-7 h-7 text-violet-400" />
                      </div>
                      <p className="text-zinc-400 text-sm mb-1 font-medium">No tasks yet.</p>
                      <p className="text-zinc-600 text-xs">Click "Generate Tasks" to create AI-powered next steps.</p>
                    </div>
                  )}
                </div>

                {/* Add Manual Task */}
                <div className="relative z-10 flex items-center gap-2 bg-black/40 border border-white/[0.08] rounded-xl px-4 py-2.5 shrink-0">
                  <Plus className="w-4 h-4 text-zinc-500 shrink-0" />
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
                    placeholder="Add a task manuallyâ¦"
                    className="flex-1 bg-transparent text-[13px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
                  />
                  <button
                    onClick={submitManualTask}
                    disabled={!newTaskTitle.trim()}
                    className="text-[10px] font-bold uppercase tracking-wider text-violet-400 hover:text-violet-300 disabled:opacity-40 transition-colors shrink-0"
                  >
                    Add
                  </button>
                </div>
              </section>
              </div>
              <div className="space-y-6">
                {/* Section 5: Follow-Up Center */}
              <section className="bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[32px] p-8 shadow-[0_15px_50px_rgba(0,0,0,0.4)] relative overflow-hidden backdrop-blur-3xl group/card hover:border-white/[0.1] transition-all">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-inner">
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="text-[15px] font-bold uppercase tracking-widest text-white drop-shadow-md">
                    Follow-Up Center
                  </h3>
                </div>
                
                <div className="space-y-6">
                  {/* Status Indicator */}
                  {followUpInfo && (
                    <div className={cn(
                      "px-6 py-5 rounded-[20px] border shadow-inner flex items-center justify-between backdrop-blur-md",
                      followUpInfo === 'overdue' ? "bg-red-500/10 border-red-500/20" :
                      followUpInfo === 'due_today' ? "bg-yellow-500/10 border-yellow-500/20" :
                      followUpInfo === 'completed' ? "bg-zinc-500/10 border-zinc-500/20" :
                      "bg-emerald-500/10 border-emerald-500/20"
                    )}>
                      <div>
                        <p className={cn(
                          "text-[13px] font-extrabold uppercase tracking-[0.2em]",
                          followUpInfo === 'overdue' ? "text-red-400" :
                          followUpInfo === 'due_today' ? "text-yellow-400" :
                          followUpInfo === 'completed' ? "text-zinc-400" :
                          "text-emerald-400"
                        )}>
                          {followUpInfo === 'overdue' ? "Overdue" :
                           followUpInfo === 'due_today' ? "Due Today" :
                           followUpInfo === 'completed' ? "Completed" : "Scheduled"}
                        </p>
                        {lead.followUpDate && (
                          <p className="text-sm text-zinc-300 font-bold mt-1.5">
                            {lead.followUpDate.toDate().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                      
                      {lead.followUpStatus === 'scheduled' && (
                        <button 
                          onClick={() => handleUpdateFollowUp(null, 'completed')}
                          className="w-12 h-12 rounded-full bg-white/[0.05] hover:bg-emerald-500/20 flex items-center justify-center transition-all border border-white/[0.05] hover:border-emerald-500/30 group shadow-md"
                          title="Mark Complete"
                        >
                          <Check className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() + 1);
                        handleUpdateFollowUp(d, 'scheduled');
                      }}
                      className="px-4 py-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] rounded-2xl text-[13px] font-bold text-zinc-200 transition-all shadow-sm"
                    >
                      Tomorrow
                    </button>
                    <button
                      onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() + 3);
                        handleUpdateFollowUp(d, 'scheduled');
                      }}
                      className="px-4 py-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] rounded-2xl text-[13px] font-bold text-zinc-200 transition-all shadow-sm"
                    >
                      In 3 Days
                    </button>
                    <button
                      onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() + 7);
                        handleUpdateFollowUp(d, 'scheduled');
                      }}
                      className="px-4 py-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] rounded-2xl text-[13px] font-bold text-zinc-200 transition-all shadow-sm"
                    >
                      Next Week
                    </button>
                    <button
                      onClick={() => handleUpdateFollowUp(null, 'completed')}
                      className="px-4 py-3 bg-zinc-500/10 hover:bg-zinc-500/20 border border-zinc-500/20 text-zinc-300 rounded-2xl text-[13px] font-bold transition-all shadow-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </section>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              {/* Section 6: Activity Timeline */}
              <section className="bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[32px] p-8 shadow-[0_15px_50px_rgba(0,0,0,0.4)] flex flex-col max-h-[600px] backdrop-blur-3xl group/card hover:border-white/[0.1] transition-all">
                <div className="flex items-center space-x-3 mb-8 shrink-0">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-inner">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-[15px] font-bold uppercase tracking-widest text-white drop-shadow-md">
                    Activity Timeline
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar relative pl-4">
                  {lead.activities?.map((activity, i) => {
                    let Icon = Activity;
                    let color = "text-blue-400";
                    let bg = "bg-blue-500/10";
                    let border = "border-blue-500/20";
                    
                    if (activity.action.includes('Email')) {
                      Icon = Mail; color = "text-emerald-400"; bg = "bg-emerald-500/10"; border = "border-emerald-500/20";
                    } else if (activity.action.includes('Note')) {
                      Icon = FileText; color = "text-purple-400"; bg = "bg-purple-500/10"; border = "border-purple-500/20";
                    } else if (activity.action.includes('Follow-Up') || activity.action.includes('Follow Up')) {
                      Icon = CalendarCheck; color = "text-amber-400"; bg = "bg-amber-500/10"; border = "border-amber-500/20";
                    } else if (activity.action.includes('Meeting') || activity.action.includes('Call')) {
                      Icon = PhoneCall; color = "text-indigo-400"; bg = "bg-indigo-500/10"; border = "border-indigo-500/20";
                    }

                    return (
                    <div key={i} className="flex items-start relative z-10 group/item">
                      <div className="absolute left-[15px] top-10 bottom-[-24px] w-px bg-white/[0.08] group-last/item:hidden" />
                      <div className={`w-8 h-8 rounded-full ${bg} ${border} border flex items-center justify-center shrink-0 z-10 mr-4 shadow-sm`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="flex-1 bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 shadow-sm group-hover/item:border-white/[0.1] group-hover/item:bg-white/[0.04] transition-all">
                        <p className="text-[14px] font-bold text-white">{activity.action}</p>
                        <p className="text-[11px] text-zinc-500 mt-1 font-semibold uppercase tracking-widest">
                          {activity.timestamp?.toDate ? activity.timestamp.toDate().toLocaleString() : new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )})}
                  {(!lead.activities || lead.activities.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-12 text-center border border-white/[0.04] bg-white/[0.01] rounded-3xl border-dashed">
                      <Activity className="w-8 h-8 text-zinc-600 mb-3" />
                      <p className="text-[15px] text-zinc-500 font-medium">No activities logged yet.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'outreach' && (
            <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              {/* Section 3: Outreach Center */}
              <section className="bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[32px] p-8 shadow-[0_15px_50px_rgba(0,0,0,0.4)] relative overflow-hidden group/card hover:border-white/[0.1] transition-all duration-500 backdrop-blur-3xl">
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
                      <MessageSquare className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-[15px] font-bold uppercase tracking-widest text-white drop-shadow-md">
                      Outreach Center
                    </h3>
                  </div>
                  {lead.aiAnalysis && (
                    <button 
                      onClick={handleRegenerateOutreach} 
                      disabled={isRegeneratingOutreach}
                      className="text-xs bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 hover:from-emerald-500/20 hover:to-emerald-600/20 text-emerald-400 px-4 py-2 rounded-xl flex items-center transition-all uppercase font-extrabold tracking-widest border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    >
                      <div className="flex items-center">
                        {isRegeneratingOutreach ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {isRegeneratingOutreach ? 'Generating...' : 'Regenerate'}
                      </div>
                      <span className="ml-3 text-[9px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-md border border-emerald-500/20">â¡ ~800</span>
                    </button>
                  )}
                </div>

                {lead.aiAnalysis?.followUp ? (
                  <div className="relative z-10 space-y-6">
                    {/* Email Script */}
                    {lead.aiAnalysis.followUp.email && (
                      <div className="bg-[#0a0a0b] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl relative group/copy transition-all hover:border-white/[0.12]">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                        <div className="bg-[#121214] px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-2 mr-6">
                              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                            </div>
                            <h4 className="text-[13px] font-bold text-zinc-300 flex items-center tracking-wide font-mono bg-white/[0.04] px-3 py-1 rounded-md border border-white/[0.05]">
                              <Terminal className="w-3.5 h-3.5 mr-2 text-blue-400" /> email_draft.md
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => setEmailingLead(lead)}
                              className="text-white bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-all flex items-center shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span className="ml-2 text-[10px] font-bold tracking-wider uppercase">Send Draft</span>
                            </button>
                            <button 
                              onClick={() => handleCopy(lead.aiAnalysis!.followUp!.email, 'email')}
                              className="text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 rounded-lg border border-white/[0.05] transition-all flex items-center"
                            >
                              {copiedText === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span className="ml-2 text-[10px] font-bold tracking-wider uppercase">Copy</span>
                            </button>
                          </div>
                        </div>
                        <div className="p-6 text-[14px] text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed relative z-10 selection:bg-blue-500/30">
                          {lead.aiAnalysis.followUp.email}
                        </div>
                      </div>
                    )}

                    {/* LinkedIn Script */}
                    {lead.aiAnalysis.followUp.linkedin && (
                      <div className="bg-[#0a0a0b] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl relative group/copy transition-all hover:border-white/[0.12]">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                        <div className="bg-[#121214] px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                           <div className="flex items-center space-x-2">
                            <div className="flex space-x-1.5 mr-4">
                              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
                              <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/30" />
                              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
                            </div>
                            <h4 className="text-[13px] font-bold text-zinc-300 flex items-center tracking-wide font-mono">
                              <Terminal className="w-3.5 h-3.5 mr-2 text-indigo-400" /> linkedin_dm.md
                            </h4>
                          </div>
                          <button 
                            onClick={() => handleCopy(lead.aiAnalysis!.followUp!.linkedin, 'linkedin')}
                            className="text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 rounded-lg border border-white/[0.05] transition-all flex items-center"
                          >
                            {copiedText === 'linkedin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="ml-2 text-[10px] font-bold tracking-wider uppercase">Copy</span>
                          </button>
                        </div>
                        <div className="p-6 text-[14px] text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed relative z-10 selection:bg-indigo-500/30">
                          {lead.aiAnalysis.followUp.linkedin}
                        </div>
                      </div>
                    )}

                    {/* Call Script */}
                    {lead.aiAnalysis.followUp.callScript && (
                       <div className="bg-[#0a0a0b] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl relative group/copy transition-all hover:border-white/[0.12]">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
                        <div className="bg-[#121214] px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                           <div className="flex items-center space-x-2">
                            <div className="flex space-x-1.5 mr-4">
                              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
                              <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/30" />
                              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
                            </div>
                            <h4 className="text-[13px] font-bold text-zinc-300 flex items-center tracking-wide font-mono">
                              <Terminal className="w-3.5 h-3.5 mr-2 text-purple-400" /> call_script.txt
                            </h4>
                          </div>
                          <button 
                            onClick={() => handleCopy(lead.aiAnalysis!.followUp!.callScript, 'call')}
                            className="text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 rounded-lg border border-white/[0.05] transition-all flex items-center"
                          >
                            {copiedText === 'call' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="ml-2 text-[10px] font-bold tracking-wider uppercase">Copy</span>
                          </button>
                        </div>
                        <div className="p-6 text-[14px] text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed relative z-10 selection:bg-purple-500/30">
                          {lead.aiAnalysis.followUp.callScript}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <p className="text-zinc-500 text-sm">Analyze the lead to generate personalized outreach scripts.</p>
                  </div>
                )}
              </section>
            </div>
          )}

        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={cn(
              "fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-medium max-w-[90vw] whitespace-normal break-words text-center",
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300 shadow-emerald-500/10'
                : 'bg-red-950/90 border-red-500/30 text-red-300 shadow-red-500/10'
            )}
          >
            {toast.type === 'success'
              ? <Check className="w-4 h-4 mr-2.5 text-emerald-400 shrink-0" />
              : <Zap className="w-4 h-4 mr-2.5 text-red-400 shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <EmailReviewModal
        isOpen={!!emailingLead}
        onClose={() => setEmailingLead(null)}
        lead={emailingLead}
        onSendSuccess={handleSendEmailSuccess}
      />
      
      <TokenUpgradeModal
        isOpen={!!tokenModalError}
        onClose={() => setTokenModalError(null)}
        errorDetails={tokenModalError || undefined}
      />

    </Shell>
  );
}

