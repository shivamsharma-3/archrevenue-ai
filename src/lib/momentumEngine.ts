/**
 * Arch Operating Model — Momentum Engine
 *
 * Computes the real-time momentum score for a company using the AOM decay table.
 * The score is a function of time — it decays automatically as events age.
 *
 * Law 6 (AOM): Everything decays. Commercial reality is perishable.
 */

import { CommercialEvent, CommercialEventType, CompanyTemperature, MOMENTUM_DECAY } from './types';

// Breakpoints in days for the decay table columns: [0, 30, 90, 180, 365]
const DECAY_BREAKPOINTS = [0, 30, 90, 180, 365];

/**
 * Interpolates the decayed momentum contribution of an event at `daysOld` days.
 */
export function getDecayedContribution(type: CommercialEventType, daysOld: number): number {
  const curve = MOMENTUM_DECAY[type] ?? MOMENTUM_DECAY['GENERAL'];

  if (daysOld <= 0) return curve[0];
  if (daysOld >= 365) return curve[4];

  // Find surrounding breakpoints and interpolate linearly
  for (let i = 0; i < DECAY_BREAKPOINTS.length - 1; i++) {
    const t0 = DECAY_BREAKPOINTS[i];
    const t1 = DECAY_BREAKPOINTS[i + 1];
    if (daysOld >= t0 && daysOld < t1) {
      const v0 = curve[i];
      const v1 = curve[i + 1];
      const ratio = (daysOld - t0) / (t1 - t0);
      return Math.round(v0 + ratio * (v1 - v0));
    }
  }

  return curve[4];
}

/**
 * Computes the total momentum score for a list of events.
 * Events that have expired (past their expiresAt) contribute 0.
 */
export function computeMomentumFromEvents(events: CommercialEvent[]): number {
  const now = Date.now();
  let total = 0;

  for (const event of events) {
    // Expired signals contribute nothing
    const expiry = new Date(event.expiresAt).getTime();
    if (now > expiry) continue;

    const detected = new Date(event.detectedAt).getTime();
    const daysOld = Math.max(0, Math.floor((now - detected) / (1000 * 60 * 60 * 24)));
    total += getDecayedContribution(event.type, daysOld);
  }

  return Math.max(0, total); // floor at 0 (negative risk events can cancel positive ones)
}

/**
 * Converts a momentum score to a Temperature classification.
 * AOM Temperature table (Law 7 + Momentum Engine spec).
 */
export function momentumToTemperature(score: number): CompanyTemperature {
  if (score >= 70) return 'Buying';
  if (score >= 45) return 'Hot';
  if (score >= 25) return 'Heating';
  if (score >= 10) return 'Warm';
  return 'Cold';
}

/**
 * Returns a human-readable explanation of what's driving the momentum.
 * Used by the Revenue Briefing as a sub-heading.
 */
export function summariseMomentumDrivers(events: CommercialEvent[]): string {
  const now = Date.now();
  const activeEvents = events.filter(e => new Date(e.expiresAt).getTime() > now);
  if (activeEvents.length === 0) return 'No active commercial signals.';

  // Sort by impact descending
  const sorted = [...activeEvents].sort((a, b) => b.revenueImpactScore - a.revenueImpactScore);
  const top3 = sorted.slice(0, 3).map(e => e.description);
  return top3.join(' · ');
}
