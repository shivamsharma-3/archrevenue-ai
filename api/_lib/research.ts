import { CompanyKnowledge } from './types.js';
import * as admin from 'firebase-admin';
import { callAI } from './ai-provider.js';

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
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error('No AI API key configured. Set GROQ_API_KEY or GEMINI_API_KEY in environment variables.');
  }

  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  // ── Step 1: Fetch website (Jina Reader + Fallback) ─────────────────────
  let scrapedContext = '';
  let fetchSucceeded = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    try {
      // Primary Method: Jina Reader API (Executes JS, returns Markdown + HTML)
      const jinaResponse = await fetch(`https://r.jina.ai/${targetUrl}`, {
        headers: {
          'Accept': 'application/json',
          'X-Return-Format': 'markdown,html',
        },
        signal: controller.signal
      });

      if (!jinaResponse.ok) {
        throw new Error(`Jina Reader returned status ${jinaResponse.status}`);
      }

      const jinaData = await jinaResponse.json();
      const result = jinaData.data;

      if (!result || !result.content) {
        throw new Error('Invalid Jina Reader response format');
      }
      
      const title = result.title || '';
      const text = result.content;

      // Extract direct contact candidates using regex
      const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      const filteredEmails = Array.from(new Set(emailMatches.filter((e: string) => 
        !/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i.test(e) &&
        !e.includes('sentry') && !e.includes('webpack') && !e.includes('example.com')
      )));

      const phoneMatches = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g) || [];
      const filteredPhones = Array.from(new Set(phoneMatches.filter((p: string) => {
        const digits = p.replace(/\D/g, '');
        return digits.length >= 7 && digits.length <= 15;
      })));

      scrapedContext = `Page Title: ${title}\n` +
        (filteredEmails.length > 0 ? `Detected Email Candidates on Page: ${filteredEmails.join(', ')}\n` : '') +
        (filteredPhones.length > 0 ? `Detected Phone Candidates on Page: ${filteredPhones.join(', ')}\n` : '') +
        `Page Content:\n${text.substring(0, 8000)}`;
      fetchSucceeded = true;
      
    } catch (jinaError: any) {
      console.warn(`Jina API failed for ${targetUrl}, falling back to standard fetch:`, jinaError.message);
      
      // Fallback Method: Standard Fetch
      const fallbackResponse = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal
      });

      if (fallbackResponse.ok) {
        const contentType = fallbackResponse.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          const html = await fallbackResponse.text();
          if (html && html.length > 200) {
            const { title, metaDesc, text } = scrapeHtml(html);
            const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
            const filteredEmails = Array.from(new Set(emailMatches.filter((e: string) => 
              !/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i.test(e) &&
              !e.includes('sentry') && !e.includes('webpack') && !e.includes('example.com')
            )));

            scrapedContext = `Page Title: ${title}\nMeta Description: ${metaDesc}\n` +
              (filteredEmails.length > 0 ? `Detected Email Candidates on Page: ${filteredEmails.join(', ')}\n` : '') +
              `Page Content:\n${text}`;
            fetchSucceeded = true;
          }
        }
      }
    }
    
    clearTimeout(timeoutId);
  } catch (fetchErr) {
    console.warn('Website fetch completely failed, falling back to form data:', fetchErr);
  }

  // ── Step 2: Build analysis prompt ───────────────────────────────────────
  const confidenceNote = fetchSucceeded
    ? 'You have live website content. Base your analysis and contact extraction primarily on this.'
    : 'Website fetch failed. You only have the URL. Infer cautiously based on the domain name alone. Set confidenceLevel to "Low" and researchSource to "form-only".';

  const prompt = `
You are a senior B2B revenue intelligence analyst. Your job is to extract comprehensive, STRUCTURED, EVIDENCE-BASED intelligence and lead enrichment fields from real company data.

${confidenceNote}

${fetchSucceeded ? `Website data for ${targetUrl}:\n"""\n${scrapedContext}\n"""` : `Company URL: ${targetUrl}`}

RULES FOR ENRICHMENT:
- companyName: Clean formal company/brand name (e.g. "Neurowhale", "Arch Revenues", not all-caps).
- fullName: Contact person, founder, CEO, director, or executive mentioned on site. If no individual name is found, output a professional role title like "Founder & CEO" or "Executive Leadership".
- email: Primary contact or support email found on site. If detected email candidates exist above, prioritize them. If none on site, infer 'contact@<domain>'.
- phone: Real contact phone number if found on site, or empty string "" if none.
- categoryIndustry: MUST BE EXACTLY ONE OF: "Technology" | "Healthcare" | "Finance" | "Retail" | "Manufacturing" | "Real Estate" | "Education" | "Other".
- industry: Specific vertical description (e.g. "Artificial Intelligence & Enterprise Autonomous Systems").
- companySize: MUST BE EXACTLY ONE OF: "1-10" | "11-50" | "51-200" | "201-1000" | "1000+".
- monthlyRevenue: Realistic estimated monthly revenue bracket (e.g. "$10k - $50k", "$50k - $150k", "$150k - $500k", "$500k+").
- estimatedBudget: Estimated monthly budget for external services/software (e.g. "$2,500 - $5,000", "$5,000 - $15,000").
- leadSource: "Website Discovery".
- painPoint: Concise, punchy 1-2 sentence core business challenge or scaling bottleneck.
- currentSolution: What they currently use to solve this (e.g. "In-house custom stack / manual processes", "Fragmented SaaS tools").
- urgency: MUST BE EXACTLY ONE OF: "Low" | "Medium" | "High" | "Critical".
- interestedService: Target service/solution offering of highest relevance (e.g. "Outbound Pipeline Engine", "B2B Client Acquisition", "AI Pipeline Integration").
- services: Array of core services/products offered.
- summary: 2-3 sentence factual overview.
- opportunityScore: Integer 0-100 reflecting commercial viability and readiness.
- painPoints: Array of 1-3 specific pain points with evidence.
- growthSignals: Expansion/hiring/deployment proof.
- hiringSignals: Career/team growth signals or [].
- customerSegment: Target ICP of this company.
- businessMaturity: 'Early-stage' | 'Growth' | 'Mature' | 'Enterprise' | 'Unknown'.
- recommendedPitch: 1-2 sentence pitch angle grounded in what you actually found on the site.
- confidenceLevel: 'High' | 'Medium' | 'Low'.

Return ONLY this JSON, no markdown, no code blocks:
{
  "companyName": "<clean formal company name>",
  "fullName": "<contact person name or professional role title>",
  "email": "<primary email address>",
  "phone": "<phone number or empty string>",
  "categoryIndustry": "<Technology|Healthcare|Finance|Retail|Manufacturing|Real Estate|Education|Other>",
  "industry": "<specific descriptive industry>",
  "companySize": "<1-10|11-50|51-200|201-1000|1000+>",
  "monthlyRevenue": "<e.g. $50k - $150k>",
  "estimatedBudget": "<e.g. $5,000 - $15,000>",
  "leadSource": "Website Discovery",
  "painPoint": "<concise 1-2 sentence core challenge>",
  "currentSolution": "<current tools or in-house setup>",
  "urgency": "<Low|Medium|High|Critical>",
  "interestedService": "<primary matching service offering>",
  "services": ["<service 1>", "<service 2>"],
  "summary": "<2-3 sentence factual summary>",
  "opportunityScore": 75,
  "painPoints": ["<pain point 1>"],
  "growthSignals": ["<growth signal 1>"],
  "hiringSignals": [],
  "customerSegment": "<e.g. Mid-market SaaS and Enterprise AI adopters>",
  "businessMaturity": "<Early-stage|Growth|Mature|Enterprise|Unknown>",
  "recommendedPitch": "<pitch angle grounded in actual site content>",
  "confidenceLevel": "<High|Medium|Low>",
  "researchSource": "${fetchSucceeded ? 'website' : 'form-only'}"
}
`.trim();

  // ── Step 3: Call AI (Tier-aware: Gemini for paid, Groq for free, with auto-fallback)
  const aiResult = await callAI(prompt, userId, 0.1);
  const rawContent = aiResult.text;
  if (!rawContent) throw new Error('AI returned empty response during research');

  let parsed: any;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    const cleaned = rawContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    parsed = JSON.parse(cleaned);
  }

  // ── Step 4: Validate & normalise ────────────────────────────────────────
  let opportunityScore = parsed.opportunityScore;
  if (typeof opportunityScore === 'string') {
    opportunityScore = parseInt(opportunityScore, 10);
  }
  if (typeof opportunityScore !== 'number' || isNaN(opportunityScore)) {
    opportunityScore = 50;
  }
  opportunityScore = Math.min(100, Math.max(0, Math.round(opportunityScore)));

  // Extract clean domain part for fallback
  const urlHost = new URL(targetUrl).hostname.replace(/^www\./, '');
  const domainParts = urlHost.split('.');
  const rawName = domainParts[0] || 'Company';
  const cleanFallbackName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const finalCompanyName = parsed.companyName && parsed.companyName !== 'Unknown'
    ? parsed.companyName
    : cleanFallbackName;

  const finalFullName = parsed.fullName && parsed.fullName !== 'Unknown' && !parsed.fullName.includes('Contact')
    ? parsed.fullName
    : `${finalCompanyName} Leadership`;

  const finalEmail = parsed.email || `contact@${urlHost}`;
  const finalPhone = parsed.phone || '';

  const validIndustries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Real Estate', 'Education', 'Other'];
  let finalCategory = parsed.categoryIndustry || 'Technology';
  if (!validIndustries.includes(finalCategory)) {
    const raw = `${parsed.industry || ''} ${parsed.summary || ''}`.toLowerCase();
    if (raw.includes('health') || raw.includes('pharma') || raw.includes('med')) finalCategory = 'Healthcare';
    else if (raw.includes('fin') || raw.includes('bank') || raw.includes('invest') || raw.includes('crypto')) finalCategory = 'Finance';
    else if (raw.includes('retail') || raw.includes('store') || raw.includes('shop') || raw.includes('ecommerce')) finalCategory = 'Retail';
    else if (raw.includes('manufact') || raw.includes('industr')) finalCategory = 'Manufacturing';
    else if (raw.includes('estate') || raw.includes('realt') || raw.includes('propert')) finalCategory = 'Real Estate';
    else if (raw.includes('educat') || raw.includes('learn') || raw.includes('school')) finalCategory = 'Education';
    else finalCategory = 'Technology';
  }

  const validSizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
  let finalSize = parsed.companySize || '11-50';
  if (!validSizes.includes(finalSize)) {
    if (parsed.businessMaturity === 'Enterprise') finalSize = '1000+';
    else if (parsed.businessMaturity === 'Mature') finalSize = '201-1000';
    else if (parsed.businessMaturity === 'Growth') finalSize = '11-50';
    else finalSize = '1-10';
  }

  const validUrgencies = ['Low', 'Medium', 'High', 'Critical'];
  let finalUrgency = parsed.urgency || 'High';
  if (!validUrgencies.includes(finalUrgency)) {
    finalUrgency = opportunityScore >= 75 ? 'High' : 'Medium';
  }

  const result = {
    companyName: finalCompanyName,
    fullName: finalFullName,
    email: finalEmail,
    phone: finalPhone,
    categoryIndustry: finalCategory,
    industry: finalCategory, // sets standard dropdown option
    rawIndustry: parsed.industry || finalCategory,
    companySize: finalSize,
    monthlyRevenue: parsed.monthlyRevenue || '$25k - $75k',
    estimatedBudget: parsed.estimatedBudget || '$3,000 - $5,000',
    leadSource: parsed.leadSource || 'Website Discovery',
    painPoint: parsed.painPoint || parsed.painPoints?.[0] || 'Accelerating qualified pipeline and eliminating manual outbound bottlenecks',
    currentSolution: parsed.currentSolution || 'In-house custom stack / manual processes',
    urgency: finalUrgency,
    interestedService: parsed.interestedService || 'Outbound Pipeline Engine',
    services: Array.isArray(parsed.services) ? parsed.services : [],
    summary: parsed.summary || '',
    opportunityScore,
    painPoints: Array.isArray(parsed.painPoints) ? parsed.painPoints : [],
    growthSignals: Array.isArray(parsed.growthSignals) ? parsed.growthSignals : [],
    hiringSignals: Array.isArray(parsed.hiringSignals) ? parsed.hiringSignals : [],
    customerSegment: parsed.customerSegment || 'Unknown',
    businessMaturity: parsed.businessMaturity || 'Unknown',
    recommendedPitch: parsed.recommendedPitch || '',
    confidenceLevel: parsed.confidenceLevel || 'Low',
    researchSource: fetchSucceeded ? 'website' : 'form-only',
  } as unknown as CompanyKnowledge;

  return result;
}

