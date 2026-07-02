import React, { useEffect, useState, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, arrayUnion, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Lead, LeadStatus, OperationType, SellerProfile } from '../lib/types';
import { handleFirestoreError } from '../lib/errorHandling';
import { LogOut, Plus, Search, MoreHorizontal, LayoutDashboard, Users, Activity, BarChart, Phone, Mail, Building, Trash2, Edit2, Settings, Target, Clock, TrendingUp, User, Briefcase, Shield, Save, Sparkles, Loader2, CalendarCheck, CheckCircle, XCircle, Calendar, Pencil, RefreshCw, Eye, HelpCircle, X, Lightbulb, Upload, ArrowRight, Bell, Brain, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import Shell from '../components/Shell';
import LeadFormModal from '../components/LeadFormModal';
import CsvImportModal from '../components/CsvImportModal';
import LeadDetailsPanel from '../components/LeadDetailsPanel';
import CompanyProfileWizard from '../components/CompanyProfileWizard';
import { scoreLead, regenerateOutreach } from '../lib/ai';
import { connectCalendar, connectGmail } from '../lib/firebase';
import { bookMeeting } from '../lib/calendar';
import { researchCompany } from '../lib/research';
import { getProfile } from '../lib/profile';
import BrandLogo from '../components/BrandLogo';
import { EmailReviewModal } from '../components/EmailReviewModal';
import { getFollowUpStatus } from '../lib/utils';
import TokenUpgradeModal from '../components/TokenUpgradeModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';


// ─── CSV Export Helper ────────────────────────────────────────────────────────
function exportLeadsToCSV(leads: Lead[]) {
  const headers = ['Full Name', 'Email', 'Phone', 'Company', 'Website', 'Industry', 'Status', 'Revenue Opportunity', 'AI Category', 'Urgency', 'Estimated Budget', 'Lead Source', 'Created At'];
  const rows = leads.map(l => [
    l.fullName || '',
    l.email || '',
    l.phone || '',
    l.company || '',
    l.website || '',
    l.industry || '',
    l.status || '',
    l.aiAnalysis?.score ?? '',
    l.aiAnalysis?.category ?? '',
    l.urgency || '',
    l.estimatedBudget || '',
    l.leadSource || '',
    l.createdAt?.toDate ? l.createdAt.toDate().toLocaleDateString() : '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `archrevenue-leads-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import { Outlet, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AppLayout() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const location = useLocation();

  // Seller profile
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [showProfileWizard, setShowProfileWizard] = useState(false);

  // AI Scoring state
  const [aiScoringLoading, setAiScoringLoading] = useState<Record<string, boolean>>({});
  const [outreachRegenerating, setOutreachRegenerating] = useState<Record<string, boolean>>({});
  const [bookingLoading, setBookingLoading] = useState<Record<string, boolean>>({});
  const [researchLoading, setResearchLoading] = useState<Record<string, boolean>>({});

  // Toast notifications
  const [tokenModalError, setTokenModalError] = useState<string | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error' && (message.toLowerCase().includes('token') || message.toLowerCase().includes('decommissioned') || (message.toLowerCase().includes('limit') && !message.toLowerCase().includes('rate limit')) || message.toLowerCase().includes('invalid_request_error'))) {
      setTokenModalError(message);
      return;
    }
    if (type === 'success') toast.success(message);
    else toast.error(message);
  };

  // Calendar connection state
  const [calendarConnected, setCalendarConnected] = useState(!!localStorage.getItem('gcal_token'));
  const [calendarConnecting, setCalendarConnecting] = useState(false);

  // Gmail connection state
  const [gmailConnected, setGmailConnected] = useState(!!localStorage.getItem('gmail_token'));
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [emailingLead, setEmailingLead] = useState<Lead | null>(null);
  const [bookingPromptLead, setBookingPromptLead] = useState<Lead | null>(null);

  // Tooltips & Hints
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [showDirectoryMenu, setShowDirectoryMenu] = useState(false);
  const [showHint, setShowHint] = useState(() => !localStorage.getItem('hideLeadDiscoveryHint'));
  const [filterFollowUpsDueToday, setFilterFollowUpsDueToday] = useState(false);
  const [filterHotOnly, setFilterHotOnly] = useState(false);
  const [filterUnanalyzed, setFilterUnanalyzed] = useState(false);
  const [filterAnalyzed, setFilterAnalyzed] = useState(false);
  const [filterNew, setFilterNew] = useState(false);
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [filterNeedsEnrichment, setFilterNeedsEnrichment] = useState(false);
  const [filterHighValue, setFilterHighValue] = useState(false);

  // Multi-select for bulk operations
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const directoryMenuRef = useRef<HTMLDivElement>(null);

    // --- REAL HANDLERS ---
    useEffect(() => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid, 'profile', 'main');
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setSellerProfile({ id: docSnap.id, ...(docSnap.data() as any) } as SellerProfile);
        } else if (!localStorage.getItem('profileDismissed')) {
          setShowProfileWizard(true);
        }
      }, (error) => {
        console.error("Error fetching seller profile:", error);
        if (!localStorage.getItem('profileDismissed')) {
          setShowProfileWizard(true);
        }
      });
      return () => unsubscribe();
    }, []);

    useEffect(() => {
      if (!auth.currentUser) return;
      const q = query(collection(db, 'leads'), where('userId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lead[];
        setLeads(leadsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching leads:", error);
        handleFirestoreError(error, 'read' as OperationType, 'leads');
        setLoading(false);
      });
      return () => unsubscribe();
    }, [auth.currentUser]);

  const handleAddOrEditLead = async (leadData: Partial<Lead>) => {
    try {
      if (editingLead && editingLead.id) {
        const leadRef = doc(db, 'leads', editingLead.id);
        await updateDoc(leadRef, { ...leadData, updatedAt: serverTimestamp() });
        showToast('Lead updated successfully', 'success');
        } else {
          await addDoc(collection(db, 'leads'), { ...leadData, userId: auth.currentUser!.uid, userEmail: auth.currentUser!.email!, createdAt: serverTimestamp(), status: 'new', activities: [] });
          showToast('Lead created successfully', 'success');
        }
      setIsModalOpen(false);
      setEditingLead(null);
    } catch (error: any) {
      handleFirestoreError(error, 'read' as OperationType, 'leads');
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'leads', id));
      if (selectedLead?.id === id) {
        setIsDetailsPanelOpen(false);
        setSelectedLead(null);
      }
      showToast('Lead deleted successfully', 'success');
    } catch (error: any) {
      handleFirestoreError(error, 'read' as OperationType, 'leads');
      showToast('Failed to delete lead', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) return;
    try {
      for (const id of Array.from<string>(selectedLeads)) {
        await deleteDoc(doc(db, 'leads', id));
      }
      setSelectedLeads(new Set());
      showToast(`Deleted $ leads successfully`, 'success');
    } catch (error: any) {
      handleFirestoreError(error, 'read' as OperationType, 'leads');
      showToast('Failed to delete some leads', 'error');
    }
  };

  const toggleSelectLead = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedLeads(newSelected);
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(visibleIds));
    }
  };

  const handleExportCsv = () => exportLeadsToCSV(leads);

  const handleBookMeeting = async (lead: Lead) => {
    if (!lead.id) return;
    setBookingLoading(prev => ({ ...prev, [lead.id!]: true }));
    try {
      await bookMeeting(lead, localStorage.getItem('gcal_token') || '');
      showToast('Meeting scheduled successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to schedule meeting', 'error');
    } finally {
      setBookingLoading(prev => ({ ...prev, [lead.id!]: false }));
    }
  };

  const handleStatusChange = async (lead: Lead, status: LeadStatus) => {
    if (!lead.id) return;
    try {
      const leadRef = doc(db, 'leads', lead.id);
      const newActivity = { id: crypto.randomUUID(), action: "Status changed to " + status, timestamp: new Date() };
      await updateDoc(leadRef, { 
        status, 
        updatedAt: serverTimestamp(),
        activities: arrayUnion(newActivity)
      });
      showToast(`Lead moved to $`, 'success');
    } catch (error: any) {
      handleFirestoreError(error, 'read' as OperationType, 'leads');
      showToast('Failed to update status', 'error');
    }
  };

  const handleSendEmailSuccess = async (edited: boolean, msgId?: string, threadId?: string) => {
    if (!emailingLead?.id) return;
    try {
      const leadRef = doc(db, 'leads', emailingLead.id);
      const newActivity = { id: crypto.randomUUID(), action: "Email sent " + (edited ? "(edited)" : ""), timestamp: new Date() };
      await updateDoc(leadRef, {
        status: 'contacted',
        lastContactedAt: serverTimestamp(),
        activities: arrayUnion(newActivity),
        gmailMessageId: msgId || null,
        gmailThreadId: threadId || null
      });
      showToast('Email sent successfully', 'success');
    } catch (error: any) {
      showToast('Failed to update lead after sending email', 'error');
    }
  };

  const [scoreConfirmLead, setScoreConfirmLead] = useState<Lead | null>(null);

  const handleScoreLead = async (lead: Lead) => {
    if (!lead.id) return;
    if (lead.aiAnalysis) {
      setScoreConfirmLead(lead);
      return;
    }
    await executeScoreLead(lead);
  };

  const executeScoreLead = async (lead: Lead) => {
    setAiScoringLoading(prev => ({ ...prev, [lead.id!]: true }));
    try {
      const analysis = await scoreLead(lead);

      const leadRef = doc(db, 'leads', lead.id);
      await updateDoc(leadRef, { aiAnalysis: analysis, updatedAt: serverTimestamp() });
      showToast('Lead scored successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Scoring failed', 'error');
    } finally {
      setAiScoringLoading(prev => ({ ...prev, [lead.id!]: false }));
    }
  };

  const handleRegenerateOutreach = async (lead: Lead) => {
    if (!lead.id) return;
    setOutreachRegenerating(prev => ({ ...prev, [lead.id!]: true }));
    try {
      if (!sellerProfile) throw new Error("Seller profile required for outreach generation");
      const analysis = await regenerateOutreach(lead, sellerProfile);
      const leadRef = doc(db, 'leads', lead.id);
      await updateDoc(leadRef, { aiAnalysis: analysis, updatedAt: serverTimestamp() });
      showToast('Outreach regenerated', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to regenerate', 'error');
    } finally {
      setOutreachRegenerating(prev => ({ ...prev, [lead.id!]: false }));
    }
  };

  const handleUpdateFollowUp = async (lead: Lead, date: Date | null, status: string) => {
    if (!lead.id) return;
    try {
      const leadRef = doc(db, 'leads', lead.id);
      await updateDoc(leadRef, { followUpDate: date, updatedAt: serverTimestamp() });
      showToast('Follow-up updated', 'success');
    } catch (error: any) {
      showToast('Failed to update follow-up', 'error');
    }
  };

  const handleAddNote = async (lead: Lead, content: string) => {
    if (!lead.id) return;
    try {
      const leadRef = doc(db, 'leads', lead.id);
      const newActivity = { id: crypto.randomUUID(), action: "Note added: " + content.substring(0, 50), timestamp: new Date() };
      await updateDoc(leadRef, {
        notes: (lead.notes || '') + '"\n"' + content,
        activities: arrayUnion(newActivity),
        updatedAt: serverTimestamp()
      });
      showToast('Note added', 'success');
    } catch (error: any) {
      showToast('Failed to add note', 'error');
    }
  };

  const handleResearchCompany = async (lead: Lead) => {
    if (!lead.id || !lead.company) return;
    setResearchLoading(prev => ({ ...prev, [lead.id!]: true }));
    try {
      const analysis = await researchCompany(lead.company);
      const leadRef = doc(db, 'leads', lead.id);
      await updateDoc(leadRef, { 
        companyResearch: analysis,
        updatedAt: serverTimestamp() 
      });
      showToast('Company research completed', 'success');
    } catch (error: any) {
      showToast(error.message || 'Research failed', 'error');
    } finally {
      setResearchLoading(prev => ({ ...prev, [lead.id!]: false }));
    }
  };

  const saveBookingSuccess = async (lead: Lead, details: string) => {
    // stub
  };

  const handleMigrateLegacyData = async () => {};

  const openEditModal = (lead: Lead) => { setEditingLead(lead); setIsModalOpen(true); };
  const openDetailsPanel = (lead: Lead) => { setSelectedLead(lead); setIsDetailsPanelOpen(true); };
  
  const handleKanbanStatusChange = async (leadId: string, status: LeadStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) await handleStatusChange(lead, status);
  };
  
  const handleLogout = () => auth.signOut();

  const filteredLeads = leads.filter(lead => {
    if (search && !lead.fullName?.toLowerCase().includes(search.toLowerCase()) && !lead.company?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterHotOnly && lead.aiAnalysis?.category !== 'Hot') return false;
    if (filterUnanalyzed && lead.aiAnalysis?.score) return false;
    if (filterAnalyzed && !lead.aiAnalysis?.score) return false;
    if (filterNew && lead.status !== 'new') return false;
    if (filterOverdue) {
      const status = getFollowUpStatus(lead);
      if (status !== 'overdue') return false;
    }
    if (filterNeedsEnrichment && (lead.email && lead.phone)) return false;
    if (filterHighValue && (Number(lead.estimatedBudget) || 0) < 10000) return false;
    if (filterFollowUpsDueToday) {
      const status = getFollowUpStatus(lead);
      if (status !== 'due_today' && status !== 'overdue') return false;
    }
    return true;
  });

  const visibleIds = new Set(filteredLeads.map(l => l.id!));
  const allVisibleSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedLeads.has(l.id!));
  const someSelected = selectedLeads.size > 0;
  
  const statusColors: Record<string, string> = {
    new: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    contacted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    qualified: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    proposal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    won: 'bg-green-500/10 text-green-400 border-green-500/20',
    lost: 'bg-red-500/10 text-red-400 border-red-500/20'
  };
  
  const stats = {
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === 'new').length,
    activeDeals: leads.filter(l => ['contacted', 'qualified', 'proposal'].includes(l.status)).length,
    wonDeals: leads.filter(l => l.status === 'won').length,
    totalValue: leads.filter(l => l.status === 'won').reduce((sum, l) => sum + (Number(l.estimatedBudget) || 0), 0)
  };
  
  const winRate = stats.totalLeads > 0 ? Math.round((stats.wonDeals / stats.totalLeads) * 100) : 0;
  // -------------------------------------

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showDirectoryMenu && directoryMenuRef.current && !directoryMenuRef.current.contains(event.target as Node)) {
        setShowDirectoryMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDirectoryMenu]);
    
  const contextValue = {
    leads, loading, search, setSearch, isModalOpen, setIsModalOpen,
    isImportModalOpen, setIsImportModalOpen, editingLead, setEditingLead,
    selectedLead, setSelectedLead, isDetailsPanelOpen, setIsDetailsPanelOpen,
    sellerProfile, setSellerProfile, showProfileWizard, setShowProfileWizard,
    aiScoringLoading, outreachRegenerating, bookingLoading, researchLoading,
    calendarConnected, setCalendarConnected, calendarConnecting, setCalendarConnecting,
    gmailConnected, setGmailConnected, gmailConnecting, setGmailConnecting,
    emailingLead, setEmailingLead, bookingPromptLead, setBookingPromptLead,
    showHelpTooltip, setShowHelpTooltip, showDirectoryMenu, setShowDirectoryMenu,
    showHint, setShowHint, filterFollowUpsDueToday, setFilterFollowUpsDueToday,
    filterHotOnly, setFilterHotOnly, filterUnanalyzed, setFilterUnanalyzed,
    filterAnalyzed, setFilterAnalyzed, filterNew, setFilterNew,
    filterOverdue, setFilterOverdue, filterNeedsEnrichment, setFilterNeedsEnrichment,
    filterHighValue, setFilterHighValue,
    selectedLeads, setSelectedLeads, handleAddOrEditLead, handleDelete, handleBulkDelete,
    toggleSelectLead, toggleSelectAll, handleExportCsv, handleBookMeeting,
    handleStatusChange, handleSendEmailSuccess, handleScoreLead, handleRegenerateOutreach,
    handleUpdateFollowUp, handleAddNote, handleResearchCompany, saveBookingSuccess,
    handleMigrateLegacyData, openEditModal, openDetailsPanel, handleKanbanStatusChange,
    filteredLeads, visibleIds, allVisibleSelected, someSelected, statusColors, stats, winRate
  };

  const profileComplete = !!sellerProfile?.setupComplete || !!(sellerProfile?.companyName && sellerProfile?.primaryOffer);
  const recentActivities = leads.flatMap(lead => 
    (lead.activities || []).map(a => {
      const dateObj = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      return {
        id: a.id,
        title: a.action,
        subtitle: lead.fullName,
        date: dateObj
      };
    })
  ).sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  return (
    <Shell activeMenu="dashboard" onMenuChange={() => {}} profileComplete={profileComplete} hasModal={isImportModalOpen || isModalOpen || showProfileWizard} recentActivities={recentActivities}>
      <Outlet context={contextValue} />
      
      {/* Modals and Overlays (Imported from AppLayout) */}
            <AnimatePresence>
        {isModalOpen && (
          <LeadFormModal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditingLead(null); }}
            onSubmit={handleAddOrEditLead}
            initialData={editingLead || undefined}
          />
        )}
        {isImportModalOpen && (
           <CsvImportModal
             isOpen={isImportModalOpen}
             onClose={() => setIsImportModalOpen(false)}
             sellerProfile={sellerProfile}
           />
        )}
        {isDetailsPanelOpen && selectedLead && (
          <LeadDetailsPanel
             lead={leads.find(l => l.id === selectedLead.id) || selectedLead}
             isOpen={isDetailsPanelOpen}
             onClose={() => setIsDetailsPanelOpen(false)}
          />
        )}
        {showProfileWizard && (
          <CompanyProfileWizard
            isOpen={showProfileWizard}
            onComplete={(profile) => { setSellerProfile(profile); setShowProfileWizard(false); }}
            onSkip={async () => {
              localStorage.setItem('profileDismissed', 'true');
              setShowProfileWizard(false);
              if (auth.currentUser) {
                const docRef = doc(db, 'users', auth.currentUser.uid, 'profile', 'main');
                await setDoc(docRef, { setupComplete: false, profileDismissed: true }, { merge: true });
              }
            }}
            initialData={sellerProfile}
          />
        )}
        {emailingLead && (
          <EmailReviewModal
             isOpen={!!emailingLead}
             onClose={() => setEmailingLead(null)}
             lead={emailingLead}
             onSendSuccess={(edited, msgId, threadId) => {
               handleSendEmailSuccess(edited, msgId, threadId);
               setEmailingLead(null);
               toast.success('Email sent successfully');
             }}
          />
        )}
      </AnimatePresence>

      <TokenUpgradeModal 
        isOpen={!!tokenModalError} 
        onClose={() => setTokenModalError(null)} 
        errorDetails={tokenModalError || ''} 
      />

      <ConfirmModal
        isOpen={!!scoreConfirmLead}
        onClose={() => setScoreConfirmLead(null)}
        onConfirm={() => {
          if (scoreConfirmLead) {
            executeScoreLead(scoreConfirmLead);
            setScoreConfirmLead(null);
          }
        }}
        title="Re-analyze Account"
        message="This account has already been analyzed. Re-running will overwrite the existing score and strategy. Continue?"
        confirmText="Re-analyze"
        cancelText="Cancel"
      />
    </Shell>
  );
}
