import React, { useEffect, useState } from 'react';
import { AppCard } from '../ui/AppCard';
import { WorkflowState, JobState } from '../../lib/types';
import { CheckCircle2, Loader2, PlayCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AppButton } from '../ui/AppButton';

interface IntelligenceProgressProps {
  workflow: WorkflowState;
  onRetryJob: (jobId: string) => void;
  onDismiss: () => void;
}

export const IntelligenceProgress: React.FC<IntelligenceProgressProps> = ({ workflow, onRetryJob, onDismiss }) => {
  const [completedJobsCount, setCompletedJobsCount] = useState(0);

  const jobOrder = ['research', 'scoring', 'strategy', 'outreach'];
  
  useEffect(() => {
    const jobsArray = Object.values(workflow.jobs) as JobState[];
    const count = jobsArray.filter(j => j.status === 'completed' || j.status === 'skipped').length;
    setCompletedJobsCount(count);
  }, [workflow.jobs]);

  const isWorkflowFinished = workflow.status === 'completed' || workflow.status === 'partial_success';

  if (isWorkflowFinished && workflow.status === 'completed') {
    return (
      <AppCard level={1} className="p-6 bg-emerald-50 border-emerald-200 mb-6 animate-in fade-in slide-in-from-top-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-emerald-900 mb-2">Analysis Complete</h2>
          <p className="text-emerald-700 font-medium mb-6" style={{ maxWidth: '480px' }}>
            {workflow.summary}
          </p>
          <AppButton variant="primary" onClick={onDismiss} className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
            View Intelligence Report
          </AppButton>
        </div>
      </AppCard>
    );
  }

  return (
    <AppCard level={1} className="p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: Summary / Progress Bar */}
        <div className="md:w-1/3 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
              {workflow.status === 'running' ? (
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              ) : workflow.status === 'partial_success' ? (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              ) : (
                <PlayCircle className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-text-primary">
                {workflow.status === 'running' ? 'Analyzing Account...' : 'Analysis Paused'}
              </h2>
              <p className="text-[13px] text-text-secondary font-medium">
                {completedJobsCount} of {jobOrder.length} tasks complete
              </p>
            </div>
          </div>
          
          <div className="mt-6 w-full bg-surface-secondary rounded-full h-2 overflow-hidden border border-border-default">
            <div 
              className="bg-indigo-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${(completedJobsCount / jobOrder.length) * 100}%` }}
            />
          </div>

          {workflow.status === 'partial_success' && (
            <div className="mt-6">
              <AppButton variant="secondary" onClick={onDismiss} className="w-full">
                View Partial Report
              </AppButton>
            </div>
          )}
        </div>

        {/* Right Side: Job List */}
        <div className="md:w-2/3 bg-surface-secondary border border-border-default rounded-xl p-4 flex flex-col gap-1">
          {jobOrder.map(jobId => {
            const job = workflow.jobs[jobId];
            if (!job) return null;

            const isCompleted = job.status === 'completed' || job.status === 'skipped';
            const isRunning = job.status === 'running';
            const isFailed = job.status === 'failed';
            const isPending = job.status === 'pending';

            return (
              <div 
                key={jobId} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg transition-colors",
                  isRunning ? "bg-surface-card shadow-sm border border-indigo-100" : "border border-transparent",
                  isFailed ? "bg-red-50 border border-red-100" : ""
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : isRunning ? (
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    ) : isFailed ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-border-active" />
                    )}
                  </div>
                  <div>
                    <h4 className={cn("text-[14px] font-semibold", isFailed ? "text-red-900" : isPending ? "text-text-tertiary" : "text-text-primary")}>
                      {job.name}
                    </h4>
                    {isFailed && job.error && (
                      <p className="text-[12px] text-red-600 font-medium mt-0.5 max-w-md break-words">
                        {job.error.includes('429') || job.error.includes('quota') || job.error.includes('RESOURCE_EXHAUSTED') || job.error.startsWith('{')
                          ? '⚡ AI Rate Limit reached on free key. Click Retry to run fallback.'
                          : job.error.length > 140 ? job.error.slice(0, 140) + '...' : job.error}
                      </p>
                    )}
                  </div>
                </div>

                {isFailed && (
                  <AppButton 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onRetryJob(jobId)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Retry
                  </AppButton>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppCard>
  );
};
