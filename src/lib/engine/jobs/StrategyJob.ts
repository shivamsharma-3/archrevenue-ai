import { IntelligenceJob, JobResult } from '../RevenueIntelligenceEngine';
import { Lead, SellerProfile } from '../../types';
import { generateDealCoach } from '../../ai';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export class StrategyJob implements IntelligenceJob {
  id = 'strategy';
  name = 'Revenue Strategy';
  description = 'Building personalized revenue strategy and anticipating objections';

  shouldSkip(lead: Lead): boolean {
    return !!lead.dealCoach && !!lead.dealCoach.bestAngle;
  }

  async execute(lead: Lead, profile: SellerProfile): Promise<JobResult> {
    const result = await generateDealCoach(lead, profile);
    
    const docRef = doc(db, 'leads', lead.id!);
    await updateDoc(docRef, { dealCoach: result });

    return {
      status: 'completed',
      tokensUsed: (result as any).tokensUsed || 0
    };
  }
}
