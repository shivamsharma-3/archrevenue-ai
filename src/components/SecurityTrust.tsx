import React, { useEffect } from 'react';
import { ShieldAlert, Server, Users, Key, TerminalSquare, AlertTriangle, Code } from 'lucide-react';
import Shell from './Shell';
import '../styles/landing.css';

export default function SecurityTrust() {
  useEffect(() => {
    document.title = "Security & Trust | ArchRevenue";
  }, []);

  return (
    <Shell hideSidebar={true}>
      <div className="landing-page min-h-screen bg-surface-background">
        <div className="max-w-[800px] mx-auto px-6 py-24 lg:py-40">
          
          <div className="mb-16 border-b border-border-default pb-12">
            <div className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-8 font-medium">Security Framework</div>
            <h1 className="text-4xl md:text-5xl font-display text-text-primary font-medium tracking-[-0.02em] mb-6">
              Security & Trust
            </h1>
            <p className="text-[18px] font-body text-text-secondary leading-[1.8] font-light max-w-[600px]">
              Enterprise-grade security architecture designed to protect your revenue pipeline.
            </p>
          </div>

          <div className="space-y-16">
            
            <section className="relative">
              <div className="flex items-center space-x-4 mb-6">
                <Users className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
                <h2 className="text-[22px] font-display font-medium text-text-primary">User Isolation (Tenant Architecture)</h2>
              </div>
              <div className="text-[15px] font-light text-text-secondary leading-[1.8] space-y-6">
                <p>We employ mathematically verified Firestore Security Rules to guarantee strict multi-tenant isolation. Your database requests are evaluated at the edge before they ever reach our servers.</p>
                
                <div className="bg-[#0a0a0a] border border-[#262626] rounded-none overflow-hidden my-6 font-mono text-[13px] text-white p-6">
                  <p className="text-[#a3a3a3] mb-3">// Edge-level read/write validation</p>
                  <p><span className="text-[#fb7185]">match</span> <span className="text-[#38bdf8]">/users/&#123;userId&#125;</span> &#123;</p>
                  <p className="ml-4"><span className="text-[#fb7185]">allow</span> read, write: <span className="text-[#fb7185]">if</span> request.auth != <span className="text-[#818cf8]">null</span> && request.auth.uid == userId;</p>
                  <p>&#125;</p>
                </div>

                <p>It is structurally impossible for another ArchRevenue user to query or access your leads, profile, or token usage data.</p>
              </div>
            </section>

            <section className="relative border-t border-border-default pt-16">
              <div className="flex items-center space-x-4 mb-6">
                <Server className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
                <h2 className="text-[22px] font-display font-medium text-text-primary">Cloud Infrastructure & Encryption</h2>
              </div>
              <div className="text-[15px] font-light text-text-secondary leading-[1.8] space-y-6">
                <p>ArchRevenue is built on Google Cloud Platform (GCP). All data is encrypted both in transit (via modern TLS 1.3) and at rest (using AES-256 encryption).</p>
                <p>We do not manage our own physical servers. By leveraging GCP's global infrastructure, we inherit their world-class physical security, compliance certifications (SOC 2, ISO 27001), and DDoS protection.</p>
              </div>
            </section>

            <section className="relative border-t border-border-default pt-16">
              <div className="flex items-center space-x-4 mb-6">
                <TerminalSquare className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
                <h2 className="text-[22px] font-display font-medium text-text-primary">AI Safety & Hallucination Mitigation</h2>
              </div>
              <div className="text-[15px] font-light text-text-secondary leading-[1.8] space-y-6">
                <p>LLMs are powerful but prone to hallucinations. To ensure the reliability of Lead Intelligence and Deal Coaching:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>We enforce strict JSON-schema adherence on all AI outputs using OpenAI's Structured Outputs.</li>
                  <li>We require the AI to provide evidence arrays explaining why a specific score or insight was generated based on the scraped context.</li>
                  <li>We utilize a "zero-training" Enterprise API agreement with OpenAI, ensuring your data is never retained for model improvement.</li>
                </ul>
              </div>
            </section>

            <section className="relative border-t border-border-default pt-16">
              <div className="flex items-center space-x-4 mb-6">
                <Key className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
                <h2 className="text-[22px] font-display font-medium text-text-primary">Authentication</h2>
              </div>
              <div className="text-[15px] font-light text-text-secondary leading-[1.8] space-y-6">
                <p>We utilize Google Workspace SSO (Single Sign-On) alongside Firebase Authentication. ArchRevenue never stores, hashes, or handles your passwords. Your login security inherits the 2FA and security policies you have configured on your Google account.</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </Shell>
  );
}
