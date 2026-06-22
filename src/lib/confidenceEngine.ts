import { Fact, Evidence } from './types';

function computeFreshness(isoString: string): string {
  const now = Date.now();
  const diffHours = (now - new Date(isoString).getTime()) / (1000 * 60 * 60);
  if (diffHours < 24) return `${Math.floor(Math.max(0, diffHours))} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

/**
 * Arch Operating Model — Confidence Engine
 *
 * Evolves Fact confidence from Observed -> Corroborated -> Established based on sources.
 */

export function evolveFactConfidence(fact: Fact, newEvidence: Evidence): Fact {
  // Prevent duplicate evidence attachment
  if (fact.evidenceIds.includes(newEvidence.id!)) {
    return fact;
  }

  const updatedFact = { ...fact, provenance: [...fact.provenance] };
  updatedFact.evidenceIds = [...fact.evidenceIds, newEvidence.id!];
  updatedFact.confirmationCount += 1;
  updatedFact.lastConfirmedAt = newEvidence.collectedAt;
  updatedFact.freshness = computeFreshness(newEvidence.collectedAt);
  if (!updatedFact.provenance.includes(newEvidence.source)) {
    updatedFact.provenance.push(newEvidence.source);
  }

  const count = updatedFact.confirmationCount;
  
  if (count === 1) {
    updatedFact.maturityLevel = 'Observed';
    updatedFact.confidence = Math.max(updatedFact.confidence, newEvidence.confidence);
  } else if (count >= 2 && count <= 3) {
    updatedFact.maturityLevel = 'Corroborated';
    updatedFact.confidence = Math.min(updatedFact.confidence + (newEvidence.confidence * 0.3), 85); // Boost up to 85%
  } else if (count >= 4) {
    updatedFact.maturityLevel = 'Established';
    updatedFact.confidence = 98; // 98% established truth
  }

  return updatedFact;
}

/**
 * Convenience method to create a fresh Fact from a single piece of evidence.
 */
export function createObservedFact(
  domain: string,
  category: Fact['category'],
  value: string,
  evidence: Evidence
): Fact {
  return {
    id: crypto.randomUUID(),
    companyDomain: domain,
    category,
    value,
    confidence: evidence.confidence, // Start with the raw extraction confidence
    evidenceIds: [evidence.id!],
    confirmationCount: 1,
    firstSeenAt: evidence.collectedAt,
    lastConfirmedAt: evidence.collectedAt,
    maturityLevel: 'Observed',
    freshness: computeFreshness(evidence.collectedAt),
    provenance: [evidence.source]
  };
}
