import Groq from 'groq-sdk';
import { CompanyKnowledge } from './types';
import { auth } from './firebase';
import { checkTokenLimit, incrementTokenUsage } from './usage';
import { normalizeDomain } from './memory';

const GROQ_API_KEY = typeof process !== 'undefined' && process.env.VITE_GROQ_API_KEY 
  ? process.env.VITE_GROQ_API_KEY 
  : import.meta.env?.VITE_GROQ_API_KEY;

const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ─── HTML scraping helpers ────────────────────────────────────────────────────

function scrapeHtml(html: string): { title: string; metaDesc: string; text: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const title = doc.title?.trim() || '';
  const metaDesc =
    doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() ||
    '';

  // Remove noise nodes
  doc
    .querySelectorAll(
      'script, style, noscript, iframe, svg, img, video, audio, ' +
      'header, footer, nav, aside, [aria-hidden="true"], ' +
      '.cookie-banner, #cookie-banner, .gdpr, .popup'
    )
    .forEach((el) => el.remove());

  // Prefer semantic content areas; fall back to full body
  const contentNode =
    doc.querySelector('main') ||
    doc.querySelector('article') ||
    doc.querySelector('[role="main"]') ||
    doc.body;

  // Pull structured text: headings first, then paragraphs, then remaining text
  const headings = Array.from(contentNode.querySelectorAll('h1, h2, h3'))
    .map((el) => el.textContent?.trim())
    .filter(Boolean)
    .slice(0, 20)
    .join(' | ');

  const paras = Array.from(contentNode.querySelectorAll('p, li'))
    .map((el) => el.textContent?.trim())
    .filter((t) => t && t.length > 20)
    .slice(0, 80)
    .join(' ');

  // Also grab any raw text that wasn't in structured tags
  const rawText = (contentNode.textContent || '').replace(/\s+/g, ' ').trim();

  // Combine, dedupe by taking the richest slice
  const combined = `${headings}\n${paras}\n${rawText}`;
  const words = combined.split(/\s+/).slice(0, 1200);

  return { title, metaDesc, text: words.join(' ') };
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function researchCompany(url: string): Promise<CompanyKnowledge> {
  if (!GROQ_API_KEY) {
    throw new Error('Missing VITE_GROQ_API_KEY in environment variables.');
  }

  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  // ── Step 1: Fetch via CORS proxy ────────────────────────────────────────
  let scrapedContext = '';
  let fetchSucceeded = false;

  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });

    if (res.ok) {
      const html = await res.text();
      if (html && html.length > 200) {
        const { title, metaDesc, text } = scrapeHtml(html);
        scrapedContext = `Title: ${title}\nDesc: ${metaDesc}\nContent:\n${text}`;
        fetchSucceeded = true;
      }
    }
  } catch (fetchErr) {
    console.warn('Website fetch failed, falling back to form data:', fetchErr);
  }

  // ── Step 2: Build analysis prompt ───────────────────────────────────────
  const confidenceNote = fetchSucceeded
    ? 'Use live website context. Base analysis primarily on this.'
    : 'Website fetch failed. Infer cautiously based on domain name. Set confidenceLevel to "Low" and researchSource to "form-only".';

  const prompt = `
Factual B2B intelligence extraction for ${targetUrl}:
${fetchSucceeded ? scrapedContext : `Company URL: ${targetUrl}`}

${confidenceNote}

RULES:
- opportunityScore (0-100): Reflect verified indicators (growth, maturity). Cap if no data.
- hiringSignals: Job postings or team growth text. Empty array [] if none.
- businessMaturity: Early-stage | Growth | Mature | Enterprise | Unknown.
- painPoints & services: Factual lists based on content. No generalizations.
- facts: Extract structured details including estimated employee count (as an integer), fundingStage (exactly one of: Seed, Series A, Series B, Series C+, Post-IPO, Bootstrapped, or Unknown), technologies (detected B2B software, e.g. HubSpot, Stripe, Salesforce, Zendesk, etc., or empty array if none), hiringSignals, and headquarters (City, State/Country or Unknown).
- signals: Separate lists of buying signals (intent indicators), risk signals (objections, gaps), growth signals (expansion indicators), and technology signals.
- timeline: Create an array of historical company events (e.g. funding rounds, office launches, executive hires, product updates) with estimated dates. Keep it chronological if possible.
- market: List competitors, product offerings, and target segments.
- Return ONLY JSON, no markdown:
{
  "industry": "<specific industry vertical, e.g. 'B2B SaaS'>",
  "services": ["<service 1>", "<service 2>"],
  "summary": "<1-2 sentence description of what they do & how they monetize>",
  "opportunityScore": <integer 0-100>,
  "painPoints": ["<pain point 1>", "<pain point 2>"],
  "growthSignals": ["<growth signal 1>", "<signal 2>"],
  "hiringSignals": ["<hiring signal 1>"],
  "customerSegment": "<customer segment>",
  "businessMaturity": "<maturity stage>",
  "recommendedPitch": "<1-2 sentence pitch angle grounded in website info>",
  "confidenceLevel": "<High | Medium | Low>",
  "researchSource": "${fetchSucceeded ? 'website' : 'form-only'}",
  "facts": {
    "industry": "<vertical vertical>",
    "employees": <estimated employee count as integer, 0 if unknown>,
    "fundingStage": "<Seed | Series A | Series B | Series C+ | Post-IPO | Bootstrapped | Unknown>",
    "headquarters": "<City, State/Country or Unknown>",
    "technologies": ["<detected technology 1>", "<detected technology 2>"],
    "hiringSignals": ["<hiring signal 1>", "<hiring signal 2>"]
  },
  "signals": {
    "buying": ["<buying signal 1>", "<buying signal 2>"],
    "risk": ["<risk signal 1>", "<risk signal 2>"],
    "growth": ["<growth signal 1>", "<growth signal 2>"],
    "technology": ["<technology signal 1>", "<technology signal 2>"]
  },
  "timeline": [
    {
      "date": "<Month Year or Year of event, e.g., 'March 2026' or '2025'>",
      "event": "<Objective description of event>",
      "type": "<funding | hiring | technology | growth | general>"
    }
  ],
  "market": {
    "competitors": ["<competitor 1>", "<competitor 2>"],
    "products": ["<product 1>", "<product 2>"],
    "targetSegments": ["<segment 1>", "<segment 2>"]
  }
}
`.trim();

  // ── Step 3: Call Groq ────────────────────────────────────────────────────
  const userId = auth.currentUser?.uid;
  if (userId) {
    await checkTokenLimit(userId);
  }

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1, // Very low — we want deterministic extraction, not creativity
    response_format: { type: 'json_object' },
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) throw new Error('AI returned empty response during research');

  const tokensUsed = completion.usage?.total_tokens || 0;
  if (userId && tokensUsed > 0) {
    await incrementTokenUsage(userId, tokensUsed).catch(err => 
      console.error('[AI] Non-fatal error recording token usage:', err)
    );
  }

  const parsed = JSON.parse(rawContent);

  // ── Step 4: Validate & normalise ────────────────────────────────────────
  if (!parsed.industry || typeof parsed.opportunityScore !== 'number') {
    throw new Error('AI returned malformed research JSON');
  }

  const result: CompanyKnowledge = {
    domain: normalizeDomain(url),
    reasoning: '',
    predictions: [],
    temperature: 'Cold',
    momentum: { score: 0, timeframe: 'Last 30 days' },
    lastSnapshottedAt: new Date().toISOString(),
    industry: parsed.industry || 'Unknown',
    services: Array.isArray(parsed.services) ? parsed.services : [],
    summary: parsed.summary || '',
    opportunityScore: Math.min(100, Math.max(0, Math.round(parsed.opportunityScore))),
    painPoints: Array.isArray(parsed.painPoints) ? parsed.painPoints : [],
    growthSignals: Array.isArray(parsed.growthSignals) ? parsed.growthSignals : [],
    hiringSignals: Array.isArray(parsed.hiringSignals) ? parsed.hiringSignals : [],
    customerSegment: parsed.customerSegment || 'Unknown',
    businessMaturity: parsed.businessMaturity || 'Unknown',
    recommendedPitch: parsed.recommendedPitch || '',
    confidenceLevel: parsed.confidenceLevel || 'Low',
    researchSource: fetchSucceeded ? 'website' : 'form-only',
    tokensUsed: tokensUsed,
    facts: parsed.facts ? {
      industry: parsed.facts.industry || parsed.industry || 'Unknown',
      employees: typeof parsed.facts.employees === 'number' ? parsed.facts.employees : 0,
      fundingStage: parsed.facts.fundingStage || 'Unknown',
      technologies: Array.isArray(parsed.facts.technologies) ? parsed.facts.technologies : [],
      hiringSignals: Array.isArray(parsed.facts.hiringSignals) ? parsed.facts.hiringSignals : [],
      headquarters: parsed.facts.headquarters || 'Unknown',
      products: Array.isArray(parsed.facts.products) ? parsed.facts.products : [],
    } : {
      industry: parsed.industry || 'Unknown',
      employees: 0,
      fundingStage: 'Unknown',
      technologies: [],
      hiringSignals: [],
      headquarters: 'Unknown',
      products: [],
    },
    signals: parsed.signals ? {
      buying: Array.isArray(parsed.signals.buying) ? parsed.signals.buying : [],
      risk: Array.isArray(parsed.signals.risk) ? parsed.signals.risk : [],
      growth: Array.isArray(parsed.signals.growth) ? parsed.signals.growth : [],
      technology: Array.isArray(parsed.signals.technology) ? parsed.signals.technology : [],
      hiring: Array.isArray(parsed.signals.hiring) ? parsed.signals.hiring : [],
      expansion: Array.isArray(parsed.signals.expansion) ? parsed.signals.expansion : [],
      pricing: Array.isArray(parsed.signals.pricing) ? parsed.signals.pricing : [],
      leadership: Array.isArray(parsed.signals.leadership) ? parsed.signals.leadership : [],
      techAdoption: Array.isArray(parsed.signals.techAdoption) ? parsed.signals.techAdoption : [],
    } : { buying: [], risk: [], growth: [], technology: [], hiring: [], expansion: [], pricing: [], leadership: [], techAdoption: [] },
    timeline: Array.isArray(parsed.timeline) ? parsed.timeline.map((t: any) => ({
      date: t.date || 'Unknown',
      event: t.event || '',
      type: ['funding', 'hiring', 'technology', 'growth', 'general'].includes(t.type) ? t.type : 'general'
    })) : [],
    market: parsed.market ? {
      competitors: Array.isArray(parsed.market.competitors) ? parsed.market.competitors : [],
      products: Array.isArray(parsed.market.products) ? parsed.market.products : [],
      targetSegments: Array.isArray(parsed.market.targetSegments) ? parsed.market.targetSegments : [],
    } : { competitors: [], products: [], targetSegments: [] },
    rawOutput: parsed
  };

  return result;
}
