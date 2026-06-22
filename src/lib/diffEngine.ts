import { Fact, CommercialEvent, CommercialEventType, SIGNAL_LIFETIME_DAYS } from './types';

/**
 * Arch Operating Model — Diff Engine
 * 
 * Deterministically compares historical facts against current facts to generate 
 * Commercial Events. No AI inference is used here; only strict logic.
 */
export function generateDiffEvents(
  domain: string,
  historicalFacts: Fact[],
  currentFacts: Fact[]
): CommercialEvent[] {
  const events: CommercialEvent[] = [];
  const detectedAt = new Date().toISOString();

  // Helper to find a single fact by category
  const getFact = (facts: Fact[], category: Fact['category']) => facts.find(f => f.category === category);

  // Helper to create a fully formed event
  const createEvent = (type: CommercialEventType, desc: string, impact: number, conf: number, evidenceIds: string[] = []): CommercialEvent => {
    const ttlDays = SIGNAL_LIFETIME_DAYS[type] || 30;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
    return {
      id: crypto.randomUUID(),
      companyDomain: domain,
      type,
      description: desc,
      revenueImpactScore: impact,
      confidence: conf,
      detectedAt,
      expiresAt,
      evidenceIds
    };
  };

  // 1. Diff Headcount (Threshold: +/- 10%)
  const oldEmployees = getFact(historicalFacts, 'Employees');
  const newEmployees = getFact(currentFacts, 'Employees');
  
  if (oldEmployees && newEmployees && oldEmployees.value !== '0' && newEmployees.value !== '0' && oldEmployees.value !== newEmployees.value) {
    const oldVal = parseInt(oldEmployees.value.replace(/,/g, ''), 10);
    const newVal = parseInt(newEmployees.value.replace(/,/g, ''), 10);
    
    if (!isNaN(oldVal) && !isNaN(newVal) && oldVal > 0) {
      const growthPct = ((newVal - oldVal) / oldVal) * 100;
      if (growthPct >= 10) {
        events.push(createEvent('HEADCOUNT_EXPANSION', `Headcount grew by ${Math.round(growthPct)}% (${oldVal} -> ${newVal})`, 65, newEmployees.confidence, newEmployees.evidenceIds));
      } else if (growthPct <= -10) {
        events.push(createEvent('LAYOFF', `Headcount shrank by ${Math.round(Math.abs(growthPct))}% (${oldVal} -> ${newVal})`, -15, newEmployees.confidence, newEmployees.evidenceIds));
      }
    }
  }

  // 2. Diff Funding Stage
  const oldFunding = getFact(historicalFacts, 'FundingStage');
  const newFunding = getFact(currentFacts, 'FundingStage');

  if (newFunding && newFunding.value !== 'Unknown' && newFunding.value !== oldFunding?.value) {
    events.push(createEvent('FUNDING_ROUND', `Raised new funding: ${newFunding.value}`, 85, newFunding.confidence, newFunding.evidenceIds));
  }

  // 3. Diff Technologies
  const oldTechs = historicalFacts.filter(f => f.category === 'Technology').map(f => f.value);
  const newTechs = currentFacts.filter(f => f.category === 'Technology');

  for (const newTech of newTechs) {
    if (!oldTechs.includes(newTech.value)) {
      events.push(createEvent('TECH_ADOPTION', `Detected new technology: ${newTech.value}`, 40, newTech.confidence, newTech.evidenceIds));
    }
  }

  return events;
}
