import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Sparkles, CreditCard, ChevronRight, Mail,
  Search, PlayCircle, MessageCircle, ChevronDown, ArrowRight, X, FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { HELP_CATEGORIES } from '../lib/helpArticles';
import { Page, PageHeader, PageContent, PageActions } from '../components/layout/PageLayout';

const FAQS = [
  {
    question: "How does the AI Lead Scoring work?",
    answer: "Our AI analyzes the lead's company description, industry, and recent news against your defined Ideal Customer Profile (ICP). It assigns a score from 0-100 based on fit, buying intent, and overall opportunity.",
  },
  {
    question: "Can I connect my own email account?",
    answer: "Yes, you can connect your Gmail or Outlook account in the Settings page to send personalized AI-generated outreach directly from your own email address.",
  },
  {
    question: "How are AI tokens consumed?",
    answer: "Tokens are used whenever the AI performs an action: scoring a lead, researching a company, or generating an outreach email. You can monitor your token usage in the Billing section.",
  },
  {
    question: "Is there a limit to how many leads I can import?",
    answer: "Depending on your plan, there may be active lead limits. However, CSV imports are processed in batches, and you can map your columns directly in our import wizard.",
  },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Getting Started': <BookOpen className="w-5 h-5 text-teal-600" />,
  'AI Features': <Sparkles className="w-5 h-5 text-violet-600" />,
  'Billing & Account': <CreditCard className="w-5 h-5 text-amber-600" />,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Getting Started': 'Learn the basics of pipeline management, adding leads, and setup.',
  'AI Features': 'Master AI scoring, automated research, and hyper-personalized outreach.',
  'Billing & Account': 'Manage your subscription, team members, and API token limits.',
};

export default function HelpCenterPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div style={{ zoom: 0.95 }}>
    <Page>
      <PageHeader 
        title="Help Center" 
        description="Search our knowledge base or browse categories to master ArchRevenue." 
      >
        <PageActions>
          <div className="relative w-[300px] group hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-tertiary group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-8 py-2 bg-surface-card border border-border-default rounded-[var(--radius-input)] text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <X className="h-3.5 w-3.5 text-text-tertiary hover:text-text-secondary transition-colors" />
              </button>
            )}
          </div>
        </PageActions>
      </PageHeader>

      <PageContent>
      {/* ── Categories Grid (Top row from screenshot) ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {HELP_CATEGORIES.map(cat => (
          <div 
            key={cat.name} 
            onClick={() => navigate(`/help/articles#${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
            className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group cursor-pointer flex flex-col"
          >
            <div className={cn("w-12 h-12 rounded-[var(--radius-card)] flex items-center justify-center border mb-5", cat.bg)}>
              {CATEGORY_ICONS[cat.name]}
            </div>
            <h3 className="text-[17px] font-bold text-text-primary mb-2.5">{cat.name}</h3>
            <p className="text-[14px] text-text-secondary leading-relaxed mb-6 flex-1">
              {CATEGORY_DESCRIPTIONS[cat.name]}
            </p>
            <div className="flex items-center text-[13px] font-bold text-indigo-600 group-hover:text-indigo-700 mt-auto">
              View {cat.count} articles
              <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Layout (2 Columns as per screenshot) ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-12">

        {/* ── Left: Videos + FAQ ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-10">

          {/* Video Tutorials */}
          <section>
            <h2 className="text-[18px] font-semibold text-text-primary mb-4 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-indigo-500" />
              Video Tutorials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <VideoCard title="ArchRevenue Platform Tour in 5 Mins" duration="5:24" imgColor="from-indigo-100 to-indigo-50" />
              <VideoCard title="How to Master AI Cold Outreach" duration="8:12" imgColor="from-violet-100 to-violet-50" />
            </div>
          </section>

          {/* FAQs */}
          <section>
            <h2 className="text-[18px] font-semibold text-text-primary mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-text-tertiary" />
              Frequently Asked Questions
            </h2>
            <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] shadow-sm overflow-hidden divide-y divide-slate-100">
              {FAQS.map((faq, idx) => (
                <div key={idx}>
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-surface-hover transition-colors focus:outline-none"
                  >
                    <span className="text-[14px] font-semibold text-text-primary pr-4">{faq.question}</span>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-text-tertiary transition-transform duration-200 shrink-0",
                      openFaqIndex === idx && "rotate-180"
                    )} />
                  </button>
                  <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out px-6",
                    openFaqIndex === idx ? "max-h-48 opacity-100 pb-5" : "max-h-0 opacity-0"
                  )}>
                    <p className="text-[13px] text-text-secondary leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Right Sidebar ──────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-6 mt-0 lg:mt-[44px]">

          {/* Still Need Help */}
          <div className="bg-slate-900 border border-slate-800 rounded-[var(--radius-card)] p-6 text-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-indigo-500/20 blur-2xl rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-[var(--radius-card)] flex items-center justify-center mb-4 border border-white/10">
                <MessageCircle className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-[17px] font-semibold mb-2 text-white">Still need help?</h3>
              <p className="text-[13px] text-slate-300 mb-5 leading-relaxed">
                Our support team is available 24/7 to help you get the most out of ArchRevenue.
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:support@archrevenue.com"
                  className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white py-3 px-4 rounded-[var(--radius-card)] text-[13px] font-semibold transition-colors"
                >
                  <Mail className="w-4 h-4" /> Email Support
                </a>
                <button className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 px-4 rounded-[var(--radius-card)] text-[13px] font-semibold transition-colors">
                  <MessageCircle className="w-4 h-4" /> Live Chat (Beta)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-7 shadow-sm">
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-text-tertiary mb-5">Quick Links</h4>
            <div className="space-y-4">
              {[
                { label: 'Community Forum', href: '/help/community' },
                { label: 'API Documentation', href: '/help/api' },
                { label: 'System Status', href: '/help/status' },
              ].map(link => (
                <button
                  key={link.label}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(link.href);
                  }}
                  className="block w-full text-left text-[14px] font-semibold text-text-secondary hover:text-indigo-600 transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
      </PageContent>
    </Page>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function VideoCard({ title, duration, imgColor }: { title: string; duration: string; imgColor: string }) {
  return (
    <div className="group cursor-pointer">
      <div className={cn("w-full aspect-video rounded-[20px] mb-3 relative overflow-hidden bg-gradient-to-br border border-border-default", imgColor)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-surface-card/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <PlayCircle className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-surface-primary/80 text-white text-[10px] font-bold px-2 py-1 rounded-[var(--radius-button)]">
          {duration}
        </div>
      </div>
      <h4 className="text-[14px] font-semibold text-text-primary group-hover:text-indigo-600 transition-colors line-clamp-1">{title}</h4>
      <p className="text-[12px] text-text-tertiary mt-0.5">Video Guide</p>
    </div>
  );
}

