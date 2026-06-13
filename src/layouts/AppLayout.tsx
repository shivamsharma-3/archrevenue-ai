import React, { useEffect, useState, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, arrayUnion } from 'firebase/firestore';
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


// ─── CSV Export Helper ────────────────────────────────────────────────────────
function exportLeadsToCSV(leads: Lead[]) {
  const headers = ['Full Name', 'Email', 'Phone', 'Company', 'Website', 'Industry', 'Status', 'AI Score', 'AI Category', 'Urgency', 'Estimated Budget', 'Lead Source', 'Created At'];
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

  // Multi-select for bulk operations
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const directoryMenuRef = useRef<HTMLDivElement>(null);

    // --- REAL HANDLERS ---
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'seller_profiles'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setSellerProfile({ id: snapshot.docs[0].id, ...(snapshot.docs[0].data() as any) } as SellerProfile);
      } else {
        setShowProfileWizard(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
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
  }, []);

  const handleAddOrEditLead = async (leadData: Partial<Lead>) => {
    try {
      if (editingLead && editingLead.id) {
        const leadRef = doc(db, 'leads', editingLead.id);
        await updateDoc(leadRef, { ...leadData, updatedAt: serverTimestamp() });
        showToast('Lead updated successfully', 'success');
      } else {
        await addDoc(collection(db, 'leads'), { ...leadData, createdAt: serverTimestamp(), status: 'new', activities: [] });
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

  const handleScoreLead = async (lead: Lead) => {
    if (!lead.id) return;
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
    new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    contacted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    qualified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    proposal: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
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
    selectedLeads, setSelectedLeads, handleAddOrEditLead, handleDelete, handleBulkDelete,
    toggleSelectLead, toggleSelectAll, handleExportCsv, handleBookMeeting,
    handleStatusChange, handleSendEmailSuccess, handleScoreLead, handleRegenerateOutreach,
    handleUpdateFollowUp, handleAddNote, handleResearchCompany, saveBookingSuccess,
    handleMigrateLegacyData, openEditModal, openDetailsPanel, handleKanbanStatusChange,
    filteredLeads, visibleIds, allVisibleSelected, someSelected, statusColors, stats, winRate
  };

  return (
    <Shell>
      <div className="relative z-20 h-screen overflow-y-auto overflow-x-hidden">
        {location.pathname !== '/settings' && (
          <div className="sticky top-0 z-40 p-4 pb-0 md:p-4 md:pb-0">
            <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 rounded-[24px] border border-white/[0.08] bg-[#0a0a0b]/60 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none rounded-[24px]" />
              
              <div className="flex items-center md:hidden relative z-10">
                 <div className="w-7 h-7 flex items-center justify-center mr-2">
                  <BrandLogo className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-white font-medium font-display text-lg">ArchRevenue</span>
              </div>
              <div className="hidden md:flex items-center space-x-4 relative z-10">
              <h1 className="text-[22px] font-semibold text-white tracking-tight">
                {location.pathname === '/dashboard' && 'Command Center'}
                {location.pathname === '/pipeline' && 'Pipeline'}
                {location.pathname === '/leads' && 'Leads'}
              </h1>
              <div className="flex items-center px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
                <span className="text-[11px] font-medium text-green-500">Live Sync</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 relative z-10">
              <div className="relative w-72 text-zinc-400">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search leads, companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 bg-[#121214] border border-white/[0.04] rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50 transition-all text-sm outline-none placeholder:text-zinc-600 text-zinc-200"
                />
              </div>
              <button onClick={() => exportLeadsToCSV(leads)} className="flex items-center justify-center py-2 px-4 rounded-xl text-sm font-medium text-white bg-white/[0.05] hover:bg-white/[0.1] transition-colors shadow-sm border border-white/[0.08] mr-1"><Download className="w-4 h-4 mr-1.5" />Export</button>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center justify-center py-2 px-4 rounded-xl text-sm font-medium text-white bg-white/[0.05] hover:bg-white/[0.1] transition-colors shadow-sm border border-white/[0.08] mr-3"
              >
                <Upload className="w-4 h-4 mr-1.5" />
                Import CSV
              </button>
              <button 
                onClick={() => { setEditingLead(null); setIsModalOpen(true); }}
                className="flex items-center justify-center py-2 px-4 rounded-xl text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Lead
              </button>
            </div>
            <div className="flex items-center space-x-2 md:hidden relative z-10">
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="p-1.5 text-white bg-white/[0.05] hover:bg-white/[0.1] rounded-lg transition-colors shadow-sm border border-white/[0.08]"
              >
                <Upload className="w-5 h-5" />
              </button>
              <button 
                onClick={() => { setEditingLead(null); setIsModalOpen(true); }}
                className="p-1.5 text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
               <button onClick={handleLogout} className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            </header>
          </div>
        )}
        <div className="p-4 md:p-8 pt-6">
          <Outlet context={contextValue} />
        </div>
      </div>
      
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
             lead={selectedLead}
             isOpen={isDetailsPanelOpen}
             onClose={() => setIsDetailsPanelOpen(false)}
          />
        )}
        {showProfileWizard && (
          <CompanyProfileWizard
            isOpen={showProfileWizard}
            onComplete={(profile) => { setSellerProfile(profile); setShowProfileWizard(false); }}
            onSkip={() => setShowProfileWizard(false)}
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
             }}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2 pointer-events-none">
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
             lead={selectedLead}
             isOpen={isDetailsPanelOpen}
             onClose={() => setIsDetailsPanelOpen(false)}
          />
        )}
        {showProfileWizard && (
          <CompanyProfileWizard
            isOpen={showProfileWizard}
            onComplete={(profile) => { setSellerProfile(profile); setShowProfileWizard(false); }}
            onSkip={() => setShowProfileWizard(false)}
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
             }}
          />
        )}
      </AnimatePresence>
      </div>

      <TokenUpgradeModal 
        isOpen={!!tokenModalError} 
        onClose={() => setTokenModalError(null)} 
        errorDetails={tokenModalError || ''} 
      />

    </Shell>
  );
}







