import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Page, PageHeader, PageContent } from '../components/layout/PageLayout';
import { Target, Activity, DollarSign, Mail, Users, Sparkles } from 'lucide-react';
import { Lead } from '../lib/types';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';

export default function AdminBetaPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if admin before attempting to load
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchAdminMetrics = async () => {
      try {
        // Query users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;

        // Query leads
        // Note: For a real production app with millions of leads, you'd use Firestore aggregations.
        // For early beta, client-side filtering is perfectly fine.
        const leadsSnapshot = await getDocs(collection(db, 'leads'));
        const leads = leadsSnapshot.docs.map(d => d.data() as Lead);

        const totalLeads = leads.length;
        const totalAiScores = leads.filter(l => l.aiAnalysis).length;
        const totalResearches = leads.filter(l => l.research).length;
        const totalOutreach = leads.reduce((acc, l) => acc + (l.activities?.filter(a => a.action.includes('Email') || a.action.includes('Outreach')).length || 0), 0);
        const onboardedUsers = new Set(leads.map(l => l.userId)).size; // Unique users who created a lead

        setMetrics({
          totalUsers,
          onboardedUsers,
          totalLeads,
          totalAiScores,
          totalResearches,
          totalOutreach
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch admin metrics. Make sure you are logged in as the admin.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminMetrics();
  }, [isAdmin, adminLoading]);

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Page>
      <PageHeader 
        title="Beta Program Analytics" 
        description="Monitor user engagement and feedback from the beta testing phase."
      />
      <PageContent>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/[0.08] border border-red-500/20 rounded-2xl p-6 text-red-400 text-sm">
            {error}
          </div>
        ) : metrics && (
          <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Users */}
              <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-6 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-[40px] pointer-events-none" />
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                  <div className="p-2 bg-teal-50 rounded-[var(--radius-button)] border border-teal-100"><Users className="w-5 h-5 text-teal-600" /></div>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.18em]">Total Signups</span>
                </div>
                <div className="text-4xl font-bold text-text-primary mb-2 relative z-10" style={{ fontFamily: 'var(--font-mono)' }}>{metrics.totalUsers}</div>
                <p className="text-xs font-medium text-teal-600 relative z-10">{metrics.onboardedUsers} users completed onboarding</p>
              </div>

              {/* Leads Created */}
              <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-6 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                  <div className="p-2 bg-blue-50 rounded-[var(--radius-button)] border border-blue-100"><Target className="w-5 h-5 text-blue-600" /></div>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.18em]">Leads Created</span>
                </div>
                <div className="text-4xl font-bold text-text-primary mb-2 relative z-10" style={{ fontFamily: 'var(--font-mono)' }}>{metrics.totalLeads}</div>
                <p className="text-xs font-medium text-text-secondary relative z-10">Across all tenant accounts</p>
              </div>

              {/* AI Scores */}
              <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-6 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none" />
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                  <div className="p-2 bg-amber-50 rounded-[var(--radius-button)] border border-amber-100"><Sparkles className="w-5 h-5 text-amber-600" /></div>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.18em]">AI Scores Run</span>
                </div>
                <div className="text-4xl font-bold text-text-primary mb-2 relative z-10" style={{ fontFamily: 'var(--font-mono)' }}>{metrics.totalAiScores}</div>
                <p className="text-xs font-medium text-text-secondary relative z-10">{metrics.totalResearches} deep researches performed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Outreach Performance */}
              <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-6 relative shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-[40px] pointer-events-none" />
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                  <div className="p-2 bg-violet-50 rounded-[var(--radius-button)] border border-violet-100"><Mail className="w-5 h-5 text-violet-600" /></div>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.18em]">Outreach Drafted</span>
                </div>
                <div className="text-4xl font-bold text-text-primary mb-2 relative z-10" style={{ fontFamily: 'var(--font-mono)' }}>{metrics.totalOutreach}</div>
                <p className="text-xs font-medium text-text-secondary relative z-10">Total personalized emails generated</p>
              </div>
            </div>

          </div>
        )}
      </PageContent>
    </Page>
  );
}
