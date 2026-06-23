import Groq from 'groq-sdk';
import { CompanyKnowledge } from './types';
import * as admin from 'firebase-admin';
import { checkTokenLimit, incrementTokenUsage } from './usage';

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
  const words = combined.split(/\s+/).slice(0, 2500);

  return { title, metaDesc, text: words.join(' ') };
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function researchCompany(url: string, userId: string): Promise<CompanyKnowledge> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY in environment variables.');
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY });

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
        scrapedContext = `Page Title: ${title}\nMeta Description: ${metaDesc}\nPage Content:\n${text}`;
        fetchSucceeded = true;
      }
    }
  } catch (fetchErr) {
    console.warn('Website fetch failed, falling back to form data:', fetchErr);
  }

  // ── Step 2: Build analysis prompt ───────────────────────────────────────
  const confidenceNote = fetchSucceeded
    ? 'You have live website content. Base your analysis primarily on this.'
    : 'Website fetch failed. You only have the URL. Infer cautiously based on the domain name alone. Set confidenceLevel to "Low" and researchSource to "form-only".';

  const prompt = `
You are a senior B2B revenue intelligence analyst. Your job is to extract STRUCTURED, EVIDENCE-BASED intelligence from real company data — not to generate optimistic guesses.

${confidenceNote}

${fetchSucceeded ? `Website content for ${targetUrl}:\n"""\n${scrapedContext}\n"""` : `Company URL: ${targetUrl}`}

RULES:
- opportunityScore must reflect ACTUAL evidence: real growth signals, buying intent indicators, company maturity. Do NOT score high on hope.
- hiringSignals: look for career pages, "We're hiring", job titles mentioned, team growth language. Empty array [] if none found.
- businessMaturity: judge from language, team size, product sophistication, funding language, customer references.
- confidenceLevel: "High" only if you extracted rich content. "Medium" if partial. "Low" if barely anything.
- Be specific. Do NOT use generic phrases like "they may need help with X" without evidence.
- painPoints must be inferred from what their business actually does and common friction in that niche — not invented.

Return ONLY this JSON, no markdown, no code blocks:
{
  "industry": "<specific industry vertical, e.g. 'B2B SaaS - Revenue Operations'>",
  "services": ["<service 1>", "<service 2>", "<service 3>"],
  "summary": "<2-3 sentence factual summary of what the company does, who their customers are, and how they make money>",
  "opportunityScore": <integer 0-100, evidence-gated>,
  "painPoints": ["<specific pain point 1 with evidence>", "<pain point 2>"],
  "growthSignals": ["<specific growth signal with source>", "<signal 2>"],
  "hiringSignals": ["<e.g. 'Hiring Senior AE – suggests sales expansion'>", "<or empty array>"],
  "customerSegment": "<e.g. 'Mid-market SaaS companies, 50-500 employees, North America'>",
  "businessMaturity": "<'Early-stage' | 'Growth' | 'Mature' | 'Enterprise' | 'Unknown'>",
  "recommendedPitch": "<1-2 sentence pitch angle grounded in what you actually found on the site>",
  "confidenceLevel": "<'High' | 'Medium' | 'Low'>",
  "researchSource": "${fetchSucceeded ? 'website' : 'form-only'}"
}
`.trim();

  // ── Step 3: Call Groq ────────────────────────────────────────────────────
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
  };

  return result;
}
