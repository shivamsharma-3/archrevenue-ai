import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { CompanyIntelligenceRecord, CommercialEvent, CompanyTemperature, Fact } from './types';
import { normalizeDomain } from './memory';
import { researchCompany } from './research';
import { saveEvidence, computeIntelligenceFreshness } from './evidenceEngine';
import { createObservedFact } from './confidenceEngine';
import { generateDiffEvents } from './diffEngine';
import { computeActiveSignals } from './signalEngine';

// In-memory event store per ADR (deferred storage optimization)
const eventStore = new Map<string, CommercialEvent[]>();

export function getEventsForDomain(domain: string): CommercialEvent[] {
  return eventStore.get(normalizeDomain(domain)) || [];
}

// Stub for Milestone 2: computeMomentum
export async function computeMomentum(domain: string): Promise<{ score: number, timeframe: 'Last 30 days' }> {
  const events = getEventsForDomain(domain);
  const activeSignals = computeActiveSignals(events);
  const score = activeSignals.reduce((sum, sig) => sum + sig.currentMomentumContribution, 0);
  return { score, timeframe: 'Last 30 days' };
}

// Helper to determine Temperature based on Momentum
export function computeTemperature(momentumScore: number, existingTemperature: CompanyTemperature): CompanyTemperature {
  if (momentumScore >= 25) return 'Hot';
  if (momentumScore >= 15) return 'Heating';
  if (momentumScore >= 5) return 'Warm';
  return 'Cold';
}

// Diff Engine moved to src/lib/diffEngine.ts

export async function processCompanyIntelligence(domain: string): Promise<CompanyIntelligenceRecord | null> {
  const cleanDomain = normalizeDomain(domain);
  if (!cleanDomain) return null;

  const docRef = doc(db, 'companies', cleanDomain);
  const docSnap = await getDoc(docRef);
  let record: Partial<CompanyIntelligenceRecord> = docSnap.exists() ? docSnap.data() as CompanyIntelligenceRecord : { domain: cleanDomain };

  // Determine if we need to fetch new data (e.g. > 7 days old)
  const lastUpdated = record.lastSnapshottedAt ? new Date(record.lastSnapshottedAt) : null;
  const diffDays = lastUpdated ? (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24) : 999;

  if (diffDays > 7 || !record.facts) {
    console.log(`[Intelligence] Running deep research on ${cleanDomain}`);
    try {
      const newResearch = await researchCompany(cleanDomain);
      
      // 1. Generate Evidence & Facts (AOM v1.1)
      const websiteEvidence = saveEvidence(cleanDomain, {
        companyDomain: cleanDomain,
        source: newResearch.researchSource === 'website' ? `https://${cleanDomain}` : 'form-only',
        rawContent: JSON.stringify(newResearch.facts),
        collectedAt: new Date().toISOString(),
        extractor: newResearch.researchSource === 'website' ? 'scrape' : 'manual',
        confidence: 85 // Base extraction confidence for the LLM
      });

      const getFactValue = (f: any) => typeof f === 'string' ? f : f?.value;

      const industryFact = createObservedFact(cleanDomain, 'Industry', newResearch.industry || getFactValue(newResearch.facts?.industry) || getFactValue(record.facts?.industry) || 'Unknown', websiteEvidence);
      const employeesFact = createObservedFact(cleanDomain, 'Employees', String(getFactValue(newResearch.facts?.employees) || getFactValue(record.facts?.employees) || '0'), websiteEvidence);
      const fundingFact = createObservedFact(cleanDomain, 'FundingStage', getFactValue(newResearch.facts?.fundingStage) || getFactValue(record.facts?.fundingStage) || 'Unknown', websiteEvidence);
      const hqFact = createObservedFact(cleanDomain, 'Headquarters', getFactValue(newResearch.facts?.headquarters) || getFactValue(record.facts?.headquarters) || 'Unknown', websiteEvidence);

      const currentFacts: Fact[] = [industryFact, employeesFact, fundingFact, hqFact];
      const historicalFacts: Fact[] = Object.values(record.facts || {}).flat().filter(Boolean) as Fact[];

      // 2. Diff to generate Events
      const newEvents = generateDiffEvents(cleanDomain, historicalFacts, currentFacts);
      
      // 3. Save Events (In-memory)
      if (!eventStore.has(cleanDomain)) {
        eventStore.set(cleanDomain, record.activeEvents || []);
      }
      eventStore.get(cleanDomain)!.push(...newEvents);
      
      // Update active events list
      const activeSignals = computeActiveSignals(eventStore.get(cleanDomain)!);
      const allActiveEvents = eventStore.get(cleanDomain)!.filter(e => activeSignals.some(s => s.eventId === e.id));

      // 4. Recompute Momentum & Temperature
      const momentum = await computeMomentum(cleanDomain);
      const temperature = computeTemperature(momentum.score, record.temperature || 'Cold');

      // Create Evidence for other signals if they exist
      const hiringSignals = Array.from(new Set([...(record.signals?.hiring || []), ...(newResearch.hiringSignals || [])]));
      if (hiringSignals.length > 0) {
         saveEvidence(cleanDomain, {
           companyDomain: cleanDomain,
           source: newResearch.researchSource === 'website' ? `https://${cleanDomain}/careers` : 'hiring-data',
           rawContent: hiringSignals.join(' | '),
           collectedAt: new Date().toISOString(),
           extractor: 'scrape',
           confidence: 80
         });
      }

      const freshness = computeIntelligenceFreshness(cleanDomain);

      // Compute coverage based on facts presence
      const coverage = {
        website: newResearch.researchSource === 'website' ? 5 : 1,
        hiring: hiringSignals.length > 0 ? 4 : 0,
        leadership: record.signals?.leadership?.length ? 4 : 0,
        funding: getFactValue(newResearch.facts?.fundingStage) && getFactValue(newResearch.facts?.fundingStage) !== 'Unknown' ? 5 : 0,
        techStack: newResearch.facts?.technologies?.length > 0 ? 5 : 0,
        marketSignals: record.signals?.expansion?.length ? 4 : 0
      };
      
      const overallQuality = Math.round(((coverage.website + coverage.hiring + coverage.funding + coverage.techStack) / 20) * 100);

      // 6. Build new Intelligence Record
      const mergedRecord: CompanyIntelligenceRecord = {
        domain: cleanDomain,
        canonicalName: newResearch.canonicalName || record.canonicalName,
        activeEvents: allActiveEvents,
        facts: {
          industry: industryFact,
          employees: employeesFact,
          fundingStage: fundingFact,
          technologies: Array.from(new Set([...(record.facts?.technologies || []), ...(newResearch.facts?.technologies || [])])).map(t => createObservedFact(cleanDomain, 'Technology', typeof t === 'string' ? t : (t as any).value, websiteEvidence)),
          headquarters: hqFact,
          products: Array.from(new Set([...(record.facts?.products || []), ...(newResearch.market?.products || [])])).map(p => createObservedFact(cleanDomain, 'Product', typeof p === 'string' ? p : (p as any).value, websiteEvidence)),
        },
        signals: {
          hiring: hiringSignals,
          expansion: record.signals?.expansion || [],
          pricing: record.signals?.pricing || [],
          leadership: record.signals?.leadership || [],
          techAdoption: record.signals?.techAdoption || [],
        },
        reasoning: record.reasoning || newResearch.recommendedPitch || 'Initial intelligence gathered.',
        predictions: record.predictions || [],
        temperature,
        momentum,
        lastSnapshottedAt: new Date().toISOString(),
        intelligenceQuality: {
          overall: overallQuality,
          coverage,
          freshness
        },
        
        // Backwards compatibility
        opportunityScore: newResearch.opportunityScore || 50,
        confidenceLevel: newResearch.confidenceLevel || 'Medium'
      };

      // 7. Save Record
      await setDoc(docRef, mergedRecord, { merge: true });
      return mergedRecord;

    } catch (err) {
      console.error('[Intelligence] Error processing company:', err);
      return record as CompanyIntelligenceRecord;
    }
  }

  return record as CompanyIntelligenceRecord;
}
