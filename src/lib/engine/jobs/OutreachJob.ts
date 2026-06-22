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
    return !!lead.aiAnalysis?.followUp?.email && !!lead.aiAnalysis?.followUp?.linkedin;
  }

  async execute(lead: Lead, profile: SellerProfile): Promise<JobResult> {
    // Generate all 3 drafts in parallel to save time
    const [email, linkedin, callScript] = await Promise.all([
      generateSingleOutreach('email', lead, profile).catch(e => { console.error('Email failed:', e); return ''; }),
      generateSingleOutreach('linkedin', lead, profile).catch(e => { console.error('LinkedIn failed:', e); return ''; }),
      generateSingleOutreach('callScript', lead, profile).catch(e => { console.error('Call failed:', e); return ''; })
    ]);

    let parsedEmail = '';
    let parsedLinkedin = '';
    let parsedCall = '';

    try { parsedEmail = JSON.parse(email).email; } catch(e) {}
    try { parsedLinkedin = JSON.parse(linkedin).linkedin; } catch(e) {}
    try { parsedCall = JSON.parse(callScript).callScript; } catch(e) {}

    const followUp: AIFollowUp = {
      email: parsedEmail,
      linkedin: parsedLinkedin,
      callScript: parsedCall,
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
