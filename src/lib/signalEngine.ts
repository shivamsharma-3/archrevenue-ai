import { CommercialEvent, ActiveSignal, MOMENTUM_DECAY } from './types';

/**
 * Arch Operating Model — Signal Engine
 * 
 * Manages the lifecycle of Commercial Events, converting them into Active Signals 
 * with mathematically decayed momentum contributions.
 */

/**
 * Helper to interpolate momentum decay between defined day intervals: [0, 30, 90, 180, 365]
 */
function calculateDecayedMomentum(type: CommercialEvent['type'], daysSinceDetection: number): number {
  const decayTable = MOMENTUM_DECAY[type];
  if (!decayTable) return 0;

  const [day0, day30, day90, day180, day365] = decayTable;

  if (daysSinceDetection <= 0) return day0;
  if (daysSinceDetection >= 365) return day365;

  // Linear interpolation between the brackets
  if (daysSinceDetection < 30) {
    const progress = daysSinceDetection / 30;
    return day0 - (progress * (day0 - day30));
  }
  if (daysSinceDetection < 90) {
    const progress = (daysSinceDetection - 30) / 60;
    return day30 - (progress * (day30 - day90));
  }
  if (daysSinceDetection < 180) {
    const progress = (daysSinceDetection - 90) / 90;
    return day90 - (progress * (day90 - day180));
  }
  
  const progress = (daysSinceDetection - 180) / 185;
  return day180 - (progress * (day180 - day365));
}

export function computeActiveSignals(events: CommercialEvent[], evaluationDateMs: number = Date.now()): ActiveSignal[] {
  const activeSignals: ActiveSignal[] = [];

  for (const event of events) {
    const expiresAtMs = new Date(event.expiresAt).getTime();
    if (expiresAtMs > evaluationDateMs) {
      const detectedAtMs = new Date(event.detectedAt).getTime();
      const daysSinceDetection = Math.max(0, (evaluationDateMs - detectedAtMs) / (1000 * 60 * 60 * 24));
      
      const currentMomentum = calculateDecayedMomentum(event.type, daysSinceDetection);

      activeSignals.push({
        eventId: event.id!,
        type: event.type,
        description: event.description,
        activatedAt: event.detectedAt,
        expiresAt: event.expiresAt,
        currentMomentumContribution: Math.round(currentMomentum)
      });
    }
  }

  return activeSignals;
}

export function getActiveEvents(events: CommercialEvent[], evaluationDateMs: number = Date.now()): CommercialEvent[] {
  return events.filter(event => new Date(event.expiresAt).getTime() > evaluationDateMs);
}

