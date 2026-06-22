import React from 'react';
import { Lead } from '../lib/types';
import { Target, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export function PipelineAnalytics({ leads }: { leads: Lead[] }) {
  const wonLeads = leads.filter(l => l.status === 'won');
  const lostLeads = leads.filter(l => l.status === 'lost');
  const closedTotal = wonLeads.length + lostLeads.length;
  const conversionRate = closedTotal > 0 ? Math.round((wonLeads.length / closedTotal) * 100) : 0;

  const analyzedLeads = leads.filter(l => l.aiAnalysis);
  const avgScore = analyzedLeads.length > 0 
    ? Math.round(analyzedLeads.reduce((acc, curr) => acc + (curr.aiAnalysis!.score || 0), 0) / analyzedLeads.length)
    : 0;

  const hotLeads = analyzedLeads.filter(l => l.aiAnalysis!.category === 'Hot' && l.status !== 'won' && l.status !== 'lost');
  const warmLeads = analyzedLeads.filter(l => l.aiAnalysis!.category === 'Warm' && l.status !== 'won' && l.status !== 'lost');
  const qualLeads = leads.filter(l => l.status === 'qualified' && (!l.aiAnalysis || (l.aiAnalysis.category !== 'Hot' && l.aiAnalysis.category !== 'Warm')));
  
  const pipelineValue = hotLeads.length * 8000 + warmLeads.length * 3500 + qualLeads.length * 2000;

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-10">
      <div className="flex-1 bg-gradient-to-br from-teal-500/5 to-transparent border border-teal-500/10 rounded-2xl p-4 flex items-center justify-between shadow-lg backdrop-blur-md">
        <div>
          <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-1">Conversion Rate</p>
          <div className="flex items-end gap-2">
            <h4 className="text-2xl font-bold text-text-primary tracking-tight">{conversionRate}%</h4>
            <span className="text-xs text-teal-600 mb-1 flex items-center font-medium"><TrendingUp className="w-3 h-3 mr-1"/> vs closed</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-teal-600" />
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-br from-teal-500/5 to-transparent border border-teal-500/10 rounded-2xl p-4 flex items-center justify-between shadow-lg backdrop-blur-md">
        <div>
          <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-1">Avg Lead Score</p>
          <div className="flex items-end gap-2">
            <h4 className="text-2xl font-bold text-text-primary tracking-tight">{avgScore || '-'}</h4>
            <span className="text-xs text-teal-600 mb-1 font-medium">/ 100</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <Activity className="w-5 h-5 text-teal-600" />
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-br from-teal-500/5 to-transparent border border-teal-500/10 rounded-2xl p-4 flex items-center justify-between shadow-lg backdrop-blur-md">
        <div>
          <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-1">Pipeline Value</p>
          <div className="flex items-end gap-2">
            <h4 className="text-2xl font-bold text-text-primary tracking-tight">${(pipelineValue).toLocaleString()}</h4>
            <span className="text-xs text-teal-600 mb-1 font-medium">Forecast</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-teal-600" />
        </div>
      </div>
    </div>
  );
}
