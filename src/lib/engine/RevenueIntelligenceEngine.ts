import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Lead, SellerProfile, JobState, WorkflowState } from '../types';
import { ResearchJob } from './jobs/ResearchJob';
import { ScoringJob } from './jobs/ScoringJob';
import { StrategyJob } from './jobs/StrategyJob';
import { OutreachJob } from './jobs/OutreachJob';

export interface JobResult {
  status: 'completed' | 'failed' | 'skipped';
  tokensUsed: number;
  error?: string;
}

export interface IntelligenceJob {
  id: string;
  name: string;
  description: string;
  execute: (lead: Lead, profile: SellerProfile) => Promise<JobResult>;
  shouldSkip: (lead: Lead) => boolean;
}

const JOBS: IntelligenceJob[] = [
  new ResearchJob(),
  new ScoringJob(),
  new StrategyJob(),
  new OutreachJob(),
];

export class RevenueIntelligenceEngine {
  
  static async startWorkflow(leadId: string, profile: SellerProfile, forceRun: boolean = false): Promise<void> {
    const runId = crypto.randomUUID();
    const docRef = doc(db, 'leads', leadId);
    
    // Initialize Workflow State
    const initialState: WorkflowState = {
      runId,
      status: 'running',
      startedAt: serverTimestamp(),
      jobs: {}
    };

    JOBS.forEach(job => {
      initialState.jobs[job.id] = {
        id: job.id,
        name: job.name,
        status: 'pending',
        tokensUsed: 0
      };
    });

    await updateDoc(docRef, { activeWorkflow: initialState });

    // Execute Jobs Sequentially
    let hasFailures = false;

    for (const job of JOBS) {
      // Refresh lead data before each job to ensure we have the latest state
      const leadSnap = await getDoc(docRef);
      if (!leadSnap.exists()) break;
      const currentLead = { id: leadSnap.id, ...leadSnap.data() } as Lead;

      // Check if workflow was interrupted or replaced
      if (currentLead.activeWorkflow?.runId !== runId) {
        console.warn(`[Engine] Workflow ${runId} was superseded. Aborting.`);
        return;
      }

      // Mark job as running
      await updateDoc(docRef, {
        [`activeWorkflow.jobs.${job.id}.status`]: 'running',
        [`activeWorkflow.jobs.${job.id}.startedAt`]: serverTimestamp()
      });

      let result: JobResult;

      try {
        if (!forceRun && job.shouldSkip(currentLead)) {
          result = { status: 'skipped', tokensUsed: 0 };
        } else {
          result = await job.execute(currentLead, profile);
        }
      } catch (err: any) {
        console.error(`[Engine] Job ${job.id} failed:`, err);
        result = { status: 'failed', tokensUsed: 0, error: err.message || 'Unknown error' };
        hasFailures = true;
      }

      // Mark job as finished
      await updateDoc(docRef, {
        [`activeWorkflow.jobs.${job.id}.status`]: result.status,
        [`activeWorkflow.jobs.${job.id}.completedAt`]: serverTimestamp(),
        [`activeWorkflow.jobs.${job.id}.tokensUsed`]: result.tokensUsed,
        [`activeWorkflow.jobs.${job.id}.error`]: result.error || null
      });

      // Stop execution on first failure to allow retry
      if (result.status === 'failed') {
        break;
      }
    }

    // Finalize Workflow
    const finalLeadSnap = await getDoc(docRef);
    if (finalLeadSnap.exists()) {
      const finalLead = { id: finalLeadSnap.id, ...finalLeadSnap.data() } as Lead;
      
      if (finalLead.activeWorkflow?.runId === runId) {
        const finalStatus = hasFailures ? 'partial_success' : 'completed';
        
        let summary = 'Workflow incomplete.';
        if (!hasFailures) {
          const signals = finalLead.research?.growthSignals?.length || 0;
          const likelihood = finalLead.aiAnalysis?.evidence?.buyingLikelihood || 'Unknown';
          const score = finalLead.aiAnalysis?.score || 0;
          summary = `Analysis Complete. Detected ${signals} growth signals with ${likelihood} buying likelihood (Score: ${score}/100). Outreach strategy ready.`;
          
          // Append consolidated timeline event
          const newActivities = [
            ...(finalLead.activities || []),
            { 
              id: crypto.randomUUID(), 
              action: `AI completed a full account analysis.`, 
              timestamp: new Date() 
            }
          ];
          await updateDoc(docRef, { activities: newActivities });
        }

        await updateDoc(docRef, {
          'activeWorkflow.status': finalStatus,
          'activeWorkflow.completedAt': serverTimestamp(),
          'activeWorkflow.summary': summary
        });
      }
    }
  }

  static async retryJob(leadId: string, jobId: string, profile: SellerProfile): Promise<void> {
    const docRef = doc(db, 'leads', leadId);
    const leadSnap = await getDoc(docRef);
    if (!leadSnap.exists()) return;
    
    const lead = { id: leadSnap.id, ...leadSnap.data() } as Lead;
    if (!lead.activeWorkflow) return;

    const jobIndex = JOBS.findIndex(j => j.id === jobId);
    if (jobIndex === -1) return;

    // Reset status to running
    await updateDoc(docRef, {
      'activeWorkflow.status': 'running',
      [`activeWorkflow.jobs.${jobId}.status`]: 'running',
      [`activeWorkflow.jobs.${jobId}.startedAt`]: serverTimestamp(),
      [`activeWorkflow.jobs.${jobId}.error`]: null
    });

    // Execute from this job onwards
    let hasFailures = false;
    for (let i = jobIndex; i < JOBS.length; i++) {
      const job = JOBS[i];
      const currentSnap = await getDoc(docRef);
      const currentLead = { id: currentSnap.id, ...currentSnap.data() } as Lead;

      await updateDoc(docRef, {
        [`activeWorkflow.jobs.${job.id}.status`]: 'running',
        [`activeWorkflow.jobs.${job.id}.startedAt`]: serverTimestamp()
      });

      let result: JobResult;
      try {
        result = await job.execute(currentLead, profile);
      } catch (err: any) {
        console.error(`[Engine] Job ${job.id} failed during retry:`, err);
        result = { status: 'failed', tokensUsed: 0, error: err.message };
        hasFailures = true;
      }

      await updateDoc(docRef, {
        [`activeWorkflow.jobs.${job.id}.status`]: result.status,
        [`activeWorkflow.jobs.${job.id}.completedAt`]: serverTimestamp(),
        [`activeWorkflow.jobs.${job.id}.tokensUsed`]: result.tokensUsed,
        [`activeWorkflow.jobs.${job.id}.error`]: result.error || null
      });

      if (result.status === 'failed') {
        break;
      }
    }

    const finalStatus = hasFailures ? 'partial_success' : 'completed';
    await updateDoc(docRef, {
      'activeWorkflow.status': finalStatus,
      'activeWorkflow.completedAt': serverTimestamp()
    });
  }
}
