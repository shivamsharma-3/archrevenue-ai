/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { auth, handleRedirectResult, db } from './lib/firebase';
import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';
import { Analytics } from "@vercel/analytics/react";
import LandingPage from './pages/LandingPage';
import Login from './components/Login';
import AppLayout from './layouts/AppLayout';
import WorkspacePage from './pages/WorkspacePage';
import InsightsPage from './pages/InsightsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import BillingPage from './pages/BillingPage';
import HelpCenterPage from './pages/HelpCenterPage';
import ArticlePage from './pages/ArticlePage';
import ArticleListPage from './pages/ArticleListPage';
import SystemStatusPage from './pages/SystemStatusPage';
import ApiDocsPage from './pages/ApiDocsPage';
import CommunityForumPage from './pages/CommunityForumPage';
import AdminBetaPage from './pages/AdminBetaPage';
import DesignSystemPage from './pages/DesignSystemPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import SecurityTrust from './components/SecurityTrust';
import LeadIntelligencePage from './components/LeadIntelligencePage';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result from Google Sign-In (popup fallback flow)
    handleRedirectResult().catch((err) => {
      console.warn('Redirect sign-in result error:', err?.message);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // Self-heal: ensure user document exists in Firestore (since admin dash relies on it)
        getDoc(doc(db, 'users', user.uid)).then((snap) => {
          if (!snap.exists()) {
            setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              role: 'free'
            }).catch(console.error);
          }
        }).catch(console.error);

        Sentry.setUser({ id: user.uid, email: user.email || undefined });
        
        // Only capture login event if this is a fresh login, not just page reload
        // A simple way is to check if we just transitioned from no user to user
        const isFirstLoad = !posthog.get_distinct_id();
        posthog.identify(user.uid, { email: user.email });
        if (isFirstLoad) {
          posthog.capture('User Logged In', { provider: user.providerData?.[0]?.providerId });
        }
      } else {
        Sentry.setUser(null);
        posthog.reset();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Login initialIsRegistering={true} />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />

        {/* Protected layout routes */}
        <Route element={user ? <AppLayout /> : <Navigate to="/" />}>
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/dashboard" element={<WorkspacePage />} />
          <Route path="/leads" element={<WorkspacePage />} />
          <Route path="/pipeline" element={<WorkspacePage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/help/articles" element={<ArticleListPage />} />
          <Route path="/help/article/:id" element={<ArticlePage />} />
          <Route path="/help/status" element={<SystemStatusPage />} />
          <Route path="/help/api" element={<ApiDocsPage />} />
          <Route path="/help/community" element={<CommunityForumPage />} />
          <Route path="/admin/beta" element={<AdminBetaPage />} />
        </Route>

        <Route path="/lead/:id" element={user ? <LeadIntelligencePage /> : <Navigate to="/" />} />

        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/security" element={<SecurityTrust />} />
        
        {/* Internal Design System Playground */}
        {import.meta.env.DEV && <Route path="/design-system" element={<DesignSystemPage />} />}

      </Routes>
      <Toaster 
        position="bottom-right" 
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{ 
          className: '!bg-surface-card/90 !backdrop-blur-xl !border !border-border-default/60 !shadow-[0_8px_30px_rgb(0,0,0,0.08)] !text-text-primary !rounded-2xl !font-sans !px-5 !py-4',
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
            className: '!bg-emerald-50/90 !border-emerald-100/60 !text-emerald-900',
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
            className: '!bg-rose-50/90 !border-rose-100/60 !text-rose-900',
          },
          duration: 4000,
        }} 
      />
      <Analytics />
    </BrowserRouter>
  );
}
