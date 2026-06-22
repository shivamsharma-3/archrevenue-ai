import { describe, it, expect, vi } from 'vitest';
import { generateDiffEvents } from './diffEngine';
import { Fact } from './types';

describe('Diff Engine', () => {
  const mockDomain = 'example.com';
  
  const createFact = (category: Fact['category'], value: string): Fact => ({
    id: crypto.randomUUID(),
    companyDomain: mockDomain,
    category,
    value,
    confidence: 100,
    evidenceIds: ['ev-1'],
    confirmationCount: 1,
    firstSeenAt: new Date().toISOString(),
    lastConfirmedAt: new Date().toISOString(),
    maturityLevel: 'Established',
    freshness: '0 hours ago',
    provenance: ['https://example.com']
  });

  it('detects HEADCOUNT_EXPANSION when employees grow by 10% or more', () => {
    const historical = [createFact('Employees', '100')];
    const current = [createFact('Employees', '110')];

    const events = generateDiffEvents(mockDomain, historical, current);
    
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('HEADCOUNT_EXPANSION');
    expect(events[0].revenueImpactScore).toBe(65);
    expect(events[0].description).toContain('100 -> 110');
  });

  it('ignores HEADCOUNT_EXPANSION when growth is under 10%', () => {
    const historical = [createFact('Employees', '100')];
    const current = [createFact('Employees', '105')];

    const events = generateDiffEvents(mockDomain, historical, current);
    
    expect(events).toHaveLength(0);
  });

  it('detects LAYOFF when headcount shrinks by 10% or more', () => {
    const historical = [createFact('Employees', '100')];
    const current = [createFact('Employees', '85')];

    const events = generateDiffEvents(mockDomain, historical, current);
    
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('LAYOFF');
    expect(events[0].revenueImpactScore).toBe(-15);
  });

  it('detects FUNDING_ROUND when funding stage changes to a known value', () => {
    const historical = [createFact('FundingStage', 'Series A')];
    const current = [createFact('FundingStage', 'Series B')];

    const events = generateDiffEvents(mockDomain, historical, current);
    
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('FUNDING_ROUND');
    expect(events[0].description).toContain('Series B');
  });

  it('ignores funding change if it is Unknown', () => {
    const historical = [createFact('FundingStage', 'Series A')];
    const current = [createFact('FundingStage', 'Unknown')];

    const events = generateDiffEvents(mockDomain, historical, current);
    
    expect(events).toHaveLength(0);
  });

  it('detects TECH_ADOPTION for new technologies', () => {
    const historical = [createFact('Technology', 'React')];
    const current = [createFact('Technology', 'React'), createFact('Technology', 'TypeScript')];

    const events = generateDiffEvents(mockDomain, historical, current);
    
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('TECH_ADOPTION');
    expect(events[0].description).toContain('TypeScript');
  });
});
