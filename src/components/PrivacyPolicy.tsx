import React, { useEffect } from 'react';
import { Shield, Lock, Eye, Database, Globe, Calendar, Mail } from 'lucide-react';
import Shell from './Shell';
import '../styles/landing.css';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | ArchRevenue";
  }, []);

  return (
    <Shell hideSidebar={true}>
      <div className="landing-page min-h-screen bg-surface-background">
        <div className="max-w-[800px] mx-auto px-6 py-24 lg:py-40">
          
          <div className="mb-16 border-b border-border-default pb-12">
            <div className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-8 font-medium">Legal Framework</div>
            <h1 className="text-4xl md:text-5xl font-display text-text-primary font-medium tracking-[-0.02em] mb-6">
              Privacy Policy
            </h1>
            <p className="text-[18px] font-body text-text-secondary leading-[1.8] font-light max-w-[600px]">
              How we handle, protect, and process your revenue data securely.
            </p>
          </div>

          <div className="space-y-16">
            
            <section className="relative">
              <div className="flex items-center space-x-4 mb-6">
                <Lock className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
                <h2 className="text-[22px] font-display font-medium text-text-primary">Data Ownership</h2>
              </div>
              <div className="text-[15px] font-light text-text-secondary leading-[1.8] space-y-6">
                <p>When you use ArchRevenue, you retain complete ownership of all data you input into the platform. This includes your CRM records, lead data, seller profile, and generated outreach materials.</p>
                <div className="border border-border-default bg-surface-card p-6">
                  <p className="text-text-primary font-medium">We will never sell your data to third parties, and your proprietary lead data is strictly isolated and never shared across different customer workspaces.</p>
                </div>
              </div>
            </section>

            <section className="relative border-t border-border-default pt-16">
              <div className="flex items-center space-x-4 mb-6">
                <Database className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
                <h2 className="text-[22px] font-display font-medium text-text-primary">Information We Collect</h2>
              </div>
              <div className="text-[15px] font-light text-text-secondary leading-[1.8] space-y-8">
                <p>To provide our services, we collect and process the following information:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="border border-border-default p-6 bg-surface-card">
                    <h3 className="text-[15px] font-medium text-text-primary mb-3 flex items-center gap-3"><Shield className="w-4 h-4 text-text-secondary" /> Account Data</h3>
                    <p className="text-[14px]">Name, email address, and authentication tokens provided via Google Auth securely encrypted.</p>
                  </div>
                  <div className="border border-border-default p-6 bg-surface-card">
                    <h3 className="text-[15px] font-medium text-text-primary mb-3 flex items-center gap-3"><Database className="w-4 h-4 text-text-secondary" /> CRM Data</h3>
                    <p className="text-[14px]">Lead information, company names, contact details, and custom notes you enter or import.</p>
                  </div>
                  <div className="border border-border-default p-6 bg-surface-card">
                    <h3 className="text-[15px] font-medium text-text-primary mb-3 flex items-center gap-3"><Mail className="w-4 h-4 text-text-secondary" /> Gmail Integration</h3>
                    <p className="text-[14px]">We only request permission to send emails on your behalf. We do not read your inbox.</p>
                  </div>
                  <div className="border border-border-default p-6 bg-surface-card">
                    <h3 className="text-[15px] font-medium text-text-primary mb-3 flex items-center gap-3"><Calendar className="w-4 h-4 text-text-secondary" /> Calendar Sync</h3>
                    <p className="text-[14px]">We access your calendar solely to sync meeting events and schedule availability.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="relative border-t border-border-default pt-16">
              <div className="flex items-center space-x-4 mb-6">
                <Globe className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
                <h2 className="text-[22px] font-display font-medium text-text-primary">AI Processing Boundaries</h2>
              </div>
              <div className="text-[15px] font-light text-text-secondary leading-[1.8] space-y-6">
                <p>ArchRevenue utilizes advanced Large Language Models via our partnership with OpenAI to provide real-time lead intelligence, scoring, and Revenue Strategy insights.</p>
                <div className="border-l-2 border-text-primary pl-6 py-2">
                  <h4 className="text-[15px] font-medium text-text-primary mb-2 flex items-center gap-2"><Lock className="w-4 h-4" strokeWidth={1.5} /> Zero-Training Policy</h4>
                  <p className="text-[14px]">The data sent to our AI providers via Enterprise APIs is used strictly for immediate inference. Your proprietary data is explicitly opted out and is never used to train any global or public AI models.</p>
                </div>
              </div>
            </section>

            <section className="relative border-t border-border-default pt-16">
              <div className="flex items-center space-x-4 mb-6">
                <Eye className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
                <h2 className="text-[22px] font-display font-medium text-text-primary">Data Retention & Deletion</h2>
              </div>
              <div className="text-[15px] font-light text-text-secondary leading-[1.8] space-y-4">
                <p>We retain your data only for as long as your account remains active. You have the right to access, export, or permanently delete your pipeline data at any time through the Settings page.</p>
                <p>You may also completely delete your account at any time. If you choose to delete your account, your profile, authentication records, and all associated lead data will be permanently purged from our primary databases immediately and cannot be recovered.</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </Shell>
  );
}
