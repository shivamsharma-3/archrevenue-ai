import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Plus, Search, Users, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Page, PageHeader, PageContent, PageActions } from '../components/layout/PageLayout';

export default function CommunityForumPage() {
  const navigate = useNavigate();

  const topics = [
    {
      id: 1,
      title: "Best practices for writing the Ideal Customer Profile?",
      author: "Sarah J.",
      replies: 14,
      views: 342,
      category: "Best Practices",
      catColor: "bg-emerald-100 text-emerald-700",
      time: "2 hours ago",
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: 2,
      title: "Integrating via Zapier - Getting a 401 error",
      author: "Michael T.",
      replies: 3,
      views: 89,
      category: "API & Integrations",
      catColor: "bg-blue-100 text-blue-700",
      time: "5 hours ago",
      icon: <HelpCircle className="w-4 h-4" />
    },
    {
      id: 3,
      title: "How I doubled my reply rate using the Direct tone",
      author: "David W.",
      replies: 28,
      views: 1205,
      category: "Success Stories",
      catColor: "bg-purple-100 text-purple-700",
      time: "1 day ago",
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      id: 4,
      title: "Feature Request: Export to HubSpot natively",
      author: "Elena R.",
      replies: 45,
      views: 890,
      category: "Feature Requests",
      catColor: "bg-amber-100 text-amber-700",
      time: "2 days ago",
      icon: <MessageSquare className="w-4 h-4" />
    }
  ];

  return (
    <div style={{ zoom: 0.9 }}>
    <Page>
      <PageHeader 
        title="Community Forum" 
        description="Connect with other sales professionals, share outreach strategies, and get help."
        breadcrumbs={
          <button
            onClick={() => navigate('/help')}
            className="flex items-center gap-2 text-[13px] font-medium text-text-secondary hover:text-indigo-600 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Help
          </button>
        }
      >
        <PageActions>
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface-hover text-text-secondary rounded-[var(--radius-card)] text-[13px] font-semibold hover:bg-surface-hover transition-colors">
            <Users className="w-4 h-4" /> Join Discord
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-[var(--radius-card)] text-[13px] font-semibold hover:bg-indigo-500 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Topic
          </button>
        </PageActions>
      </PageHeader>
      <PageContent>
      {/* Hero */}
      <div className="bg-surface-primary border border-border-default rounded-[var(--radius-card)] p-8 md:p-12 mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-[32px] md:text-[40px] font-bold text-text-primary tracking-tight font-display mb-4">
            ArchRevenue Community
          </h1>
          <p className="text-[16px] text-text-secondary leading-relaxed mb-8">
            Connect with other sales professionals, share outreach strategies, and get help from the ArchRevenue team.
          </p>
          <div className="relative w-full sm:w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-tertiary group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search discussions..."
              className="block w-full pl-11 pr-4 py-4 bg-surface-card border border-border-default rounded-[var(--radius-card)] text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border-default bg-surface-secondary/50 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-text-primary">Recent Discussions</h2>
          <div className="flex gap-2">
            <button className="text-[13px] font-semibold text-text-primary bg-surface-card border border-border-default px-3 py-1.5 rounded-[var(--radius-button)] shadow-sm">Latest</button>
            <button className="text-[13px] font-medium text-text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-[var(--radius-button)] transition-colors">Top</button>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {topics.map(topic => (
            <div key={topic.id} className="p-6 hover:bg-surface-hover transition-colors cursor-pointer group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider", topic.catColor)}>
                      {topic.icon} {topic.category}
                    </span>
                    <span className="text-[12px] text-text-tertiary font-medium">
                      Posted by {topic.author} • {topic.time}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-text-primary group-hover:text-indigo-600 transition-colors truncate">
                    {topic.title}
                  </h3>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-right shrink-0 mt-2">
                  <div>
                    <span className="block text-[15px] font-bold text-text-secondary">{topic.replies}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">Replies</span>
                  </div>
                  <div>
                    <span className="block text-[15px] font-bold text-text-secondary">{topic.views}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">Views</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border-default bg-surface-secondary/50 text-center">
          <button className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-700">
            View All Discussions
          </button>
        </div>
      </div>
      </PageContent>
    </Page>
    </div>
  );
}

