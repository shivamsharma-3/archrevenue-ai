/**
 * Arch Operating Model — Opportunity Engine
 *
 * Computes a fully deterministic, explainable Revenue Opportunity score.
 * NO LLM involvement. Every number is traceable to a rule.
 *
 * Scoring formula (AOM Stage 9):
 *   ICP Match Weight      0–30 pts
 *   Momentum Score        0–40 pts
 *   Signal Strength       0–15 pts
 *   Timing Urgency        0–5  pts
 *   Relationship Bonus    0–10 pts
 *   ──────────────────────────────
 *   Total                 0–100 pts
 *
 * Law 4 (AOM): AI explains; it does not decide.
 */

import { CommercialEvent, CompanyIntelligenceRecord, RevenueOpportunity, SellerProfile, BuyingWindow, MissionBriefing, CompanyTemperature } from './types';
import { computeMomentumFromEvents, momentumToTemperature, getDecayedContribution } from './momentumEngine';
import { getActiveEvents } from './signalEngine';
import { isActionFatigued } from './commercialMemory';

// ─── ICP Match ─────────────────────────────────────────────────────────────────

function computeIcpMatch(record: CompanyIntelligenceRecord, profile: SellerProfile | null): number {
  if (!profile) return 10; // neutral — no profile configured

  let score = 0;

  // Industry match (max 12 pts)
  if (profile.targetIndustry) {
    const industry = (record.facts?.industry?.value || record.industry || '').toLowerCase();
    const target = profile.targetIndustry.toLowerCase();
    if (industry && target && (industry.includes(target) || target.includes(industry))) {
      score += 12;
    } else if (industry && target) {
      // Partial industry adjacency bonus
      const adjacentPairs = [
        ['fintech', 'finance'], ['saas', 'software'], ['ecommerce', 'retail'],
        ['health', 'medtech'], ['hr', 'people ops'],
      ];
      const adjacent = adjacentPairs.some(
        ([a, b]) => (industry.includes(a) && target.includes(b)) ||
                    (industry.includes(b) && target.includes(a))
      );
      if (adjacent) score += 5;
    }
  }

  // Company size match (max 10 pts)
  if (profile.targetCompanySize) {
    const employeesStr = record.facts?.employees?.value || '0';
    const employees = parseInt(employeesStr, 10) || 0;
    const sizeMap: Record<string, [number, number]> = {
      '1-10':      [1,   10],
      '11-50':     [11,  50],
      '51-200':    [51,  200],
      '201-1000':  [201, 1000],
      '1000+':     [1001, Infinity],
    };
    const [min, max] = sizeMap[profile.targetCompanySize] ?? [0, Infinity];
    if (employees >= min && employees <= max) score += 10;
    // Adjacent range bonus
    else if (employees >= min * 0.5 && employees <= max * 2) score += 4;
  }

  // Geography match (max 8 pts)
  if (profile.targetGeography) {
    const hq = (record.facts?.headquarters?.value || '').toLowerCase();
    const geo = profile.targetGeography.toLowerCase();
    if (hq && geo && (hq.includes(geo) || geo.includes(hq))) score += 8;
  }

  return Math.min(30, score);
}

// ─── Signal Strength ──────────────────────────────────────────────────────────

function computeSignalStrength(activeEvents: CommercialEvent[]): number {
  if (activeEvents.length === 0) return 0;

  // Reward diversity of signal types
  const uniqueTypes = new Set(activeEvents.map(e => e.type)).size;
  const diversityBonus = Math.min(5, uniqueTypes * 2);

  // Reward high-confidence events
  const avgConfidence = activeEvents.reduce((s, e) => s + e.confidence, 0) / activeEvents.length;
  const confidenceScore = Math.round((avgConfidence / 100) * 8);

  // Reward recent events (within 7 days)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recencyBonus = activeEvents.some(e => new Date(e.detectedAt).getTime() > weekAgo) ? 2 : 0;

  return Math.min(15, diversityBonus + confidenceScore + recencyBonus);
}

// ─── Timing Urgency ───────────────────────────────────────────────────────────

function computeTimingUrgency(activeEvents: CommercialEvent[]): number {
  if (activeEvents.length === 0) return 0;

  // Find the soonest-expiring high-impact event
  const sortedByExpiry = [...activeEvents]
    .filter(e => e.revenueImpactScore >= 60)
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());

  if (sortedByExpiry.length === 0) return 1;

  const daysUntilExpiry = Math.max(0,
    Math.floor((new Date(sortedByExpiry[0].expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  if (daysUntilExpiry <= 7)  return 5;  // Critical window
  if (daysUntilExpiry <= 14) return 4;
  if (daysUntilExpiry <= 30) return 3;
  if (daysUntilExpiry <= 60) return 2;
  return 1;
}

// ─── Four-Question Generator ──────────────────────────────────────────────────

function generateFourAnswers(
  record: CompanyIntelligenceRecord,
  activeEvents: CommercialEvent[],
  momentumScore: number,
  userId: string = 'mock_user_id' // In a real app, this comes from auth context
): { whatChanged: string; whyItMatters: string; whatToDo: string; whyNow: string } {
  const topEvent = [...activeEvents].sort((a, b) => b.revenueImpactScore - a.revenueImpactScore)[0];
  const companyName = record.canonicalName || record.domain;

  const whatChanged = topEvent
    ? topEvent.description
    : `No new commercial events detected for ${companyName}.`;

  const whyItMatters = activeEvents.length > 1
    ? `${companyName} has ${activeEvents.length} concurrent commercial signals (e.g., ${activeEvents.slice(0, 2).map(e => e.type.replace(/_/g, ' ').toLowerCase()).join(' and ')}), indicating active growth investment.`
    : topEvent
      ? `${companyName} is showing a high-impact commercial signal: ${topEvent.type.replace(/_/g, ' ').toLowerCase()}. This type of event historically precedes increased technology and vendor spend.`
      : `Limited commercial activity detected.`;

  const hiring = activeEvents.filter(e => ['SDR_HIRING', 'AE_HIRING', 'VP_SALES_HIRED', 'HEADCOUNT_EXPANSION'].includes(e.type));
  const hasHiring = hiring.length > 0;
  const hasFunding = activeEvents.some(e => e.type === 'FUNDING_ROUND');

  let whatToDo = 'Reach out with a personalized introduction referencing their recent activity.';
  
  // Base recommendations
  if (hasHiring && hasFunding) {
    whatToDo = `Contact the VP of Revenue or Head of Sales. Reference their hiring expansion and recent funding — they are building their revenue stack now.`;
  } else if (hasHiring) {
    whatToDo = `Contact the VP of Sales or Head of Revenue. They are actively scaling their sales team — this is the ideal window to discuss tools and infrastructure.`;
  } else if (hasFunding) {
    whatToDo = `Contact the CFO or VP of Finance. Reference the recent funding round and position your offering as part of their growth infrastructure.`;
  }

  // Commercial Memory check
  if (isActionFatigued(whatToDo, record.domain, userId)) {
    // Generate alternative
    whatToDo = `Previous recommendation ignored. Alternative contact found: Contact the RevOps Director to discuss operational efficiency during their expansion.`;
  }

  // Days until the top event expires
  const daysRemaining = topEvent
    ? Math.max(0, Math.floor((new Date(topEvent.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const whyNow = topEvent && daysRemaining > 0
    ? `The primary signal (${topEvent.description}) has ${daysRemaining} days of commercial relevance remaining. Momentum score is ${momentumScore} — acting now captures the peak of this opportunity window.`
    : `Current momentum is ${momentumScore}. Engage before signals decay further.`;

  return { whatChanged, whyItMatters, whatToDo, whyNow };
}

// ─── Commercial Narrative Detection ───────────────────────────────────────────

function detectCommercialNarrative(activeEvents: CommercialEvent[]): string | undefined {
  const types = activeEvents.map(e => e.type);
  const has = (t: string) => types.includes(t as any);

  if (has('FUNDING_ROUND') && (has('SDR_HIRING') || has('AE_HIRING')) && has('VP_SALES_HIRED')) {
    return 'Enterprise Sales Build';
  }
  if ((has('TECH_MIGRATION') || has('TECH_ADOPTION')) && has('PRICING_CHANGE') && has('PRODUCT_LAUNCH')) {
    return 'GTM Transformation';
  }
  if (has('MARKET_EXPANSION') && (has('HEADCOUNT_EXPANSION') || has('AE_HIRING'))) {
    return 'Geographic Expansion';
  }
  if ((has('C_SUITE_CHANGE') || has('FOUNDER_DEPARTURE')) && has('LAYOFF')) {
    return 'Organisational Instability';
  }

  return undefined;
}

// ─── Intelligence Quality Score ───────────────────────────────────────────────

function computeIntelligenceQuality(record: CompanyIntelligenceRecord, activeEvents: CommercialEvent[]): number {
  return record.intelligenceQuality?.overall ?? 85;
}

// ─── Buying Window ────────────────────────────────────────────────────────────

function computeBuyingWindow(events: CommercialEvent[]): BuyingWindow {
  if (events.length === 0) {
    return {
      openedAt: new Date().toISOString(),
      peakAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      daysRemaining: 0,
      status: 'Closed'
    };
  }

  // Find the event with the highest revenue impact
  const topEvent = [...events].sort((a, b) => b.revenueImpactScore - a.revenueImpactScore)[0];
  
  const openedAt = topEvent.detectedAt;
  const expiresAt = topEvent.expiresAt;
  
  // Estimate peak based on decay: usually Day 0 to Day 14
  const detected = new Date(topEvent.detectedAt).getTime();
  const peakDate = new Date(detected + 7 * 24 * 60 * 60 * 1000); // Mock peak at Day 7
  
  const daysRemaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  
  let status: BuyingWindow['status'] = 'Opening';
  const now = Date.now();
  if (now > peakDate.getTime() && daysRemaining > 0) status = 'Closing';
  if (now >= detected && now <= peakDate.getTime()) status = 'Peak';
  if (daysRemaining === 0) status = 'Closed';

  return {
    openedAt,
    peakAt: peakDate.toISOString(),
    expiresAt,
    daysRemaining,
    status
  };
}

// ─── Main Opportunity Engine ──────────────────────────────────────────────────

export function computeRevenueOpportunity(
  record: CompanyIntelligenceRecord,
  events: CommercialEvent[],
  profile: SellerProfile | null = null,
): RevenueOpportunity {
  const activeEvents = getActiveEvents(events);
  const momentumScore = computeMomentumFromEvents(activeEvents);
  const temperature = momentumToTemperature(momentumScore);

  // Score components
  const icpMatch       = computeIcpMatch(record, profile);
  const momentumPts    = Math.min(40, Math.round((momentumScore / 100) * 40));
  const signalStrength = computeSignalStrength(activeEvents);
  const timingUrgency  = computeTimingUrgency(activeEvents);
  const relationshipBonus = 0; // Reserved for Phase 2 Relationship Engine

  const commercialNarrative = detectCommercialNarrative(activeEvents);
  const narrativeBonus = commercialNarrative ? 15 : 0;
  
  // User Learning Factor (mocking for now)
  const personalizationAdjustment = profile ? 5 : 0; 
  // Repeated Recommendation Penalty (mocking for now)
  const repeatedPenalty = 0;

  let opportunityScore = icpMatch + momentumPts + signalStrength + timingUrgency + relationshipBonus + narrativeBonus + personalizationAdjustment - repeatedPenalty;
  opportunityScore = Math.min(100, Math.max(0, opportunityScore));

  const { whatChanged, whyItMatters, whatToDo, whyNow } = generateFourAnswers(record, activeEvents, momentumScore);
  const buyingWindow = computeBuyingWindow(activeEvents);
  const intelligenceQualityScore = computeIntelligenceQuality(record, activeEvents);

  const avgConfidence = activeEvents.length > 0
    ? Math.round(activeEvents.reduce((s, e) => s + e.confidence, 0) / activeEvents.length)
    : 50;

  return {
    companyDomain: record.domain,
    companyName: record.canonicalName,
    opportunityScore,
    momentum: momentumScore,
    triggeringEvents: activeEvents,
    buyingWindow,
    commercialNarrative,
    whatChanged,
    whyItMatters,
    whatToDo,
    whyNow,
    scoreBreakdown: {
      icpMatch,
      momentumScore: momentumPts,
      signalStrength,
      timingUrgency,
      relationshipBonus,
    },
    confidence: avgConfidence,
    intelligenceQualityScore,
    personalizationAdjustment,
  };
}

// ─── Mission Briefing Builder ─────────────────────────────────────────────────

export interface LeadIntelligenceSummary {
  record: CompanyIntelligenceRecord;
  events: CommercialEvent[];
  leadName?: string;
}

export function buildMissionBriefing(
  leads: LeadIntelligenceSummary[],
  userName: string,
  profile: SellerProfile | null = null,
): MissionBriefing {
  const now = Date.now();
  const opportunities = leads
    .map(({ record, events }) => computeRevenueOpportunity(record, events, profile))
    .filter(o => o.opportunityScore > 0)
    .sort((a, b) => b.opportunityScore - a.opportunityScore);

  // Consider it "Hot" if the score is above a threshold, e.g., 50. 
  const hotOpportunities = opportunities.filter(o => o.opportunityScore >= 50);

  // Watch list based on momentum (e.g. 10 to 44)
  const watchList = opportunities
    .filter(o => o.opportunityScore >= 15 && o.opportunityScore < 50)
    .map(o => ({
      companyDomain: o.companyDomain,
      companyName: o.companyName,
      momentum: o.momentum,
      temperature: momentumToTemperature(o.momentum),
      reason: o.whatChanged,
    }));

  const coolingOpportunities = leads
    .filter(({ events }) => getActiveEvents(events).length === 0)
    .map(({ record, events }) => {
      const lastEvent = [...events].sort((a, b) =>
        new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      )[0];
      const daysSince = lastEvent
        ? Math.floor((now - new Date(lastEvent.detectedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      let reason = 'No new commercial events detected.';
      if (lastEvent) {
        reason = `Previous event '${lastEvent.type}' expired.`;
      }

      return { companyDomain: record.domain, companyName: record.canonicalName, daysSinceLastEvent: daysSince, reason };
    })
    .filter(c => c.daysSinceLastEvent < 90) // Only show recently cooled
    .sort((a, b) => a.daysSinceLastEvent - b.daysSinceLastEvent);

  // Estimated revenue: rough heuristic, replace with outcome-data model later
  const estimatedRevenueUnlocked = hotOpportunities.length * 8000 + watchList.length * 3500;

  const summary = hotOpportunities.length > 0
    ? `${hotOpportunities.length} opportunit${hotOpportunities.length === 1 ? 'y' : 'ies'} heated up. Estimated revenue potential: $${(estimatedRevenueUnlocked / 1000).toFixed(0)}K.`
    : 'No new hot opportunities today. Monitor watch list for emerging signals.';

  return {
    generatedAt: new Date().toISOString(),
    userName,
    hotOpportunities,
    watchList,
    coolingOpportunities,
    estimatedRevenueUnlocked,
    summary,
  };
}
