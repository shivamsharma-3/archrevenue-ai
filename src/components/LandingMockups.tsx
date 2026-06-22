import React from 'react';
import { Target, Zap, TrendingUp, Users, CheckCircle2, AlertCircle, BarChart3, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export const DashboardMockup = () => {
  return (
    <div className="w-full h-full bg-surface-primary flex flex-col font-sans text-text-primary absolute inset-0">
      {/* Mini Header */}
      <div className="h-12 border-b border-border-default bg-surface-secondary flex items-center px-6 justify-between shrink-0">
        <div className="text-sm font-semibold text-text-primary">Command Center</div>
        <div className="flex space-x-3">
          <div className="w-6 h-6 rounded-full bg-surface-hover border border-border-default" />
          <div className="w-6 h-6 rounded-full bg-surface-hover border border-border-default" />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 grid grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Stats Row */}
        <div className="col-span-3 grid grid-cols-4 gap-4 h-24">
          {[
            { label: "Active Pipeline", value: "$845,000", trend: "+12%" },
            { label: "Win Rate", value: "34%", trend: "+2.4%" },
            { label: "Hot Leads", value: "28", trend: "+5" },
            { label: "Avg Deal Size", value: "$42k", trend: "+$4k" },
          ].map((s, i) => (
            <div key={i} className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-4 shadow-sm flex flex-col justify-center">
              <div className="text-xs text-text-secondary font-medium mb-1">{s.label}</div>
              <div className="flex items-end justify-between">
                <div className="text-xl font-semibold text-text-primary">{s.value}</div>
                <div className="text-xs text-teal-600 font-medium bg-teal-50 px-1.5 py-0.5 rounded-[var(--radius-button)]">{s.trend}</div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Briefing */}
        <div className="col-span-2 bg-surface-card border border-border-default rounded-[var(--radius-card)] p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-4 h-4 text-blue-500" />
            <div className="text-sm font-semibold text-text-primary">AI Morning Briefing</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">Stripe increased pricing limits</div>
                <div className="text-xs text-text-secondary mt-0.5">3 active deals are evaluating payment processors. Reach out today with our competitive analysis.</div>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-teal-50/50 rounded-lg border border-teal-100/50">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">Acme Corp raised $40M Series B</div>
                <div className="text-xs text-text-secondary mt-0.5">Budget constraints likely removed. Opportunity score increased from 64 to 92.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Closing Soon */}
        <div className="col-span-1 bg-surface-card border border-border-default rounded-[var(--radius-card)] p-5 shadow-sm">
          <div className="text-sm font-semibold text-text-primary mb-4">Closing Soon</div>
          <div className="space-y-4">
            {[
              { company: "Vercel", value: "$120k", prob: "90%" },
              { company: "Linear", value: "$85k", prob: "75%" },
              { company: "Attio", value: "$45k", prob: "60%" }
            ].map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-[var(--radius-button)] bg-surface-secondary border border-border-default flex items-center justify-center text-[10px] font-bold text-text-tertiary">
                    {d.company[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary leading-none">{d.company}</div>
                    <div className="text-xs text-text-secondary mt-1">{d.value}</div>
                  </div>
                </div>
                <div className="text-xs font-mono bg-surface-secondary text-text-secondary px-2 py-1 rounded-[var(--radius-button)]">{d.prob}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PipelineMockup = () => {
  const columns = [
    { title: "Qualified", count: 12, value: "$340k", items: [
      { name: "GlobalTech", amount: "$45,000", score: 88, tags: ["Enterprise"] },
      { name: "Nexus Systems", amount: "$22,000", score: 76, tags: ["Mid-Market"] },
    ] },
    { title: "Proposal", count: 8, value: "$520k", items: [
      { name: "Acme Corp", amount: "$120,000", score: 94, tags: ["Enterprise", "Hot"] },
      { name: "CloudSync", amount: "$85,000", score: 82, tags: ["Expansion"] },
    ] }
  ];

  return (
    <div className="w-full h-full bg-surface-primary flex flex-col font-sans p-6 absolute inset-0">
      <div className="flex space-x-6 h-full">
        {columns.map((col, i) => (
          <div key={i} className="flex-1 bg-surface-secondary border border-border-default rounded-[var(--radius-card)] flex flex-col">
            <div className="p-4 border-b border-border-default bg-surface-card rounded-t-[var(--radius-card)] flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-semibold text-text-primary">{col.title}</div>
                <div className="text-xs bg-surface-hover text-text-secondary px-1.5 py-0.5 rounded-[var(--radius-button)]">{col.count}</div>
              </div>
              <div className="text-xs font-medium text-text-secondary">{col.value}</div>
            </div>
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {col.items.map((item, j) => (
                <div key={j} className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-4 shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-semibold text-sm text-text-primary">{item.name}</div>
                    <div className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded-[var(--radius-button)] font-medium",
                      item.score >= 90 ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                    )}>
                      {item.score}
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary font-medium mb-3">{item.amount}</div>
                  <div className="flex space-x-2">
                    {item.tags.map(t => (
                      <div key={t} className="text-[10px] bg-surface-secondary text-text-secondary px-1.5 py-0.5 rounded-[var(--radius-button)] border border-border-default">
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LeadIntelligenceMockup = () => {
  return (
    <div className="w-full h-full bg-surface-primary flex flex-col font-sans absolute inset-0">
      <div className="h-16 border-b border-border-default flex items-center px-6 shrink-0 bg-surface-secondary">
        <div className="w-10 h-10 rounded-[var(--radius-card)] bg-blue-600 text-white flex items-center justify-center font-bold text-lg mr-4">A</div>
        <div>
          <div className="text-base font-semibold text-text-primary">Acme Corporation</div>
          <div className="text-xs text-text-secondary">acmecorp.com • Enterprise Software</div>
        </div>
      </div>
      
      <div className="flex-1 p-6 grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-surface-secondary border border-border-default rounded-[var(--radius-card)] p-5">
            <div className="text-sm font-semibold text-text-primary mb-4 flex items-center">
              <Sparkles className="w-4 h-4 text-blue-500 mr-2" />
              AI Deal Coach Analysis
            </div>
            <div className="text-sm text-text-secondary leading-relaxed space-y-3">
              <p>Acme is actively scaling their engineering team (40+ open roles on Careers page) indicating a strong need for developer tooling.</p>
              <p className="p-3 bg-amber-50 border border-amber-200 rounded-[var(--radius-card)] text-amber-800 text-xs">
                <strong>Objection Risk:</strong> Their current tech stack relies heavily on legacy on-prem servers. Emphasize our hybrid-cloud deployment model during the demo.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border-default rounded-[var(--radius-card)] p-4">
              <div className="text-xs text-text-secondary mb-1">Estimated Budget</div>
              <div className="text-lg font-semibold text-text-primary">$120,000 - $150,000</div>
            </div>
            <div className="border border-border-default rounded-[var(--radius-card)] p-4">
              <div className="text-xs text-text-secondary mb-1">Decision Maker</div>
              <div className="text-sm font-medium text-text-primary">Sarah Jenkins (CTO)</div>
            </div>
          </div>
        </div>
        
        <div className="col-span-1 border-l border-border-default pl-6 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-hover"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-teal-500"
                strokeWidth="3"
                strokeDasharray="94, 100"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-text-primary">94</div>
            </div>
          </div>
          <div className="text-sm font-semibold text-text-primary">Match Score</div>
          <div className="text-xs text-text-secondary text-center mt-2">Highly likely to convert based on ideal customer profile.</div>
        </div>
      </div>
    </div>
  );
};

export const InsightsMockup = () => {
  return (
    <div className="w-full h-full bg-surface-primary flex flex-col font-sans absolute inset-0">
      <div className="p-6">
        <div className="text-lg font-semibold text-text-primary mb-6">Revenue Forecasting</div>
        
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-4 shadow-sm">
            <div className="text-xs text-text-secondary mb-1">Q3 Projection</div>
            <div className="text-xl font-semibold text-text-primary">$1.2M</div>
            <div className="text-xs text-teal-600 mt-1">104% to quota</div>
          </div>
          <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-4 shadow-sm">
            <div className="text-xs text-text-secondary mb-1">Pipeline Coverage</div>
            <div className="text-xl font-semibold text-text-primary">3.2x</div>
            <div className="text-xs text-text-tertiary mt-1">Healthy</div>
          </div>
        </div>
        
        {/* Simple Bar Chart Mockup */}
        <div className="bg-surface-card border border-border-default rounded-[var(--radius-card)] p-6 shadow-sm h-48 flex items-end space-x-6 justify-center">
          {[40, 60, 45, 80, 55, 90, 75].map((height, i) => (
            <div key={i} className="flex flex-col items-center group">
              <div className="text-[10px] text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity mb-2">${height}k</div>
              <div className="w-10 bg-blue-100 rounded-t-[var(--radius-button)] relative hover:bg-blue-200 transition-colors" style={{ height: `${height}%` }}>
                <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-[calc(var(--radius-button)-2px)]" style={{ height: `${height * 0.6}%` }} />
              </div>
              <div className="text-[10px] text-text-secondary mt-2">W{i+1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
