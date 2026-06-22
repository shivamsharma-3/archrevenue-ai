import { CommercialMemory } from './types';
import { normalizeDomain } from './memory';

/**
 * Arch Operating Model — Commercial Memory
 *
 * Tracks user interactions with AI recommendations to prevent the system
 * from repeatedly suggesting the same ignored actions.
 */

// Simple in-memory mock for now. In production, this is a Firestore subcollection under the Lead.
const memoryStore = new Map<string, CommercialMemory[]>();

export function logRecommendation(
  domain: string,
  userId: string,
  action: string,
  triggeringEventIds: string[]
): CommercialMemory {
  const cleanDomain = normalizeDomain(domain);
  const key = `${userId}_${cleanDomain}`;
  
  const newMemory: CommercialMemory = {
    id: crypto.randomUUID(),
    companyDomain: cleanDomain,
    userId,
    recommendedAction: action,
    recommendedAt: new Date().toISOString(),
    userResponse: 'pending', // Defaults to pending until user ignores or acts
    outcome: 'pending',
    triggeringEventIds
  };
  
  if (!memoryStore.has(key)) {
    memoryStore.set(key, []);
  }
  memoryStore.get(key)!.push(newMemory);
  
  return newMemory;
}

export function updateMemoryResponse(memoryId: string, response: CommercialMemory['userResponse']) {
  for (const memories of memoryStore.values()) {
    const memory = memories.find(m => m.id === memoryId);
    if (memory) {
      memory.userResponse = response;
      if (response === 'ignored') {
        memory.outcome = 'no_response';
      }
      return memory;
    }
  }
  return null;
}

export function getIgnoredRecommendations(domain: string, userId: string): string[] {
  const cleanDomain = normalizeDomain(domain);
  const key = `${userId}_${cleanDomain}`;
  const memories = memoryStore.get(key) || [];
  
  // Treat 'pending' older than 3 days as implicitly ignored, plus explicitly ignored
  const now = Date.now();
  return memories
    .filter(m => {
      const isExplicitlyIgnored = m.userResponse === 'ignored';
      const isImplicitlyIgnored = m.userResponse === 'pending' && (now - new Date(m.recommendedAt).getTime()) > 3 * 24 * 60 * 60 * 1000;
      return isExplicitlyIgnored || isImplicitlyIgnored;
    })
    .map(m => m.recommendedAction);
}

/**
 * Checks if a proposed action is too similar to an ignored one.
 */
export function isActionFatigued(proposedAction: string, domain: string, userId: string): boolean {
  const ignored = getIgnoredRecommendations(domain, userId);
  
  // Basic heuristic: if the exact string or a highly similar string exists in ignored, it's fatigued.
  // In reality, this would use embeddings or an LLM check.
  const p = proposedAction.toLowerCase();
  return ignored.some(i => {
    const ignoredText = i.toLowerCase();
    // Check if it's hitting the same persona (e.g. "VP of Sales")
    if (p.includes('vp of sales') && ignoredText.includes('vp of sales')) return true;
    if (p.includes('cfo') && ignoredText.includes('cfo')) return true;
    return false;
  });
}
