import { Lead, AIAnalysis, CompanyKnowledge, ScoringEvidence, SellerProfile, Note, AITask, TaskStatus } from './types';
import { checkTokenLimit } from './usage';
import { auth } from './firebase';
import { calculateDeterministicScore } from './scoring';

export interface DealCoachResult {
  whyItWillClose: string;
  objections: string[];
  decisionMaker: string;
  bestAngle: string;
  bestCta: string;
  dealStrength: 'Strong' | 'Moderate' | 'Weak';
  generatedAt: string;
}

async function fetchApi(endpoint: string, body: any) {
  const userId = auth.currentUser?.uid;
  if (userId) {
    await checkTokenLimit(userId).catch(() => {});
  }

  const token = await auth.currentUser?.getIdToken().catch(() => null);

  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function scoreLead(lead: Lead, profile?: SellerProfile | null): Promise<AIAnalysis> {
  try {
    return await fetchApi('analyzeLead', { lead, profile });
  } catch (err: any) {
    console.warn('[AI] Backend API call failed, using deterministic scoring fallback:', err.message);
    const scoreRes = calculateDeterministicScore(lead, profile, lead.research);
    
    return {
      score: scoreRes.overallScore,
      category: scoreRes.category,
      priority: scoreRes.priority,
      reason: scoreRes.reasons.join(' '),
      recommendedAction: `Focus outreach on ${lead.company || lead.fullName} leveraging ${scoreRes.category.toLowerCase()} revenue signals.`,
      analyzedAt: new Date(),
      aiModel: 'Deterministic Revenue Engine (Client Fallback)',
      followUp: {
        objective: 'Establish discovery call',
        messagingAngle: `Value prop alignment for ${lead.industry || 'B2B'}`,
        email: `Subject: Quick question re: ${lead.company || 'your team'}\n\nHi ${lead.fullName.split(' ')[0]},\n\nI noticed ${lead.company || 'your team'} is scaling operations. Given your focus in ${lead.industry || 'the sector'}, wanted to share how we help teams like yours streamline revenue workflows.\n\nWould you be open to a 10-minute chat this week?\n\nBest,`,
        linkedin: `Hi ${lead.fullName.split(' ')[0]}, saw your growth in ${lead.industry || 'tech'}. Would love to share how we help companies like ${lead.company || 'yours'} accelerate pipeline. Open to connecting?`,
        callScript: `OPENER: Hi ${lead.fullName.split(' ')[0]}, calling regarding revenue operations at ${lead.company || 'your company'}.\n\nVALUE PROP: We help teams streamline lead intelligence and eliminate manual research.\n\nCTA: Do you have 2 minutes to see if this aligns with your current priorities?`
      }
    };
  }
}

export async function regenerateOutreach(lead: Lead, profile?: SellerProfile | null): Promise<AIAnalysis['followUp']> {
  try {
    return await fetchApi('regenerateFollowUp', { lead, profile });
  } catch (err: any) {
    console.warn('[AI] Backend API call failed, using outreach fallback:', err.message);
    return {
      objective: 'Schedule intro call',
      messagingAngle: 'Data-driven pipeline growth',
      email: `Subject: ${profile?.companyName || 'ArchRevenue'} x ${lead.company || lead.fullName}\n\nHi ${lead.fullName.split(' ')[0]},\n\nI reached out recently regarding your operations at ${lead.company || 'your organization'}. We help companies in ${lead.industry || 'your industry'} increase sales conversion with AI revenue intelligence.\n\nWorth a brief conversation next Tuesday?\n\nBest,`,
      linkedin: `Hi ${lead.fullName.split(' ')[0]}, following up on my previous note. Would love to share a quick overview tailored for ${lead.company || 'your team'}.`,
      callScript: `OPENER: Hi ${lead.fullName.split(' ')[0]}, following up on my email regarding revenue intelligence.\n\nVALUE PROP: Our clients see 3x faster qualification speeds.\n\nCTA: Should I send over a 2-minute overview video?`
    };
  }
}

export async function generateNotesSummary(notes: Note[]): Promise<string> {
  try {
    return await fetchApi('summarizeNotes', { notes });
  } catch (err: any) {
    if (!notes || notes.length === 0) return 'No notes recorded yet.';
    return notes.map(n => `• [${n.type || 'General'}] ${n.content}`).join('\n');
  }
}

export async function generateTasks(lead: Lead, sellerProfile?: SellerProfile | null): Promise<AITask[]> {
  try {
    return await fetchApi('suggestTasks', { lead, profile: sellerProfile });
  } catch (err: any) {
    return [
      {
        id: crypto.randomUUID(),
        title: `Research tech stack & recent developments for ${lead.company || lead.fullName}`,
        status: 'pending',
        source: 'ai',
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: `Send initial personalized email to ${lead.fullName}`,
        status: 'pending',
        source: 'ai',
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: `Connect with key stakeholders on LinkedIn`,
        status: 'pending',
        source: 'ai',
        createdAt: new Date().toISOString()
      }
    ];
  }
}

export async function generateDealCoach(lead: Lead, sellerProfile?: SellerProfile | null): Promise<DealCoachResult> {
  try {
    return await fetchApi('buildDealCoach', { lead, profile: sellerProfile });
  } catch (err: any) {
    return {
      whyItWillClose: `Strong alignment with ${sellerProfile?.primaryOffer || 'our offer'} based on company profile.`,
      objections: [
        'Budget priority alignment',
        'Implementation timeline'
      ],
      decisionMaker: lead.title || 'Head of Department / Executive Lead',
      bestAngle: `Emphasize ROI and immediate pipeline efficiency for ${lead.company || 'the account'}.`,
      bestCta: 'Offer a risk-free 14-day proof of concept',
      dealStrength: lead.aiAnalysis?.category === 'Hot' ? 'Strong' : 'Moderate',
      generatedAt: new Date().toISOString()
    };
  }
}

export async function generateSingleOutreach(
  type: 'email' | 'linkedin' | 'callScript',
  lead: Lead,
  profile?: SellerProfile | null
): Promise<string> {
  try {
    return await fetchApi('generateSingleOutreach', { type, lead, profile });
  } catch (err: any) {
    if (type === 'email') {
      return `Subject: Quick thought for ${lead.company || lead.fullName}\n\nHi ${lead.fullName.split(' ')[0]},\n\nI was looking into ${lead.company || 'your company'} and wanted to share how we help ${lead.industry || 'similar'} teams optimize revenue operations.\n\nOpen to a brief conversation this week?\n\nBest,`;
    } else if (type === 'linkedin') {
      return `Hi ${lead.fullName.split(' ')[0]}, enjoyed following ${lead.company || 'your team'}'s growth in ${lead.industry || 'the market'}. Would love to connect and share quick insights.`;
    } else {
      return `OPENER: Hi ${lead.fullName.split(' ')[0]}, reaching out from ${profile?.companyName || 'ArchRevenue'}.\n\nVALUE PROP: We streamline lead discovery and revenue prioritization.\n\nCTA: Do you have a moment to discuss?`;
    }
  }
}
