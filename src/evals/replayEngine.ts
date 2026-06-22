import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// ─── Polyfills for Node environment ──────────────────────────────────────────
import { JSDOM } from 'jsdom';
(global as any).DOMParser = new JSDOM().window.DOMParser;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace global fetch to intercept requests for snapshots
const originalFetch = global.fetch;
global.fetch = async (url: any, options: any) => {
  if (typeof url === 'string' && url.includes('corsproxy.io')) {
    const targetUrl = decodeURIComponent(url.split('?')[1]);
    const domain = targetUrl.replace('https://', '').replace('http://', '');
    
    const datasetPath = path.join(__dirname, 'goldenDataset.json');
    const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    const company = dataset.find((c: any) => c.domain === domain);
    
    if (company) {
      const htmlPath = path.join(process.cwd(), company.snapshotPath);
      const html = fs.readFileSync(htmlPath, 'utf8');
      return {
        ok: true,
        text: async () => html
      } as Response;
    }
  }
  return originalFetch(url, options);
};

// ─── Imports that must happen AFTER polyfills ────────────────────────────────
import { researchCompany } from '../lib/research';
import { generateDiffEvents } from '../lib/diffEngine';
import { Fact, CommercialEvent } from '../lib/types';
import { runMetrics } from './metricsEngine';

// Helper to convert structured expected facts to full Fact objects
function buildFactsFromConfig(domain: string, configFacts: any[]): Fact[] {
  return configFacts.map(f => ({
    id: crypto.randomUUID(),
    companyDomain: domain,
    category: f.category,
    value: f.value,
    confidence: 100,
    evidenceIds: [],
    confirmationCount: 1,
    firstSeenAt: new Date().toISOString(),
    lastConfirmedAt: new Date().toISOString(),
    maturityLevel: 'Established',
    freshness: '0 hours ago',
    provenance: []
  }));
}

async function runEvaluationHarness() {
  console.log('🚀 Starting Intelligence Evaluation Harness...');
  const datasetPath = path.join(__dirname, 'goldenDataset.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

  const results = [];

  for (const company of dataset) {
    console.log(`\nEvaluating: ${company.domain}`);
    
    // 1. Run Extraction (Benchmark A)
    const newResearch = await researchCompany(company.domain);
    
    // Normalize extracted facts into generic Fact[] array
    const currentFacts: Fact[] = [];
    const rf = newResearch.facts || {};
    
    const getVal = (v: any) => typeof v === 'string' ? v : v?.value;
    
    if (getVal(rf.employees)) currentFacts.push(buildFactsFromConfig(company.domain, [{ category: 'Employees', value: String(getVal(rf.employees)) }])[0]);
    if (getVal(rf.fundingStage)) currentFacts.push(buildFactsFromConfig(company.domain, [{ category: 'FundingStage', value: getVal(rf.fundingStage) }])[0]);
    if (getVal(rf.headquarters)) currentFacts.push(buildFactsFromConfig(company.domain, [{ category: 'Headquarters', value: getVal(rf.headquarters) }])[0]);
    
    const techs = Array.from(new Set(rf.technologies || []));
    for (const t of techs) {
      currentFacts.push(buildFactsFromConfig(company.domain, [{ category: 'Technology', value: getVal(t) }])[0]);
    }

    // 2. Run Diff Engine (Benchmark B)
    const historicalFacts = buildFactsFromConfig(company.domain, company.historicalFacts);
    const generatedEvents = generateDiffEvents(company.domain, historicalFacts, currentFacts);

    results.push({
      domain: company.domain,
      expectedFacts: company.expectedFacts,
      actualFacts: currentFacts.map(f => ({ category: f.category, value: f.value })),
      expectedEvents: company.expectedEvents,
      actualEvents: generatedEvents.map(e => ({ type: e.type })),
      rawOutput: newResearch.rawOutput
    });
  }

  // 3. Compute Metrics
  runMetrics(results);
}

runEvaluationHarness().catch(console.error);
