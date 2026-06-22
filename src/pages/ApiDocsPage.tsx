import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Code2, Terminal, Shield, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { Page, PageHeader, PageContent } from '../components/layout/PageLayout';
import { motion } from 'framer-motion';

const SidebarLink = ({ id, label, activeSection }: { id: string, label: string, activeSection: string }) => {
  const isActive = activeSection === id;
  return (
    <a 
      href={`#${id}`} 
      className={cn(
        "relative block px-3 py-2 text-[13px] rounded-[var(--radius-button)] transition-colors",
        isActive ? "font-semibold text-indigo-600" : "font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="api-sidebar-active"
          className="absolute inset-0 bg-indigo-50 rounded-[var(--radius-button)]"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </a>
  );
};

export default function ApiDocsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = React.useState('introduction');

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-152px 0px -60% 0px' }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ zoom: 0.95 }}>
    <Page>
      <PageHeader 
        title="API Documentation" 
        description="Build custom integrations and automate your pipeline with the ArchRevenue REST API."
        breadcrumbs={
          <button
            onClick={() => navigate('/help')}
            className="flex items-center gap-2 text-[13px] font-medium text-text-tertiary hover:text-indigo-600 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Help
          </button>
        }
      />
      <PageContent className="flex flex-col md:flex-row gap-8 items-start pt-6 relative">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 self-start lg:sticky lg:top-[152px] max-h-[calc(100vh-152px-2rem)] overflow-y-auto space-y-8 pb-10 custom-scrollbar">

          <div className="space-y-1">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary mb-3 px-3">Getting Started</h4>
            <SidebarLink id="introduction" label="Introduction" activeSection={activeSection} />
            <SidebarLink id="authentication" label="Authentication" activeSection={activeSection} />
            <SidebarLink id="rate-limits" label="Rate Limits" activeSection={activeSection} />
          </div>

          <div className="space-y-1">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary mb-3 px-3">Endpoints</h4>
            <SidebarLink id="leads-api" label="Leads API" activeSection={activeSection} />
            <SidebarLink id="ai-scoring" label="AI Scoring" activeSection={activeSection} />
            <SidebarLink id="webhooks" label="Webhooks" activeSection={activeSection} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-surface-card border border-border-default rounded-[var(--radius-card)] p-8 md:p-12 shadow-sm min-w-0">
          
          <section id="introduction" className="mb-16 scroll-mt-48">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-card)] bg-indigo-600 text-white mb-6 shadow-md">
              <Code2 className="w-6 h-6" />
            </div>
            <h1 className="text-[32px] font-bold text-text-primary tracking-tight font-display mb-4">
              API Documentation
            </h1>
            <p className="text-[16px] text-text-tertiary leading-relaxed mb-8">
              Build custom integrations and automate your pipeline with the ArchRevenue REST API. Our API is predictable, resource-oriented, and returns JSON-encoded responses.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              <div className="bg-surface-secondary border border-border-default rounded-[var(--radius-card)] p-5">
                <Shield className="w-5 h-5 text-indigo-500 mb-3" />
                <h3 className="text-[14px] font-bold text-text-primary mb-1">Bearer Auth</h3>
                <p className="text-[12px] text-text-tertiary leading-relaxed">Secure your requests with industry-standard Bearer tokens.</p>
              </div>
              <div className="bg-surface-secondary border border-border-default rounded-[var(--radius-card)] p-5">
                <Zap className="w-5 h-5 text-indigo-500 mb-3" />
                <h3 className="text-[14px] font-bold text-text-primary mb-1">High Throughput</h3>
                <p className="text-[12px] text-text-tertiary leading-relaxed">Enterprise limits handle up to 1,000 requests per minute.</p>
              </div>
              <div className="bg-surface-secondary border border-border-default rounded-[var(--radius-card)] p-5">
                <Terminal className="w-5 h-5 text-indigo-500 mb-3" />
                <h3 className="text-[14px] font-bold text-text-primary mb-1">JSON Native</h3>
                <p className="text-[12px] text-text-tertiary leading-relaxed">All payloads and responses are formatted as clean JSON.</p>
              </div>
            </div>
          </section>

          <section id="authentication" className="mb-16 scroll-mt-48">
            <h2 className="text-[20px] font-bold text-text-primary mb-4 pb-2 border-b border-border-default">Authentication</h2>
            <p className="text-[14px] text-text-secondary leading-relaxed mb-4">
              To authenticate with the API, you need to provide your API key in the <code>Authorization</code> header. You can generate a new API key in the Settings section of your dashboard.
            </p>
            <div className="bg-[#0f172a] rounded-[var(--radius-card)] p-5 mb-4 overflow-x-auto">
              <pre className="text-[13px] text-slate-300 font-mono">
<span className="text-pink-400">curl</span> https://api.archrevenue.com/v1/leads \<br/>
  -H <span className="text-emerald-300">"Authorization: Bearer sk_live_your_api_key_here"</span>
              </pre>
            </div>
            <p className="text-[13px] text-text-tertiary">
              Keep your API keys secret. Do not expose them in client-side code like browsers or mobile apps.
            </p>
          </section>

          <section id="rate-limits" className="mb-16 scroll-mt-48">
            <h2 className="text-[20px] font-bold text-text-primary mb-4 pb-2 border-b border-border-default">Rate Limits</h2>
            <p className="text-[14px] text-text-secondary leading-relaxed mb-4">
              Our API implements rate limiting to ensure fair usage across all customers. Limits are calculated on a rolling 60-second window.
            </p>
            <div className="bg-surface-secondary border border-border-default rounded-[var(--radius-card)] overflow-hidden mb-4">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-surface-hover border-b border-border-default">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-text-primary">Plan</th>
                    <th className="px-4 py-3 font-semibold text-text-primary">Requests per minute</th>
                    <th className="px-4 py-3 font-semibold text-text-primary">Burst limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  <tr>
                    <td className="px-4 py-3 text-text-secondary">Starter</td>
                    <td className="px-4 py-3 text-text-secondary">60</td>
                    <td className="px-4 py-3 text-text-secondary">10 / sec</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-text-secondary">Professional</td>
                    <td className="px-4 py-3 text-text-secondary">300</td>
                    <td className="px-4 py-3 text-text-secondary">50 / sec</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-text-secondary">Enterprise</td>
                    <td className="px-4 py-3 text-text-secondary">1000</td>
                    <td className="px-4 py-3 text-text-secondary">100 / sec</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[13px] text-text-tertiary">
              When a limit is exceeded, the API returns a <code>429 Too Many Requests</code> status code.
            </p>
          </section>

          <section id="leads-api" className="mb-16 scroll-mt-48">
            <h2 className="text-[20px] font-bold text-text-primary mb-4 pb-2 border-b border-border-default">Leads API</h2>
            <p className="text-[14px] text-text-secondary leading-relaxed mb-4">
              Creates a new lead in your directory.
            </p>
            
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 rounded-md">POST</span>
              <code className="text-[13px] font-mono text-text-secondary bg-surface-hover px-2 py-1 rounded">/v1/leads</code>
            </div>

            <div className="bg-[#0f172a] rounded-[var(--radius-card)] p-5 overflow-x-auto mb-6">
              <pre className="text-[13px] text-slate-300 font-mono">
<span className="text-pink-400">curl</span> -X POST https://api.archrevenue.com/v1/leads \<br/>
  -H <span className="text-emerald-300">"Authorization: Bearer sk_live_***"</span> \<br/>
  -H <span className="text-emerald-300">"Content-Type: application/json"</span> \<br/>
  -d <span className="text-amber-300">'{'{'}"fullName":"Sarah Jenkins","email":"sarah@techcorp.io","company":"TechCorp Solutions","website":"techcorp.io"{'}'}'</span>
              </pre>
            </div>
            
            <h3 className="text-[15px] font-semibold text-text-primary mb-3">Parameters</h3>
            <ul className="space-y-3 mb-6">
              <li className="text-[13px] text-text-secondary border-l-2 border-border-default pl-3">
                <span className="font-mono text-text-primary mr-2">fullName</span> <span className="text-text-tertiary text-xs uppercase mr-2">string</span>
                Full name of the lead. Required.
              </li>
              <li className="text-[13px] text-text-secondary border-l-2 border-border-default pl-3">
                <span className="font-mono text-text-primary mr-2">email</span> <span className="text-text-tertiary text-xs uppercase mr-2">string</span>
                Primary contact email. Required for automated outreach.
              </li>
              <li className="text-[13px] text-text-secondary border-l-2 border-border-default pl-3">
                <span className="font-mono text-text-primary mr-2">company</span> <span className="text-text-tertiary text-xs uppercase mr-2">string</span>
                Name of the lead's company.
              </li>
              <li className="text-[13px] text-text-secondary border-l-2 border-border-default pl-3">
                <span className="font-mono text-text-primary mr-2">website</span> <span className="text-text-tertiary text-xs uppercase mr-2">string</span>
                Company domain to trigger automatic Web Scraping & AI Enrichment.
              </li>
            </ul>
          </section>
          
          <section id="ai-scoring" className="mb-16 scroll-mt-48">
            <h2 className="text-[20px] font-bold text-text-primary mb-4 pb-2 border-b border-border-default">AI Scoring</h2>
            <p className="text-[14px] text-text-secondary leading-relaxed mb-4">
              Force an immediate AI rescore of an existing lead based on your updated ICP and company settings.
            </p>
            
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-md">POST</span>
              <code className="text-[13px] font-mono text-text-secondary bg-surface-hover px-2 py-1 rounded">/v1/leads/{'{'}lead_id{'}'}/score</code>
            </div>

            <div className="bg-[#0f172a] rounded-[var(--radius-card)] p-5 overflow-x-auto mb-4">
              <pre className="text-[13px] text-slate-300 font-mono">
<span className="text-pink-400">curl</span> -X POST https://api.archrevenue.com/v1/leads/ld_12345/score \<br/>
  -H <span className="text-emerald-300">"Authorization: Bearer sk_live_***"</span>
              </pre>
            </div>
          </section>

          <section id="webhooks" className="mb-8 scroll-mt-48">
            <h2 className="text-[20px] font-bold text-text-primary mb-4 pb-2 border-b border-border-default">Webhooks</h2>
            <p className="text-[14px] text-text-secondary leading-relaxed mb-4">
              Listen for events on your ArchRevenue account so your integration can automatically trigger reactions.
            </p>
            
            <div className="bg-surface-secondary border border-border-default rounded-[var(--radius-card)] overflow-hidden mb-4 p-4">
              <h4 className="text-[13px] font-bold text-text-primary mb-2">Supported Events</h4>
              <ul className="list-disc list-inside space-y-1 text-[13px] text-text-secondary">
                <li><code className="bg-surface-card border px-1 rounded">lead.created</code></li>
                <li><code className="bg-surface-card border px-1 rounded">lead.score_updated</code></li>
                <li><code className="bg-surface-card border px-1 rounded">email.opened</code></li>
                <li><code className="bg-surface-card border px-1 rounded">email.replied</code></li>
              </ul>
            </div>

            <h4 className="text-[13px] font-bold text-text-primary mb-2 mt-6">Example Payload (lead.score_updated)</h4>
            <div className="bg-[#0f172a] rounded-[var(--radius-card)] p-5 overflow-x-auto mb-4">
              <pre className="text-[13px] text-slate-300 font-mono">
{`{
  "type": "lead.score_updated",
  "data": {
    "lead_id": "ld_12345",
    "aiAnalysis": {
      "score": 92,
      "category": "Hot",
      "priority": "Critical",
      "recommendedAction": "Immediate Outreach",
      "reason": "Strong ICP match with active hiring signals."
    }
  }
}`}
              </pre>
            </div>
            
            <p className="text-[13px] text-text-tertiary">
              Webhooks are signed using an HMAC SHA-256 signature. You should verify the <code>Arch-Signature</code> header before processing the event payload.
            </p>
          </section>

        </div>
      </PageContent>
    </Page>
    </div>
  );
}


