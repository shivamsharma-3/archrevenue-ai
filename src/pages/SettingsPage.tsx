import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building, Target, Users, Settings, Mail, Calendar, Sparkles, Check } from 'lucide-react';
import CompanyProfileWizard from '../components/CompanyProfileWizard';
import { connectGmail, connectCalendar } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  const { 
    sellerProfile, 
    setSellerProfile,
    gmailConnected, 
    setGmailConnected,
    calendarConnected, 
    setCalendarConnected
  } = useOutletContext<any>();

  const [showWizard, setShowWizard] = useState(false);
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [calendarConnecting, setCalendarConnecting] = useState(false);

  const handleConnectGmail = async () => {
    if (gmailConnected) return;
    setGmailConnecting(true);
    try {
      const result = await connectGmail();
      if (result && result.token) {
        localStorage.setItem('gmail_token', result.token);
        setGmailConnected(true);
      }
    } catch (e) {
      console.error(e);
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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCalendarConnecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Workspace Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Configure your company profile, AI preferences, and integrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Profile Section */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Building className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Company Profile</h2>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              Edit Profile
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Company Name</p>
              <p className="text-sm text-white">{sellerProfile?.companyName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Primary Offer</p>
              <p className="text-sm text-white line-clamp-2">{sellerProfile?.primaryOffer || 'Not set'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Website</p>
              <p className="text-sm text-white truncate">{sellerProfile?.website || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* ICP Configuration */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">ICP Configuration</h2>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Configure
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Target Industry</p>
              <p className="text-sm text-white">{sellerProfile?.targetIndustry || 'Any'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Company Size</p>
              <p className="text-sm text-white">{sellerProfile?.targetCompanySize || 'Any'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Target Geography</p>
              <p className="text-sm text-white">{sellerProfile?.targetGeography || 'Any'}</p>
            </div>
          </div>
        </div>

        {/* AI & Outreach Preferences */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">AI & Outreach Preferences</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">Control how the AI generates your emails and scores leads.</p>
              </div>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Update Preferences
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Tone</p>
              <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.05] text-xs text-zinc-300">
                {sellerProfile?.tone || 'Professional'}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Style</p>
              <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.05] text-xs text-zinc-300">
                {sellerProfile?.outreachStyle || 'Cold Email'}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Call to Action (CTA)</p>
              <p className="text-sm text-white line-clamp-2">{sellerProfile?.ctaStyle || 'Default CTA'}</p>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 md:col-span-2">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Integrations</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Connect external tools to automate your workflow.</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Gmail */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-black/20 border border-white/[0.05] rounded-xl">
              <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Gmail Settings</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Send AI-generated outreach directly from your inbox.</p>
                </div>
              </div>
              <button
                onClick={handleConnectGmail}
                disabled={gmailConnected || gmailConnecting}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 w-full sm:w-auto justify-center",
                  gmailConnected 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-white text-black hover:bg-zinc-200"
                )}
              >
                {gmailConnecting ? (
                  <span className="w-4 h-4 border-2 border-zinc-500 border-t-black rounded-full animate-spin" />
                ) : gmailConnected ? (
                  <><Check className="w-4 h-4" /><span>Connected</span></>
                ) : (
                  <span>Connect Gmail</span>
                )}
              </button>
            </div>

            {/* Calendar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-black/20 border border-white/[0.05] rounded-xl">
              <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Calendar Settings</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Automatically book meetings via AI links.</p>
                </div>
              </div>
              <button
                onClick={handleConnectCalendar}
                disabled={calendarConnected || calendarConnecting}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 w-full sm:w-auto justify-center",
                  calendarConnected 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-white text-black hover:bg-zinc-200"
                )}
              >
                {calendarConnecting ? (
                  <span className="w-4 h-4 border-2 border-zinc-500 border-t-black rounded-full animate-spin" />
                ) : calendarConnected ? (
                  <><Check className="w-4 h-4" /><span>Connected</span></>
                ) : (
                  <span>Connect Calendar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showWizard && (
        <CompanyProfileWizard
          isOpen={showWizard}
          initialData={sellerProfile}
          onComplete={(profile) => {
            if (setSellerProfile) setSellerProfile(profile);
            setShowWizard(false);
          }}
          onSkip={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
