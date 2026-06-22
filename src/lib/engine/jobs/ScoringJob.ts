import { IntelligenceJob, JobResult } from '../RevenueIntelligenceEngine';
import { Lead, SellerProfile } from '../../types';
import { scoreLead } from '../../ai';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export class ScoringJob implements IntelligenceJob {
  id = 'scoring';
  name = 'Opportunity Analysis';
  description = 'Scoring opportunity based on ICP match and buying signals';

  shouldSkip(lead: Lead): boolean {
    // Skip if we already have a recent analysis and haven't gathered new research
    return !!lead.aiAnalysis && !!lead.aiAnalysis.score;
  }

  async execute(lead: Lead, profile: SellerProfile): Promise<JobResult> {
    const result = await scoreLead(lead, profile);
    
    // scoreLead sometimes attaches _freshResearch
    const freshResearch = (result as any)._freshResearch ?? null;
    delete (result as any)._freshResearch;

    const docRef = doc(db, 'leads', lead.id!);
    const updates: any = { aiAnalysis: result };
    if (freshResearch) {
      updates.research = freshResearch;
    }

    await updateDoc(docRef, updates);

    return {
      status: 'completed',
      tokensUsed: 0 // scoreLead doesn't return tokens directly unless we modify it, but that's okay for now
    };
  }
}
