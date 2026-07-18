import { IntelligenceJob, JobResult } from '../RevenueIntelligenceEngine';
import { Lead, SellerProfile, AIFollowUp } from '../../types';
import { generateSingleOutreach } from '../../ai';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export class OutreachJob implements IntelligenceJob {
  id = 'outreach';
  name = 'Outreach Playbook';
  description = 'Writing personalized email, LinkedIn, and call scripts';

  shouldSkip(lead: Lead): boolean {
    const analysis = lead.aiAnalysis;
    if (analysis) {
      const score = typeof analysis.score === 'string' ? parseInt(analysis.score, 10) : analysis.score;
      if (typeof score === 'number' && score < 40) return true;
      if (['Dead', 'Low'].includes(analysis.priority || '')) return true;
      if (['Cold', 'Dead'].includes(analysis.category || '')) return true;
    }
    return !!lead.aiAnalysis?.followUp?.email && !!lead.aiAnalysis?.followUp?.linkedin;
  }

  async execute(lead: Lead, profile: SellerProfile): Promise<JobResult> {
    // Generate all 3 drafts in parallel to save time
    const [email, linkedin, callScript] = await Promise.all([
      generateSingleOutreach('email', lead, profile).catch(e => { console.error('Email failed:', e); return ''; }),
      generateSingleOutreach('linkedin', lead, profile).catch(e => { console.error('LinkedIn failed:', e); return ''; }),
      generateSingleOutreach('callScript', lead, profile).catch(e => { console.error('Call failed:', e); return ''; })
    ]);

    // `generateSingleOutreach` already returns the raw string, so we don't need to parse JSON here.
    const followUp: AIFollowUp = {
      email: email || '',
      linkedin: linkedin || '',
      callScript: callScript || '',
      objective: lead.dealCoach?.bestCta || 'Establish contact',
      messagingAngle: lead.dealCoach?.bestAngle || 'Value proposition',
      painPoints: lead.dealCoach?.objections || []
    };

    const docRef = doc(db, 'leads', lead.id!);
    // Update the followUp object inside the aiAnalysis
    await updateDoc(docRef, {
      'aiAnalysis.followUp': followUp
    });

    return {
      status: 'completed',
      tokensUsed: 0 // token tracking inside parallel calls handles the DB, but we return 0 here
    };
  }
}
