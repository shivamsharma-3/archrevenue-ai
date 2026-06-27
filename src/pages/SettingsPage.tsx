import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building, Target, Mail, Calendar, Sparkles, Check, Loader2, Bell, Shield, Trash2, Download, Globe, ChevronRight, Zap, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { connectGmail, connectCalendar } from '../lib/firebase';
import { auth, db } from '../lib/firebase';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { deleteDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import CompanyProfileWizard from '../components/CompanyProfileWizard';
import { Page, PageHeader, PageContent, PageSection } from '../components/layout/PageLayout';
import { AppButton } from '../components/ui/AppButton';
import { AppModal } from '../components/ui/AppModal';

// ─── MAIN SETTINGS PAGE ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const { 
    sellerProfile, 
    setSellerProfile,
    gmailConnected, 
    setGmailConnected,
    calendarConnected, 
    setCalendarConnected,
    leads,
  } = useOutletContext<any>();

  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [calendarConnecting, setCalendarConnecting] = useState(false);
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: 'leads' | 'account' | null }>({ isOpen: false, type: null });
  const [confirmText, setConfirmText] = useState('');

  // Notification prefs (local only for now)
  const [notifEmailDigest, setNotifEmailDigest] = useState(() => localStorage.getItem('notif_email_digest') !== 'false');
  const [notifFollowUp, setNotifFollowUp] = useState(() => localStorage.getItem('notif_follow_up') !== 'false');
  const [notifAiInsights, setNotifAiInsights] = useState(() => localStorage.getItem('notif_ai_insights') !== 'false');

  const toggleNotif = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    localStorage.setItem(key, String(val));
    toast.success(`Preference ${val ? 'enabled' : 'disabled'}`);
  };

  const handleConnectGmail = async () => {
    if (gmailConnected) return;
    setGmailConnecting(true);
    try {
      const result = await connectGmail();
      if (result && result.token) {
        localStorage.setItem('gmail_token', result.token);
        setGmailConnected(true);
        toast.success('Gmail connected!');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to connect Gmail');
    } finally {
      setGmailConnecting(false);
    }
  };

  const handleConnectCalendar = async () => {
    if (calendarConnected) return;
    setCalendarConnecting(true);
    try {
      const token = await connectCalendar();
      if (token) {
        localStorage.setItem('gcal_token', token);
        setCalendarConnected(true);
        toast.success('Google Calendar connected!');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to connect Calendar');
    } finally {
      setCalendarConnecting(false);
    }
  };

  const handleExportData = () => {
    if (!leads || leads.length === 0) {
      toast.error('No lead data to export');
      return;
    }
    const headers = ['Full Name', 'Email', 'Phone', 'Company', 'Website', 'Status', 'AI Score', 'Created At'];
    const rows = leads.map((l: any) => [
      l.fullName || '', l.email || '', l.phone || '', l.company || '',
      l.website || '', l.status || '', l.aiAnalysis?.score ?? '', 
      l.createdAt?.toDate ? l.createdAt.toDate().toLocaleDateString() : ''
    ]);
    const csv = [headers, ...rows].map((r: string[]) => r.map((v: string) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `archrevenue-data-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const promptDeleteAllLeads = () => {
    if (!leads?.length) return;
    setConfirmText('');
    setConfirmModal({ isOpen: true, type: 'leads' });
  };

  const executeDeleteAllLeads = async () => {
    if (!auth.currentUser) return;
    setDeletingData(true);
    try {
      const q = query(collection(db, 'leads'), where('userId', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      toast.success('All leads deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete leads');
    } finally {
      setDeletingData(false);
      setConfirmModal({ isOpen: false, type: null });
    }
  };

  const promptDeleteAccount = () => {
    setConfirmText('');
    setConfirmModal({ isOpen: true, type: 'account' });
  };

  const executeDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setDeletingData(true);
    try {
      // 1. Delete all leads
      const q = query(collection(db, 'leads'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      
      // 2. Delete user profile document
      await deleteDoc(doc(db, 'users', user.uid, 'profile', 'main'));
      
      // 3. Delete main user document
      await deleteDoc(doc(db, 'users', user.uid));
      
      // 4. Delete Firebase Auth user
      await deleteUser(user);
      
      toast.success('Account completely deleted');
      // Force redirect to login page immediately
      window.location.href = '/';
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        toast.error('For security reasons, please log out and log back in before deleting your account.');
      } else {
        toast.error(e.message || 'Failed to delete account');
      }
    } finally {
      setDeletingData(false);
      setConfirmModal({ isOpen: false, type: null });
    }
  };

  const profileIsComplete = !!sellerProfile?.setupComplete || !!(sellerProfile?.companyName && sellerProfile?.primaryOffer);

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex h-6 w-12 shrink-0 items-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70',
        enabled 
          ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-transparent' 
          : 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-slate-200/60 hover:bg-slate-200/80'
      )}
    >
      {!enabled && <div className="absolute inset-x-2 h-0.5 bg-slate-200 rounded-full top-1/2 -translate-y-1/2" />}
      <span className={cn(
        'pointer-events-none relative flex items-center justify-center h-5 w-5 transform rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]', 
        enabled 
          ? 'translate-x-[26px] shadow-[0_0_10px_rgba(255,255,255,0.9),inset_0_0_4px_rgba(0,0,0,0.1)]' 
          : 'translate-x-[2px] shadow-sm border border-slate-200/50'
      )}>
        <span className={cn(
          "w-1.5 h-1.5 rounded-full transition-all duration-300",
          enabled ? "bg-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.8)]" : "bg-slate-300"
        )} />
      </span>
    </button>
  );

  return (
    <>
      <Page>
        <PageHeader 
          title="Settings" 
          description="Manage your workspace, integrations, and preferences." 
        />
        
        <PageContent className="flex flex-col gap-10 max-w-[800px] pt-6">
          {/* AI & Company Setup */}
          <PageSection title="AI & Company Setup" description="Configure your company details and AI preferences.">
            <div
              onClick={() => setShowProfileWizard(true)}
              className={cn(
                'intel-panel group cursor-pointer rounded-[var(--radius-card)] border p-6 transition-all duration-200 overflow-hidden h-full relative',
                profileIsComplete
                  ? 'bg-surface-card border-border-default hover:border-blue-300 shadow-sm'
                  : 'bg-gradient-to-br from-amber-50 to-surface-card border-amber-200 hover:border-amber-300 shadow-sm'
              )}
            >
              {/* Top accent */}
              <div className={cn('absolute top-0 left-0 right-0 h-[2px]', profileIsComplete ? 'bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent' : 'bg-gradient-to-r from-transparent via-amber-400 to-transparent')} />

              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className={cn('p-3 rounded-[var(--radius-card)] border shrink-0', profileIsComplete ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-200')}>
                    <Building className={cn('w-5 h-5', profileIsComplete ? 'text-indigo-500' : 'text-amber-500')} />
                  </div>
                  <div className={cn('flex items-center gap-1 text-[13px] font-semibold transition-colors shrink-0 mt-0.5', profileIsComplete ? 'text-indigo-600 group-hover:text-indigo-700' : 'text-amber-600 group-hover:text-amber-700')}>
                    {profileIsComplete ? 'Edit' : 'Set Up Now'}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-semibold text-text-primary">Company Profile</h3>
                    {profileIsComplete ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" /> Configured
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                        Action Needed
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-text-secondary leading-relaxed">
                    Company details, offer, ICP, and AI outreach preferences. Used by AI in every score, outreach, and analysis.
                  </p>
                  {profileIsComplete && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[11px] text-text-secondary">
                      {sellerProfile?.companyName && <span className="font-semibold text-text-primary">{sellerProfile.companyName}</span>}
                      {sellerProfile?.industry && <span>· {sellerProfile.industry}</span>}
                      {sellerProfile?.tone && <span>· {sellerProfile.tone} tone</span>}
                      {sellerProfile?.targetIndustry && <span>· ICP: {sellerProfile.targetIndustry}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </PageSection>

          {/* Integrations */}
          <PageSection title="Integrations" description="Connect your email and calendar to automate tasks.">
            <div className="intel-panel bg-surface-card border border-border-default rounded-[var(--radius-card)] overflow-hidden shadow-sm">
              <div className="divide-y divide-border-default">
                <IntegrationRow
                  icon={<Mail className="w-5 h-5 text-red-500" />}
                  iconBg="bg-red-50 border-red-100"
                  name="Gmail"
                  description="Send AI-generated outreach directly from your inbox."
                  connected={gmailConnected}
                  connecting={gmailConnecting}
                  onConnect={handleConnectGmail}
                />
                <IntegrationRow
                  icon={<Calendar className="w-5 h-5 text-blue-500" />}
                  iconBg="bg-blue-50 border-blue-100"
                  name="Google Calendar"
                  description="Automatically book meetings via AI scheduling links."
                  connected={calendarConnected}
                  connecting={calendarConnecting}
                  onConnect={handleConnectCalendar}
                />
              </div>
            </div>
          </PageSection>

        {/* ── Section: Notifications ───────────────────────── */}
        <PageSection title="Notifications" description="Manage your email and in-app notification preferences.">
          <div className="intel-panel bg-surface-card border border-border-default rounded-[var(--radius-card)] overflow-hidden shadow-sm">
            <div className="divide-y divide-border-default">
              <NotifRow
                title="Daily Email Digest"
                description="Receive a morning briefing of your pipeline health and top leads."
                enabled={notifEmailDigest}
                onChange={(v) => toggleNotif('notif_email_digest', v, setNotifEmailDigest)}
                Toggle={Toggle}
              />
              <NotifRow
                title="Follow-Up Reminders"
                description="Get notified when a scheduled follow-up is overdue or due today."
                enabled={notifFollowUp}
                onChange={(v) => toggleNotif('notif_follow_up', v, setNotifFollowUp)}
                Toggle={Toggle}
              />
              <NotifRow
                title="AI Insights Alerts"
                description="Get notified when AI detects a high-opportunity lead or buying signal."
                enabled={notifAiInsights}
                onChange={(v) => toggleNotif('notif_ai_insights', v, setNotifAiInsights)}
                Toggle={Toggle}
              />
            </div>
          </div>
        </PageSection>

        {/* ── Section: Data & Privacy ──────────────────────── */}
        <PageSection title="Data & Privacy" description="Export your data or review our privacy policies.">
          <div className="intel-panel bg-surface-card border border-border-default rounded-[var(--radius-card)] overflow-hidden shadow-sm">
            <div className="divide-y divide-border-default">
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-[13px] font-semibold text-text-primary">Export All Lead Data</p>
                  <p className="text-[12px] text-text-secondary mt-0.5">Download all your leads as a CSV file for backup or migration.</p>
                </div>
                <AppButton
                  onClick={handleExportData}
                  variant="secondary"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Export CSV
                </AppButton>
              </div>
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-[13px] font-semibold text-text-primary">Data Retention</p>
                  <p className="text-[12px] text-text-secondary mt-0.5">Your data is stored securely and never sold to third parties.</p>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  GDPR Compliant
                </span>
              </div>
            </div>
          </div>
        </PageSection>

        {/* ── Section: Danger Zone ─────────────────────────── */}
        <PageSection title="Danger Zone" description="Irreversible actions for your workspace." className="text-rose-500">
          <div className="bg-rose-50/50 border border-rose-200 rounded-[var(--radius-card)] overflow-hidden shadow-sm">
            <div className="divide-y divide-rose-100">
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-[13px] font-semibold text-rose-900">Delete All Leads</p>
                  <p className="text-[12px] text-rose-600/80 mt-0.5">Permanently delete all {leads?.length || 0} leads from your workspace. This cannot be undone.</p>
                </div>
                <AppButton
                  variant="danger"
                  onClick={promptDeleteAllLeads}
                  disabled={deletingData || !leads?.length}
                  isLoading={deletingData && confirmModal.type === 'leads'}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Delete All Leads
                </AppButton>
              </div>
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-[13px] font-semibold text-rose-900">Delete Account</p>
                  <p className="text-[12px] text-rose-600/80 mt-0.5">Permanently delete your entire account, profile, and all associated data.</p>
                </div>
                <AppButton
                  variant="danger"
                  onClick={promptDeleteAccount}
                  disabled={deletingData}
                  isLoading={deletingData && confirmModal.type === 'account'}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Delete Account
                </AppButton>
              </div>
            </div>
          </div>
        </PageSection>
        </PageContent>
      </Page>

      {/* Company Profile Wizard */}
      {showProfileWizard && (
        <CompanyProfileWizard
          isOpen={showProfileWizard}
          onComplete={(profile: any) => { setSellerProfile(profile); setShowProfileWizard(false); }}
          onSkip={() => setShowProfileWizard(false)}
          initialData={sellerProfile}
        />
      )}

      {/* Danger Zone Confirmation Modal */}
      <AppModal 
        isOpen={confirmModal.isOpen} 
        onClose={() => !deletingData && setConfirmModal({ isOpen: false, type: null })}
        maxWidth="sm"
      >
        <div className="flex flex-col items-center text-center pt-4 pb-2">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4 border border-rose-200">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            {confirmModal.type === 'leads' ? 'Delete All Leads?' : 'Delete Account?'}
          </h3>
          <p className="text-sm text-text-secondary mb-8 leading-relaxed">
            {confirmModal.type === 'leads' 
              ? `Are you sure you want to delete ALL ${leads?.length || 0} leads from your workspace? This action cannot be undone and will permanently remove all associated intelligence data.`
              : 'Are you absolutely sure you want to delete your entire account? This will permanently delete your user profile, all leads, and remove your login access. This action CANNOT be undone.'}
          </p>

          {confirmModal.type === 'account' && (
            <div className="w-full mb-8 text-left">
              <label className="block text-[13px] font-medium text-text-primary mb-2">
                Type <span className="font-bold text-rose-600 select-all">DELETE</span> to confirm
              </label>
              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-surface-background border border-border-default rounded-[var(--radius-card)] px-4 py-2.5 text-[14px] text-text-primary outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-text-tertiary"
              />
            </div>
          )}

          <div className="flex items-center gap-3 w-full">
            <AppButton 
              className="flex-1"
              variant="secondary"
              onClick={() => setConfirmModal({ isOpen: false, type: null })}
              disabled={deletingData}
            >
              Cancel
            </AppButton>
            <AppButton 
              className="flex-1"
              variant="danger"
              onClick={confirmModal.type === 'leads' ? executeDeleteAllLeads : executeDeleteAccount}
              isLoading={deletingData}
              disabled={confirmModal.type === 'account' && confirmText !== 'DELETE'}
            >
              {confirmModal.type === 'leads' ? 'Delete All Leads' : 'Delete Account'}
            </AppButton>
          </div>
        </div>
      </AppModal>
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ icon, title, danger }: { icon: React.ReactNode; title: string; danger?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 mb-3 px-1', danger ? 'text-red-500' : 'text-text-secondary')}>
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{title}</span>
    </div>
  );
}

function IntegrationRow({ icon, iconBg, name, description, connected, connecting, onConnect }: {
  icon: React.ReactNode; iconBg: string; name: string; description: string;
  connected: boolean; connecting: boolean; onConnect: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-5 hover:bg-surface-hover transition-colors gap-4">
      <div className="flex items-center gap-4">
        <div className={cn('w-10 h-10 rounded-[var(--radius-card)] flex items-center justify-center border', iconBg)}>
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-text-primary">{name}</p>
          <p className="text-[12px] text-text-secondary mt-0.5">{description}</p>
        </div>
      </div>
      <AppButton
        onClick={onConnect}
        disabled={connected || connecting}
        isLoading={connecting}
        variant={connected ? 'ghost' : 'secondary'}
        className={cn(
          connected && 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 opacity-100 disabled:opacity-100'
        )}
        leftIcon={connected && !connecting ? <Check className="w-4 h-4" /> : undefined}
      >
        {connected ? 'Connected' : 'Connect'}
      </AppButton>
    </div>
  );
}

function NotifRow({ title, description, enabled, onChange, Toggle }: {
  title: string; description: string; enabled: boolean;
  onChange: (v: boolean) => void;
  Toggle: React.ComponentType<{ enabled: boolean; onChange: (v: boolean) => void }>;
}) {
  return (
    <div className="flex items-center justify-between p-5 hover:bg-surface-hover transition-colors gap-4">
      <div>
        <p className="text-[13px] font-semibold text-text-primary">{title}</p>
        <p className="text-[12px] text-text-secondary mt-0.5">{description}</p>
      </div>
      <div className="shrink-0">
        <Toggle enabled={enabled} onChange={onChange} />
      </div>
    </div>
  );
}
