import React, { useEffect } from 'react';
import { FileText, Scale, Activity, Zap, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import Shell from './Shell';
import '../styles/landing.css';

export default function TermsOfService() {
  useEffect(() => {
    document.title = "Terms of Service | ArchRevenue";
  }, []);

  return (
    <Shell hideSidebar={true}>
      <div className="landing-page min-h-screen bg-surface-background">
        <div className="max-w-[800px] mx-auto px-6 py-24 lg:py-40">
          
          <div className="mb-16 border-b border-border-default pb-12">
            <div className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-8 font-medium">Legal Framework</div>
            <h1 className="text-4xl md:text-5xl font-display text-text-primary font-medium tracking-[-0.02em] mb-6">
              Terms of Service
            </h1>
            <p className="text-[18px] font-body text-text-secondary leading-[1.8] font-light max-w-[600px]">
              Rules of engagement for using the ArchRevenue platform.
            </p>
          </div>

          <div className="space-y-16">
            
            <section className="relative">
              <div className="flex items-center space-x-4 mb-6">
                <Activity className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
                <h2 className="text-[22px] font-display font-medium text-text-primary">1. Early Access & Availability</h2>
              </div>
              <div className="text-[15px] font-light text-text-secondary leading-[1.8] space-y-6">
                <p>ArchRevenue is currently in an Early Access phase. By participating in this phase, you acknowledge that the platform is actively evolving and receiving rapid updates.</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Features may be modified, upgraded, or optimized based on user feedback.</li>
                  <li>While we strive for 99.9% uptime, occasional maintenance windows or service upgrades may occur to enhance the AI engine.</li>
                </ul>
              </div>
            </section>

            <section className="relative border-t border-border-default pt-16">
              <div className="flex items-center space-x-4 mb-6">
                <Cpu className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
                <h2 className="text-[22px] font-display font-medium text-text-primary">2. Subscription & API Tokens</h2>
              </div>
              <div className="text-[15px] font-light text-text-secondary leading-[1.8] space-y-6">
                <p>The core ArchRevenue CRM is provided on a subscription basis. Our advanced AI features (Lead Intelligence, Deal Coach, Outreach Generation) consume compute resources and are subject to hard API token limits based on your tier.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border border-border-default p-5 bg-surface-card rounded-lg">
                    <h3 className="text-[14px] font-semibold text-text-primary mb-1">Free Tier ($0/mo)</h3>
                    <p className="text-[13px] text-indigo-600 font-bold mb-2">50,000 Tokens / mo</p>
                    <p className="text-[12px] text-text-secondary">Standard AI Engine. Executive lead scoring & cold email drafts. No credit card required.</p>
                  </div>
                  <div className="border border-border-default p-5 bg-surface-card rounded-lg">
                    <h3 className="text-[14px] font-semibold text-text-primary mb-1">Starter ($49/mo)</h3>
                    <p className="text-[13px] text-indigo-600 font-bold mb-2">100,000 Tokens / mo</p>
                    <p className="text-[12px] text-text-secondary">Advanced AI Engine. Multi-channel outreach (Email, LinkedIn & Phone scripts).</p>
                  </div>
                  <div className="border border-border-default p-5 bg-surface-card rounded-lg">
                    <h3 className="text-[14px] font-semibold text-text-primary mb-1">Pro ($99/mo)</h3>
                    <p className="text-[13px] text-indigo-600 font-bold mb-2">250,000 Tokens / mo</p>
                    <p className="text-[12px] text-text-secondary">Advanced AI Engine. AI Deal Coach & Objections Engine, unlimited outreach regeneration.</p>
                  </div>
                  <div className="border border-border-default p-5 bg-surface-card rounded-lg">
                    <h3 className="text-[14px] font-semibold text-text-primary mb-1">Enterprise (Custom)</h3>
                    <p className="text-[13px] text-indigo-600 font-bold mb-2">Unlimited Tokens</p>
                    <p className="text-[12px] text-text-secondary">Dedicated AI pipeline, custom fine-tuning & ICP prompts, dedicated account manager.</p>
                  </div>
                </div>

                <div className="border border-border-default bg-surface-card p-6 flex items-start mt-4">
                  <CheckCircle2 className="w-4 h-4 mr-3 mt-1 shrink-0 text-text-primary" strokeWidth={1.5} />
                  <p className="text-text-primary font-medium">Tokens do not roll over month-to-month. If you exceed your token limit, AI features will be temporarily paused until the next billing cycle unless additional capacity is purchased.</p>
                </div>
              </div>
            </section>

            <section className="relative border-t border-border-default pt-16">
              <div className="flex items-center space-x-4 mb-6">
                <FileText className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
                <h2 className="text-[22px] font-display font-medium text-text-primary">3. Acceptable Use Policy</h2>
              </div>
              <div className="text-[15px] font-light text-text-secondary leading-[1.8] space-y-6">
                <p>You agree not to use ArchRevenue to:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Generate or distribute malicious, illegal, or highly regulated content.</li>
                  <li>Attempt to reverse engineer the AI scoring models or web-scraping infrastructure.</li>
                  <li>Send unsolicited, spam-compliant outreach that violates CAN-SPAM, GDPR, or similar regional regulations.</li>
                  <li>Attempt to bypass API token tracking mechanisms or spoof token usage.</li>
                </ul>
                <div className="border border-border-default bg-surface-card p-4 mt-4 inline-block">
                  <p className="text-[13px] font-medium text-text-primary uppercase tracking-widest">Violation of these terms may result in immediate account suspension.</p>
                </div>
              </div>
            </section>

            <section className="relative border-t border-border-default pt-16">
              <div className="flex items-center space-x-4 mb-6">
                <ShieldCheck className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
                <h2 className="text-[22px] font-display font-medium text-text-primary">4. Warranty & Liability</h2>
              </div>
              <div className="text-[15px] font-light text-text-secondary leading-[1.8] space-y-6">
                <p>ArchRevenue provides an AI-assisted intelligence layer. The platform does not guarantee any specific financial or revenue outcomes. You are solely responsible for reviewing any AI-generated communication before it is sent to a prospect.</p>
                <p>In no event shall ArchRevenue be liable for any indirect, incidental, or consequential damages arising out of your use or inability to use the platform.</p>
              </div>
            </section>

            <section className="relative border-t border-border-default pt-16">
              <div className="flex items-center space-x-4 mb-6">
                <FileText className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
                <h2 className="text-[22px] font-display font-medium text-text-primary">5. Account Termination & Deletion</h2>
              </div>
              <div className="text-[15px] font-light text-text-secondary leading-[1.8] space-y-6">
                <p>You may choose to delete your account at any time through the platform's settings. When you initiate an account deletion, we will permanently and irreversibly erase your user profile, authentication records, and all associated lead and CRM data from our primary databases.</p>
                <p>Please note that account deletion is immediate and cannot be undone. We reserve the right to suspend or terminate accounts that violate our Acceptable Use Policy.</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </Shell>
  );
}
