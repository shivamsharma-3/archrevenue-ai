import { IntelligenceJob, JobResult } from '../RevenueIntelligenceEngine';
import { Lead, SellerProfile } from '../../types';
import { researchCompany } from '../../research';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export class ResearchJob implements IntelligenceJob {
  id = 'research';
  name = 'Company Research';
  description = 'Scraping website and extracting factual business intelligence';

  shouldSkip(lead: Lead): boolean {
    // Skip if we already have robust research
    return !!lead.research && !!lead.research.summary;
  }

  async execute(lead: Lead, profile: SellerProfile): Promise<JobResult> {
    if (!lead.website) {
      throw new Error('No website provided for research');
    }

    const researchData = await researchCompany(lead.website);
    
    // Save output immediately
    const docRef = doc(db, 'leads', lead.id!);
    await updateDoc(docRef, { research: researchData });

    return {
      status: 'completed',
      tokensUsed: researchData.tokensUsed || 0
    };
  }
}
