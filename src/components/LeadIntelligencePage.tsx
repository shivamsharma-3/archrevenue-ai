import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Lead, SellerProfile, NoteType, Note } from '../lib/types';
import { getFollowUpStatus } from '../lib/utils';
import { generateNotesSummary } from '../lib/ai';
import { getProfile } from '../lib/profile';
import posthog from 'posthog-js';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Shell from './Shell';
import { RevenueIntelligenceEngine } from '../lib/engine/RevenueIntelligenceEngine';

// Design System Primitives
import { Page, PageHeader, PageContent } from './layout/PageLayout';
import { AppButton } from './ui/AppButton';

// Refactored Sub-Components
import { LeadHeader } from './lead/LeadHeader';
import { ExecutiveBriefing } from './lead/ExecutiveBriefing';
import { CompanyIntelligenceGraph } from './lead/CompanyIntelligenceGraph';
import { BuyingSignals } from './lead/BuyingSignals';
import { StakeholderMap } from './lead/StakeholderMap';
import { RevenueStrategy } from './lead/RevenueStrategy';
import { OutreachPlaybook } from './lead/OutreachPlaybook';
import { AccountTimeline, NOTE_TYPES } from './lead/AccountTimeline';
import { IntelligenceProgress } from './lead/IntelligenceProgress';

export { NOTE_TYPES };

export default function LeadIntelligencePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);

  // Workflow State
  const [isWorkflowDismissed, setIsWorkflowDismissed] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const isAnalyzing = lead?.activeWorkflow?.status === 'running';

  useEffect(() => {
    if (!id) return;
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
      const docRef = doc(db, 'leads', stateLeadId);
      unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setLead({ id: docSnap.id, ...docSnap.data() } as Lead);
        } else {
          navigate('/dashboard');
        }
        setLoading(false);
      });
    } else {
      const leadsRef = collection(db, 'leads');
      const currentUserId = auth.currentUser?.uid;
      
      if (!currentUserId) {
        setLoading(false);
        return;
      }

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
          const docRef = doc(db, 'leads', decodedId);
          unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              setLead({ id: docSnap.id, ...docSnap.data() } as Lead);
            } else {
              navigate('/dashboard');
            }
            setLoading(false);
          });
        }
      });
    }

    return () => {
      if (unsubscribeQuery) unsubscribeQuery();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, [id, navigate, location.state]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // We are stripping the custom toast for simplicity in this file for now,
    // assuming it could be handled by a global context, but we will just console log/alert.
    console.log(`[${type}] ${message}`);
  };

  // -----------------------------------------------------
  // AI Interactions (Workflow Engine)
  // -----------------------------------------------------
  const handleAnalyzeAccount = useCallback(async () => {
    if (!lead || !lead.id || !sellerProfile) return;
    setIsWorkflowDismissed(false);
    showToast('Starting Account Analysis...', 'success');
    try {
      await RevenueIntelligenceEngine.startWorkflow(lead.id, sellerProfile, true);
    } catch (e: any) {
      console.error(e);
      showToast('Workflow engine failed to start', 'error');
    }
  }, [lead, sellerProfile]);

  const handleRetryJob = useCallback(async (jobId: string) => {
    if (!lead || !lead.id || !sellerProfile) return;
    try {
      await RevenueIntelligenceEngine.retryJob(lead.id, jobId, sellerProfile);
    } catch (e: any) {
      console.error(e);
    }
  }, [lead, sellerProfile]);

  // -----------------------------------------------------
  // Data Mutators
  // -----------------------------------------------------
  const handleStatusChange = useCallback(async (newStatus: Lead['status']) => {
    if (!lead || !lead.id) return;
    const docRef = doc(db, 'leads', lead.id);
    const newActivities = [...(lead.activities || []), { id: crypto.randomUUID(), action: `Stage updated to ${newStatus}`, timestamp: new Date() }];
    await updateDoc(docRef, { status: newStatus, activities: newActivities, updatedAt: serverTimestamp() });
  }, [lead]);

  const handleAddNote = useCallback(async (content: string, type: NoteType) => {
    if (!lead || !lead.id) return;
    const note: Note = { id: crypto.randomUUID(), content, type, timestamp: new Date() };
    const newActivities = [...(lead.activities || []), { id: crypto.randomUUID(), action: `Note Added (${type})`, timestamp: new Date() }];
    const newNotes = [...(lead.notes || []), note];
    const docRef = doc(db, 'leads', lead.id);
    await updateDoc(docRef, { notes: newNotes, activities: newActivities, updatedAt: serverTimestamp() });
    triggerNotesSummary(newNotes);
  }, [lead]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (!lead || !lead.id || !lead.notes) return;
    const newNotes = lead.notes.filter(n => n.id !== noteId);
    const docRef = doc(db, 'leads', lead.id);
    await updateDoc(docRef, { notes: newNotes, updatedAt: serverTimestamp() });
    triggerNotesSummary(newNotes);
  }, [lead]);

  const handleEditNote = useCallback(async (noteId: string, newContent: string, newType: NoteType) => {
    if (!lead || !lead.id || !lead.notes) return;
    const newNotes = lead.notes.map(n => n.id === noteId ? { ...n, content: newContent, type: newType } : n);
    const docRef = doc(db, 'leads', lead.id);
    await updateDoc(docRef, { notes: newNotes, updatedAt: serverTimestamp() });
    triggerNotesSummary(newNotes);
  }, [lead]);

  const handleTogglePinNote = useCallback(async (noteId: string) => {
    if (!lead || !lead.id || !lead.notes) return;
    const newNotes = lead.notes.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n);
    const docRef = doc(db, 'leads', lead.id);
    await updateDoc(docRef, { notes: newNotes, updatedAt: serverTimestamp() });
  }, [lead]);

  const triggerNotesSummary = async (notes: Note[]) => {
    if (!lead || !lead.id) return;
    try {
      const summary = await generateNotesSummary(notes);
      const docRef = doc(db, 'leads', lead.id);
      await updateDoc(docRef, { notesSummary: summary, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSendEmail = () => {
    showToast('Send email functionality placeholder', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!lead) return null;

  return (
    <Shell hideSidebar={true}>
      <Page>
        <PageHeader title="Revenue Workspace" description="Your AI-driven operating system for this account.">
          <AppButton variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/dashboard')}>
            Back
          </AppButton>
        </PageHeader>

        <PageContent className="gap-8 max-w-[1200px] mx-auto pb-24">
          <LeadHeader lead={lead} onStatusChange={handleStatusChange} onAnalyze={handleAnalyzeAccount} isAnalyzing={isAnalyzing} />
          
          {lead.activeWorkflow && !isWorkflowDismissed && (
            <IntelligenceProgress 
              workflow={lead.activeWorkflow} 
              onRetryJob={handleRetryJob}
              onDismiss={() => setIsWorkflowDismissed(true)} 
            />
          )}

          <ExecutiveBriefing lead={lead} />

          <CompanyIntelligenceGraph lead={lead} />

          <BuyingSignals lead={lead} />

          <StakeholderMap lead={lead} />

          <RevenueStrategy lead={lead} />

          <OutreachPlaybook 
            lead={lead} 
            onCopy={handleCopy}
            copiedText={copiedText}
            onSendEmail={handleSendEmail}
          />

          <AccountTimeline 
            lead={lead}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onEditNote={handleEditNote}
            onTogglePinNote={handleTogglePinNote}
          />
        </PageContent>
      </Page>
    </Shell>
  );
}
