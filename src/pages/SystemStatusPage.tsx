import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Activity, Server, Zap, Globe, ChevronLeft, Mail, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Page, PageHeader, PageContent } from '../components/layout/PageLayout';
import { useSystemStatus, ServiceStatus } from '../hooks/useSystemStatus';

export default function SystemStatusPage() {
  const navigate = useNavigate();
  const metrics = useSystemStatus();
  
  const context = useOutletContext<any>() || {};
  const { gmailConnected, calendarConnected } = context;

  const getStatusColor = (status: ServiceStatus) => {
    switch(status) {
      case 'operational': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'degraded': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'offline': return 'text-rose-600 bg-rose-50 border-rose-200';
    }
  };

  const getStatusDot = (status: ServiceStatus) => {
    switch(status) {
      case 'operational': return 'bg-emerald-500';
      case 'degraded': return 'bg-amber-500';
      case 'offline': return 'bg-rose-500';
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch(status) {
      case 'operational': return 'Operational';
      case 'degraded': return 'Degraded';
      case 'offline': return 'Offline';
    }
  };

  const services = [
    { 
      name: 'Core App Platform', 
      icon: <Server className="w-4 h-4" />, 
      status: metrics.dbStatus,
      latency: metrics.dbLatency !== null ? `${metrics.dbLatency}ms` : '--'
    },
    { 
      name: 'AI Intelligence Engine', 
      icon: <Zap className="w-4 h-4" />, 
      status: metrics.isOnline ? 'operational' : 'offline' as ServiceStatus,
      latency: metrics.isOnline ? '< 150ms' : '--'
    },
    { 
      name: 'Real-Time Sync', 
      icon: <Activity className="w-4 h-4" />, 
      status: metrics.isOnline ? 'operational' : 'offline' as ServiceStatus,
      latency: metrics.isOnline ? '< 10ms' : '--'
    }
  ];

  const overall = metrics.overallStatus;
  const isAllGood = overall === 'operational';

  return (
    <div style={{ zoom: 0.9 }}>
    <Page>
      <PageHeader 
        title="System Status" 
        description="Live operational status of ArchRevenue services."
        breadcrumbs={
          <button
            onClick={() => navigate('/help')}
            className="flex items-center gap-2 text-[13px] font-medium text-text-secondary hover:text-indigo-600 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Help Center
          </button>
        }
      />
      <PageContent>

      <div className={cn("border rounded-[var(--radius-card)] p-8 md:p-12 text-center mb-10 shadow-sm relative overflow-hidden transition-colors duration-500", getStatusColor(overall))}>
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-surface-card/20 blur-3xl rounded-full pointer-events-none" />
        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border bg-surface-card/60 transition-colors duration-500", getStatusColor(overall))}>
          {isAllGood ? <CheckCircle className="w-8 h-8" /> : (overall === 'degraded' ? <AlertTriangle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />)}
        </div>
        <h1 className="text-[28px] md:text-[32px] font-bold text-text-primary tracking-tight font-display mb-2">
          {isAllGood ? 'All Systems Operational' : (overall === 'degraded' ? 'Degraded Performance' : 'System Offline')}
        </h1>
        <p className="text-[15px] text-text-secondary font-medium">
          {isAllGood ? 'ArchRevenue is operating normally. Metrics are updating in real-time.' : 'We are currently experiencing connection issues.'}
        </p>
      </div>

      <h2 className="text-[20px] font-bold text-text-primary mb-5 pl-2">Global Services</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {services.map(service => (
          <div key={service.name} className="bg-white border border-border-default rounded-[20px] p-6 shadow-sm flex flex-col justify-between h-full hover:-translate-y-0.5 transition-transform duration-200">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-text-secondary">
                {service.icon}
                <h3 className="text-[15px] font-semibold text-text-primary">{service.name}</h3>
              </div>
              <p className={cn("text-[13px] font-medium flex items-center gap-1.5", 
                service.status === 'operational' ? 'text-emerald-600' : (service.status === 'degraded' ? 'text-amber-600' : 'text-rose-600')
              )}>
                <span className={cn("w-2 h-2 rounded-full animate-pulse transition-colors duration-500", getStatusDot(service.status))} />
                {getStatusText(service.status)}
              </p>
            </div>
            <div className="border-t border-border-default pt-4 mt-auto">
              <span className="block text-[22px] font-bold text-text-primary mb-0.5">{service.latency}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1"><Activity className="w-3 h-3" /> Latency</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-[20px] font-bold text-text-primary mt-12 mb-5 pl-2">Personal Workspace Health</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gmail Integration */}
        <div className="bg-white border border-border-default rounded-[20px] p-6 shadow-sm flex items-start justify-between hover:-translate-y-0.5 transition-transform duration-200">
          <div className="flex items-start gap-4">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", gmailConnected ? "bg-emerald-50 text-emerald-600" : "bg-surface-secondary text-text-tertiary")}>
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-text-primary mb-1">Gmail Connection</h3>
              {gmailConnected ? (
                <p className="text-[13px] text-emerald-600 font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Connected & Syncing
                </p>
              ) : (
                <p className="text-[13px] text-text-secondary font-medium">
                  Not configured
                </p>
              )}
            </div>
          </div>
          {!gmailConnected && (
            <button onClick={() => navigate('/settings')} className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
              Connect <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Calendar Integration */}
        <div className="bg-white border border-border-default rounded-[20px] p-6 shadow-sm flex items-start justify-between hover:-translate-y-0.5 transition-transform duration-200">
          <div className="flex items-start gap-4">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", calendarConnected ? "bg-emerald-50 text-emerald-600" : "bg-surface-secondary text-text-tertiary")}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-text-primary mb-1">Calendar Sync</h3>
              {calendarConnected ? (
                <p className="text-[13px] text-emerald-600 font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Connected & Syncing
                </p>
              ) : (
                <p className="text-[13px] text-text-secondary font-medium">
                  Not configured
                </p>
              )}
            </div>
          </div>
          {!calendarConnected && (
            <button onClick={() => navigate('/settings')} className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
              Connect <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      </PageContent>
    </Page>
    </div>
  );
}
