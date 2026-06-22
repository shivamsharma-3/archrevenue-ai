import { CompanyIntelligenceRecord, Evidence, Fact } from './types';
import { normalizeDomain } from './memory';

/**
 * Arch Operating Model — Evidence Layer
 *
 * Law 2: The system explains why it believes something.
 * This engine tracks the exact source and collection time of raw data.
 */

// Simple in-memory map for evidence tracking. Storage optimization deferred per ADR.
const evidenceStore = new Map<string, Evidence[]>();

export function saveEvidence(domain: string, evidence: Omit<Evidence, 'id'>): Evidence {
  const cleanDomain = normalizeDomain(domain);
  const id = crypto.randomUUID();
  const newEvidence = { ...evidence, id };
  
  if (!evidenceStore.has(cleanDomain)) {
    evidenceStore.set(cleanDomain, []);
  }
  evidenceStore.get(cleanDomain)!.push(newEvidence);
  
  return newEvidence;
}

export function getEvidenceForDomain(domain: string): Evidence[] {
  const cleanDomain = normalizeDomain(domain);
  return evidenceStore.get(cleanDomain) || [];
}

/**
 * Categorises evidence to determine freshness per category.
 */
function getCategoryFromEvidence(ev: Evidence): keyof CompanyIntelligenceRecord['intelligenceQuality']['freshness'] {
  const s = ev.source.toLowerCase();
  if (s.includes('careers') || s.includes('hiring-data') || s.includes('greenhouse') || s.includes('lever') || s.includes('workable')) return 'hiring';
  if (s.includes('linkedin') || s.includes('crunchbase') || s.includes('leadership')) return 'leadership';
  if (s.includes('crunchbase') || s.includes('pitchbook') || s.includes('funding')) return 'funding';
  if (s.includes('pricing')) return 'pricing';
  return 'website';
}

/**
 * Computes the freshness profile based on the most recent evidence per category.
 */
export function computeIntelligenceFreshness(domain: string): CompanyIntelligenceRecord['intelligenceQuality']['freshness'] {
  const evidenceList = getEvidenceForDomain(domain);
  const now = Date.now();

  const freshness = {
    website: 'No data',
    hiring: 'No data',
    leadership: 'No data',
    funding: 'No data',
    pricing: 'No data'
  };

  const getRelativeTime = (isoString: string) => {
    const diffHours = (now - new Date(isoString).getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  // Group by category and find newest
  const newestPerCategory = new Map<string, string>();
  for (const ev of evidenceList) {
    const cat = getCategoryFromEvidence(ev);
    const existing = newestPerCategory.get(cat);
    if (!existing || new Date(ev.collectedAt).getTime() > new Date(existing).getTime()) {
      newestPerCategory.set(cat, ev.collectedAt);
    }
  }

  // Formatting
  if (newestPerCategory.has('website')) freshness.website = getRelativeTime(newestPerCategory.get('website')!);
  if (newestPerCategory.has('hiring')) freshness.hiring = getRelativeTime(newestPerCategory.get('hiring')!);
  if (newestPerCategory.has('leadership')) freshness.leadership = getRelativeTime(newestPerCategory.get('leadership')!);
  if (newestPerCategory.has('funding')) freshness.funding = getRelativeTime(newestPerCategory.get('funding')!);
  if (newestPerCategory.has('pricing')) freshness.pricing = getRelativeTime(newestPerCategory.get('pricing')!);

  return freshness;
}
