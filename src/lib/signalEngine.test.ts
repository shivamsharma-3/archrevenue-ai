import { describe, it, expect } from 'vitest';
import { computeActiveSignals } from './signalEngine';
import { CommercialEvent } from './types';

describe('Signal Engine', () => {
  const createTestEvent = (detectedAt: string, expiresAt: string, type: CommercialEvent['type'] = 'FUNDING_ROUND'): CommercialEvent => ({
    id: crypto.randomUUID(),
    companyDomain: 'example.com',
    type,
    description: 'Test Event',
    revenueImpactScore: 50,
    confidence: 100,
    detectedAt,
    expiresAt,
  });

  it('filters out expired events', () => {
    const nowMs = Date.now();
    const past = new Date(nowMs - 10000).toISOString();
    const future = new Date(nowMs + 10000).toISOString();

    const events = [
      createTestEvent(past, past), // Expired
      createTestEvent(past, future) // Active
    ];

    const signals = computeActiveSignals(events, nowMs);
    
    expect(signals).toHaveLength(1);
    expect(signals[0].expiresAt).toBe(future);
  });

  it('decays momentum correctly for a new event (Day 0)', () => {
    const nowMs = Date.now();
    const future = new Date(nowMs + 100000).toISOString();
    
    // FUNDING_ROUND Day 0 is 40
    const events = [createTestEvent(new Date(nowMs).toISOString(), future, 'FUNDING_ROUND')];
    
    const signals = computeActiveSignals(events, nowMs);
    
    expect(signals[0].currentMomentumContribution).toBe(40);
  });

  it('decays momentum correctly after 30 days', () => {
    const nowMs = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const detectedAt = new Date(nowMs - thirtyDaysMs).toISOString();
    const future = new Date(nowMs + 100000).toISOString();
    
    // FUNDING_ROUND Day 30 is 35
    const events = [createTestEvent(detectedAt, future, 'FUNDING_ROUND')];
    
    const signals = computeActiveSignals(events, nowMs);
    
    expect(signals[0].currentMomentumContribution).toBe(35);
  });

  it('decays momentum using linear interpolation at Day 15', () => {
    const nowMs = Date.now();
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
    const detectedAt = new Date(nowMs - fifteenDaysMs).toISOString();
    const future = new Date(nowMs + 100000).toISOString();
    
    // FUNDING_ROUND Day 0 is 40, Day 30 is 35. Day 15 should be ~37.5 -> rounded to 38
    const events = [createTestEvent(detectedAt, future, 'FUNDING_ROUND')];
    
    const signals = computeActiveSignals(events, nowMs);
    
    expect(signals[0].currentMomentumContribution).toBe(38);
  });
});
