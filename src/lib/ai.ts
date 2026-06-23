import { Lead, AIAnalysis, CompanyKnowledge, ScoringEvidence, SellerProfile, Note, AITask, TaskStatus } from './types';
import { checkTokenLimit } from './usage';
import { auth } from './firebase';

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
    await checkTokenLimit(userId);
  }

  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
  return fetchApi('analyzeLead', { lead, profile });
}

export async function regenerateOutreach(lead: Lead, profile?: SellerProfile | null): Promise<AIAnalysis['followUp']> {
  return fetchApi('regenerateFollowUp', { lead, profile });
}

export async function generateNotesSummary(notes: Note[]): Promise<string> {
  return fetchApi('summarizeNotes', { notes });
}

export async function generateTasks(lead: Lead, sellerProfile?: SellerProfile | null): Promise<AITask[]> {
  return fetchApi('suggestTasks', { lead, profile: sellerProfile });
}

export async function generateDealCoach(lead: Lead, sellerProfile?: SellerProfile | null): Promise<DealCoachResult> {
  return fetchApi('buildDealCoach', { lead, profile: sellerProfile });
}

export async function generateSingleOutreach(
  type: 'email' | 'linkedin' | 'callScript',
  lead: Lead,
  profile?: SellerProfile | null
): Promise<string> {
  return fetchApi('generateSingleOutreach', { type, lead, profile });
}
