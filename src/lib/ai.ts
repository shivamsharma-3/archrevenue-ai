import Groq from 'groq-sdk';
import { Lead, AIAnalysis, CompanyKnowledge, ScoringEvidence, SellerProfile, Note, AITask, TaskStatus } from './types';
import { serverTimestamp } from 'firebase/firestore';
import { researchCompany } from './research';
import { auth } from './firebase';
import { checkTokenLimit, incrementTokenUsage } from './usage';
import * as Sentry from '@sentry/react';
import { fetchCompanyKnowledge, saveCompanyKnowledge, normalizeDomain } from './memory';
import { processCompanyIntelligence } from './intelligence';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function callGroq(prompt: string, temperature = 0.2): Promise<{ content: string, tokensUsed: number }> {
  const userId = auth.currentUser?.uid;
  if (userId) {
    await checkTokenLimit(userId);
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      response_format: { type: 'json_object' },
    });
    
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from AI');

    const tokensUsed = completion.usage?.total_tokens || 0;
    if (userId && tokensUsed > 0) {
      await incrementTokenUsage(userId, tokensUsed).catch(err => {
        console.error('[AI] Non-fatal error recording token usage:', err);
        Sentry.captureException(err, { tags: { type: 'token_usage_error' } });
      });
    }

    return { content, tokensUsed };
  } catch (error) {
    Sentry.captureException(error, { tags: { type: 'groq_api_error' } });
    throw error;
  }
}

// ─── Layer 1: Seller Context ─────────────────────────────────────────────────
// Who WE are — injected at top of every AI call

function buildSellerContext(profile: SellerProfile): string {
  const lines: string[] = [
    `SELLER PROFILE (the company sending this outreach — Arch Revenues):`,
    `- Company: ${profile.companyName}`,
    `- Primary Offer: ${profile.primaryOffer}`,
  ];
  if (profile.offerDescription)
    lines.push(`- Offer Description: ${profile.offerDescription}`);
  if (profile.pricingModel)
    lines.push(`- Pricing Model: ${profile.pricingModel}${profile.startingPrice ? `, starting at ${profile.startingPrice}` : ''}`);
  if (profile.targetIndustry || profile.targetCompanySize)
    lines.push(`- Ideal Customer (ICP): ${[
      profile.targetIndustry,
      profile.targetCompanySize ? `${profile.targetCompanySize} employees` : '',
      profile.targetRevenueRange,
      profile.targetGeography,
    ].filter(Boolean).join(', ')}`);
  if (profile.tone)
    lines.push(`- Communication Tone: ${profile.tone}`);
  if (profile.outreachStyle)
    lines.push(`- Outreach Style: ${profile.outreachStyle}`);
  if (profile.ctaStyle)
    lines.push(`- Preferred CTA: ${profile.ctaStyle}`);
  if (profile.description)
    lines.push(`- About Us: ${profile.description}`);
  return lines.join('\n');
}

const forbiddenPhrases = [
  "I was impressed by", "I came across your", "Hope you're doing well",
  "I'd love to connect", "touch base", "circle back", "synergies",
  "leverage", "value proposition", "reach out", "at your convenience", "I noticed",
  "I'd like to schedule", "Let's connect",
].join(', ');

function getOutreachPrompt(
  leadCtx: string, 
  researchCtx: string, 
  sellerCtx: string, 
  profile: SellerProfile | null | undefined, 
  leadName: string | undefined,
  research: CompanyKnowledge | null,
  hasRealResearch: boolean
): string {
  return `
${sellerCtx}

${leadCtx}

${researchCtx}

OUTREACH TASK: Write three pieces of human-sounding outreach from ${profile?.companyName ?? 'Arch Revenues'} to ${leadName || 'the prospect'}.

RULES:
1. No hallucinations (no fake stats, ROI, or ROI estimates unless stated above).
2. No buzzwords: ${forbiddenPhrases}.
3. Email: Max 80 words. Strictly follow template with blank lines:
   Subject: [casual subject]

   Hi [First Name],

   [Observation: 1 short sentence about company]

   [Problem: 1 short sentence about challenge]

   [Solution: 1 short sentence about how we help]

   [CTA: casual low-friction question, e.g. "Open to a quick chat?"]

   Best,
   [Your Name]
4. LinkedIn: Under 220 chars. Direct, no fluff.
5. Call script: Opener / Value Prop / CTA. Opener uses company context.
${hasRealResearch ? `
INTEL:
- Growth/Hiring: ${(research!.growthSignals ?? []).concat(research!.hiringSignals ?? []).slice(0, 2).join('; ')}
- Pain Points: ${(research!.painPoints ?? []).slice(0, 2).join('; ')}
- Pitch Angle: ${research!.recommendedPitch ?? ''}
` : ''}

Return ONLY this JSON, no markdown:
{
  "email": "<Write the exact email using template. Escape newlines properly as '\\n\\n'.>",
  "linkedin": "<Under 220 chars. Direct. Ends with a question.>",
  "callScript": "<OPENER: [context-specific]\\n\\nVALUE PROP: [ties pain to offer]\\n\\nCTA: [specific ask]>"
}
`.trim();
}

// ─── Layer 2: Lead Form Data (30% weight) ────────────────────────────────────

function buildLeadContext(lead: Lead): string {
  return `
LEAD FORM DATA (30% weight — self-reported, treat as signals not facts):
- Name: ${lead.fullName}
- Email: ${lead.email || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}
- Company: ${lead.company || 'Not provided'}
- Website: ${lead.website || 'Not provided'}
- Industry (self-reported): ${lead.industry || 'Not specified'}
- Company Size (self-reported): ${lead.companySize || 'Not specified'}
- Monthly Revenue (self-reported): ${lead.monthlyRevenue || 'Not stated'}
- Estimated Budget (self-reported): ${lead.estimatedBudget || 'Not stated'}
- Lead Source: ${lead.leadSource || 'Unknown'}
- Pain Point (self-described): ${lead.painPoint || 'Not described'}
- Current Solution: ${lead.currentSolution || 'Not mentioned'}
- Urgency (self-reported): ${lead.urgency || 'Not stated'}
- Interested Service: ${lead.interestedService || 'Not specified'}
- Pipeline Status: ${lead.status}
`.trim();
}

// ─── Layer 3: Website Intelligence (70% weight) ──────────────────────────────

function buildResearchContext(research: CompanyKnowledge): string {
  const services      = research.services      ?? [];
  const growthSignals = research.growthSignals ?? [];
  const hiringSignals = research.hiringSignals ?? [];
  const painPoints    = research.painPoints    ?? [];

  return `
WEBSITE INTELLIGENCE (70% weight — primary source of truth):
- Confidence Level: ${research.confidenceLevel ?? 'Unknown'} (${(research.researchSource ?? 'form-only') === 'form-only' ? 'WEBSITE FETCH FAILED — limited data' : 'Live website scraped'})
- Industry (verified): ${research.industry ?? 'Unknown'}
- Business Maturity: ${research.businessMaturity ?? 'Unknown'}
- Customer Segment: ${research.customerSegment ?? 'Unknown'}
- Services/Products: ${services.length > 0 ? services.join(', ') : 'Unknown'}
- Company Summary: ${research.summary ?? ''}
- Opportunity Score (research agent): ${research.opportunityScore ?? 0}/100
- Growth Signals: ${growthSignals.length > 0 ? growthSignals.join(' | ') : 'None detected'}
- Hiring Signals: ${hiringSignals.length > 0 ? hiringSignals.join(' | ') : 'None detected'}
- Identified Pain Points: ${painPoints.length > 0 ? painPoints.join(' | ') : 'Unknown'}
- Recommended Pitch Angle: ${research.recommendedPitch ?? ''}
`.trim();
}

// ─── Score Gate: prevents unearned Hot/High ratings ──────────────────────────

function buildScoringEvidence(lead: Lead, research: CompanyKnowledge | null, profile: SellerProfile | null): ScoringEvidence {
  const hasBudget       = !!(lead.estimatedBudget && lead.estimatedBudget !== 'Not stated');
  const hasMaturity     = !!(research?.businessMaturity && research.businessMaturity !== 'Unknown');
  const hasGrowthSignals = (research?.growthSignals?.length ?? 0) > 0;
  const hasUrgency      = lead.urgency === 'High' || lead.urgency === 'Critical';
  const hasWebsite      = research?.researchSource === 'website';
  const isEarlyStage    = research?.businessMaturity === 'Early-stage';

  // ICP match — if lead's industry matches what we target
  const icpMatch = !!(
    profile?.targetIndustry &&
    lead.industry &&
    lead.industry.toLowerCase().includes(profile.targetIndustry.toLowerCase())
  );

  let buyingLikelihood = 'Low – insufficient evidence';
  const positives: string[] = [];
  if (hasBudget) positives.push('budget stated');
  if (hasMaturity && !isEarlyStage) positives.push(`${research!.businessMaturity} stage`);
  if (hasGrowthSignals) positives.push('growth signals detected');
  if (hasUrgency) positives.push(`urgency: ${lead.urgency}`);
  if (icpMatch) positives.push('ICP match');

  // Require significant evidence for High — early-stage hard cap
  if (positives.length >= 3 && !isEarlyStage && hasBudget) buyingLikelihood = `High – ${positives.join(', ')}`;
  else if (positives.length >= 2 && !isEarlyStage)          buyingLikelihood = `Medium – ${positives.join(', ')}`;
  else if (positives.length >= 1)                            buyingLikelihood = `Low-Medium – ${positives.join(', ')}`;

  return {
    websiteWeight:    hasWebsite ? 70 : 10,
    formWeight:       hasWebsite ? 30 : 90,
    budgetSignal:     hasBudget ? lead.estimatedBudget! : 'Not provided',
    maturitySignal:   hasMaturity
      ? `${research!.businessMaturity}, customer segment: ${research!.customerSegment ?? 'Unknown'}`
      : 'Unknown maturity',
    growthSignal:     hasGrowthSignals
      ? (research!.growthSignals ?? []).slice(0, 2).join('; ')
      : 'None detected',
    buyingLikelihood,
    limitedConfidence: !hasWebsite || research?.confidenceLevel === 'Low',
  };
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface ScoredRule {
  name: string;
  points: number;
}

function calculateDeterministicScore(lead: Lead, research: CompanyKnowledge | null, profile?: SellerProfile | null) {
  const rules: ScoredRule[] = [];

  // 1. ICP Industry Match (+18 points)
  const leadIndustry = (research?.facts?.industry?.value || lead.industry || '').toLowerCase();
  const targetIndustry = (profile?.targetIndustry || '').toLowerCase();
  if (targetIndustry && leadIndustry && leadIndustry.includes(targetIndustry)) {
    rules.push({ name: 'ICP Industry Match', points: 18 });
  }

  // 2. Funding Stage
  const fundingStage = (research?.facts?.fundingStage?.value || '').toLowerCase();
  if (fundingStage.includes('series b')) {
    rules.push({ name: 'Funding (Series B)', points: 20 });
  } else if (fundingStage.includes('series a') || fundingStage.includes('series c')) {
    rules.push({ name: `Funding (${research?.facts?.fundingStage?.value})`, points: 15 });
  } else if (fundingStage && fundingStage !== 'unknown' && !fundingStage.includes('bootstrapped')) {
    rules.push({ name: `Funding (${research?.facts?.fundingStage?.value})`, points: 5 });
  }

  // 3. Hiring Signals
  const hiringSignals = research?.facts?.hiringSignals || [];
  const hasSalesHiring = hiringSignals.some(s => {
    const l = (s.value || '').toLowerCase();
    return l.includes('sdr') || l.includes('ae') || l.includes('sales') || l.includes('representative') || l.includes('revenue') || l.includes('account executive');
  });
  if (hasSalesHiring) {
    rules.push({ name: 'Hiring Sales Representatives', points: 15 });
  } else if (hiringSignals.length > 0) {
    rules.push({ name: 'Active Hiring Signals', points: 5 });
  }

  // 4. Tech Stack Match
  const technologies = research?.facts?.technologies || [];
  const targetTech = ['hubspot', 'salesforce', 'stripe', 'marketo', 'apollo', 'zoominfo', 'pipedrive'];
  const matchedTech = technologies.filter(t => targetTech.includes((t.value || '').toLowerCase()));
  if (matchedTech.length > 0) {
    rules.push({ name: `Tech Stack Match (${matchedTech.slice(0, 2).map(t => t.value).join(', ')})`, points: 10 });
  }

  // 5. Self-Reported Urgency
  const urgency = lead.urgency || 'Low';
  if (urgency === 'High' || urgency === 'Critical') {
    rules.push({ name: `High Urgency (${urgency})`, points: 15 });
  } else if (urgency === 'Medium') {
    rules.push({ name: 'Medium Urgency', points: 10 });
  }

  // 6. Self-Reported Budget / Estimated Budget
  const budget = lead.estimatedBudget || '';
  const cleanBudget = budget.replace(/[^0-9]/g, '');
  const budgetNum = cleanBudget ? parseInt(cleanBudget, 10) : 0;
  if (budgetNum >= 10000) {
    rules.push({ name: 'Budget >= $10k', points: 15 });
  } else if (budgetNum >= 5000) {
    rules.push({ name: 'Budget >= $5k', points: 10 });
  } else if (budgetNum > 0 || (budget && budget.toLowerCase() !== 'not stated' && budget.toLowerCase() !== 'not provided')) {
    rules.push({ name: 'Budget Signal', points: 5 });
  }

  // 7. Contact Completeness / Decision Maker Found (+12 points)
  const leadEmail = lead.email || '';
  const isCorporateEmail = leadEmail && !leadEmail.includes('gmail.com') && !leadEmail.includes('yahoo.com') && !leadEmail.includes('outlook.com') && !leadEmail.includes('hotmail.com');
  if (isCorporateEmail) {
    rules.push({ name: 'Decision Maker Found', points: 12 });
  }

  // Calculate total score, capped at 100
  const score = Math.min(100, rules.reduce((sum, r) => sum + r.points, 0));

  // Determine category and priority
  let category = 'Cold';
  let priority = 'Low';

  if (score >= 75) {
    category = 'Hot';
    priority = 'Critical';
  } else if (score >= 50) {
    category = 'Warm';
    priority = 'High';
  } else if (score >= 30) {
    category = 'Cold';
    priority = 'Medium';
  } else {
    category = 'Dead';
    priority = 'Low';
  }

  // Construct explainable reason
  // E.g. "Hiring SDRs (+15), Funding (Series B) (+20), ICP Match (+18), HubSpot (+10), Decision Maker Found (+12)"
  const reason = rules.length > 0
    ? rules.map(r => `${r.name} (+${r.points})`).join(', ') + `. Total Score: ${score}.`
    : `Limited signals detected. Total Score: ${score}.`;

  // Recommended Action
  let recommendedAction = 'Conduct initial research and reach out with a casual introduction.';
  if (hasSalesHiring && fundingStage) {
    recommendedAction = `Reach out referencing their recent ${fundingStage} funding and active sales team growth.`;
  } else if (hasSalesHiring) {
    recommendedAction = 'Contact the sales leader referencing their active sales representative job openings.';
  } else if (matchedTech.length > 0) {
    recommendedAction = `Reach out with a tailored integration pitch highlighting their use of ${matchedTech[0]}.`;
  } else if (urgency === 'High' || urgency === 'Critical') {
    recommendedAction = 'Initiate immediate outreach due to self-reported high urgency.';
  }

  return {
    score,
    category,
    priority,
    reason,
    recommendedAction
  };
}

export async function generateStrategicReasoning(
  lead: Lead,
  research: CompanyKnowledge | null,
  scoreResult: { score: number; category: string; priority: string; reason: string; recommendedAction: string },
  profile?: SellerProfile | null
): Promise<{ reason: string; recommendedAction: string }> {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    console.warn('[AI Reasoning] Groq API key missing. Falling back to deterministic reasoning.');
    return {
      reason: scoreResult.reason,
      recommendedAction: scoreResult.recommendedAction || 'Conduct initial research and reach out with a casual introduction.'
    };
  }

  const sellerCtx = profile ? buildSellerContext(profile) : 'SELLER PROFILE: Arch Revenues, a B2B revenue intelligence platform.';
  const leadCtx = buildLeadContext(lead);
  
  let companyFactsCtx = '';
  if (research) {
    const facts = research.facts;
    companyFactsCtx = `
VERIFIED COMPANY FACTS:
- Industry: ${facts?.industry?.value || research.industry || 'Unknown'}
- Employees: ${facts?.employees?.value || 0}
- Funding Stage: ${facts?.fundingStage?.value || research.businessMaturity || 'Unknown'}
- Technologies: ${facts?.technologies?.map(t => t.value).join(', ') || 'None detected'}
- Hiring Signals: ${facts?.hiringSignals?.map(s => s.value).join(' | ') || 'None detected'}
- Buying Signals: ${research.signals?.buying?.join(' | ') || 'None detected'}
- Timeline: ${research.timeline?.map(t => `[${t.date}] ${t.event}`).join(' | ') || 'No timeline events'}
- Competitors: ${research.market?.competitors?.join(', ') || 'None listed'}
- Products: ${research.market?.products?.join(', ') || 'None listed'}
- Customer Segment: ${research.customerSegment || 'Unknown'}
`.trim();
  } else {
    companyFactsCtx = 'VERIFIED COMPANY FACTS: None available.';
  }

  const prompt = `
${sellerCtx}

${leadCtx}

${companyFactsCtx}

DETERMINISTIC OPPORTUNITY ENGINE RESULT:
- Score: ${scoreResult.score}/100
- Category: ${scoreResult.category}
- Priority: ${scoreResult.priority}
- Score Reason (Points breakdown): ${scoreResult.reason}

TASK: Generate strategic executive reasoning ("Why Now?") and a recommended action for this sales lead.
Do NOT repeat the point scores or the mathematical points breakdown in the text. Instead, translate these facts and the computed score into high-value B2B intelligence.

Reasoning guidelines:
- Explain "Why now?" and "Why this matters". E.g., "The company recently raised Series B funding and is aggressively hiring SDRs while using HubSpot. This represents a perfect trigger event as they build their sales stack."
- Keep it to 2-3 sentences. Professional, insight-driven tone.

Recommended action guidelines:
- Specific next action based on context. E.g., "Reach out to the VP of Sales referencing their recent funding and active SDR job openings."
- Keep it to 1 sentence. Direct and actionable.

Return ONLY this JSON:
{
  "reason": "<Strategic reasoning explaining why this is a warm/hot opportunity now>",
  "recommendedAction": "<Recommended sales outreach action>"
}
`.trim();

  try {
    const res = await callGroq(prompt, 0.3);
    const parsed = JSON.parse(res.content);
    return {
      reason: parsed.reason || scoreResult.reason,
      recommendedAction: parsed.recommendedAction || scoreResult.recommendedAction
    };
  } catch (err) {
    console.error('[AI Reasoning] Groq reasoning call failed:', err);
    return {
      reason: scoreResult.reason,
      recommendedAction: scoreResult.recommendedAction || 'Conduct initial research and reach out with a casual introduction.'
    };
  }
}

export async function scoreLead(lead: Lead, profile?: SellerProfile | null): Promise<AIAnalysis> {
  let research = lead.research ?? null;
  const userId = auth.currentUser?.uid;
  const domain = lead.website ? normalizeDomain(lead.website) : null;
  let fetchedFromMemory = false;

  // 1 & 2. Continuous Learning Loop: Check memory, diff, generate events, recompute
  if (domain) {
    try {
      console.log(`[AI] Running intelligence loop for ${domain}...`);
      research = await processCompanyIntelligence(domain);
    } catch (err) {
      console.warn('[AI] Intelligence loop failed, continuing with form data only:', err);
      research = null;
    }
  }

  // 3. Compute deterministic score
  const evidence = buildScoringEvidence(lead, research, profile ?? null);
  const scoreResult = calculateDeterministicScore(lead, research, profile);

  // 4. Generate Strategic Reasoning using AI
  let finalReason = scoreResult.reason;
  let finalAction = scoreResult.recommendedAction;

  try {
    const strategicResult = await generateStrategicReasoning(lead, research, scoreResult, profile);
    finalReason = strategicResult.reason;
    finalAction = strategicResult.recommendedAction;
  } catch (err) {
    console.warn('[AI] Strategic reasoning failed, falling back to deterministic breakdown:', err);
  }

  const followUp = {
    email: '',
    linkedin: '',
    callScript: '',
  };

  let suggestedFollowUpDays: number | null = null;
  if (scoreResult.category === 'Hot') suggestedFollowUpDays = 2;
  else if (scoreResult.category === 'Warm') suggestedFollowUpDays = 4;
  else if (scoreResult.category === 'Cold') suggestedFollowUpDays = 7;

  return {
    score:             scoreResult.score,
    category:          scoreResult.category,
    priority:          scoreResult.priority,
    recommendedAction: finalAction,
    reason:            finalReason,
    followUp,
    evidence,
    suggestedFollowUpDays,
    analyzedAt: serverTimestamp(),
    // Attach fresh research so the frontend can also persist it on the lead doc
    ...((research && !lead.research && !fetchedFromMemory) ? { _freshResearch: research } : {}),
  } as AIAnalysis & { _freshResearch?: CompanyKnowledge };
}

export async function regenerateOutreach(lead: Lead, profile?: SellerProfile | null): Promise<AIAnalysis['followUp']> {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    throw new Error('Missing VITE_GROQ_API_KEY in .env file');
  }

  const research = lead.research ?? null;
  const sellerCtx  = profile ? buildSellerContext(profile) : 'SELLER PROFILE: Not configured. Treat as Arch Revenues, a B2B revenue intelligence platform.';
  const leadCtx    = buildLeadContext(lead);
  const researchCtx = research
    ? buildResearchContext(research)
    : 'WEBSITE INTELLIGENCE: Not available.';

  const hasRealResearch = research?.researchSource === 'website' && research?.confidenceLevel !== 'Low';
  const outreachPrompt = getOutreachPrompt(leadCtx, researchCtx, sellerCtx, profile, lead.company || lead.fullName, research, hasRealResearch);

  const outreachRes = await callGroq(outreachPrompt, 0.4);
  let raw = (JSON.parse(outreachRes.content) && typeof JSON.parse(outreachRes.content) === 'object') ? JSON.parse(outreachRes.content) : {};
  if (raw.outreach && typeof raw.outreach === 'object') {
    raw = raw.outreach;
  } else if (raw.followUp && typeof raw.followUp === 'object') {
    raw = raw.followUp;
  } else if (raw.follow_up && typeof raw.follow_up === 'object') {
    raw = raw.follow_up;
  }
  
  if (typeof raw !== 'object' || raw === null) {
    raw = {};
  }
  console.log('[AI REGENERATE] RAW OUTREACH JSON PARSED:', JSON.stringify(raw, null, 2));

  const emailKey = Object.keys(raw).find(k => k.toLowerCase().includes('email'));
  const linkedinKey = Object.keys(raw).find(k => k.toLowerCase().includes('linkedin'));
  const callKey = Object.keys(raw).find(k => k.toLowerCase().includes('call'));

  const followUp = {
    email: emailKey && typeof raw[emailKey] === 'string' ? raw[emailKey] : '',
    linkedin: linkedinKey && typeof raw[linkedinKey] === 'string' ? raw[linkedinKey] : '',
    callScript: callKey && typeof raw[callKey] === 'string' ? raw[callKey] : '',
  };
  console.log('[AI REGENERATE] NORMALIZED FOLLOWUP:', followUp);
  return followUp;
}

export async function generateSingleOutreach(
  type: 'email' | 'linkedin' | 'callScript',
  lead: Lead,
  profile?: SellerProfile | null
): Promise<string> {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    throw new Error('Missing VITE_GROQ_API_KEY in .env file');
  }

  const research = lead.research ?? null;
  const sellerCtx  = profile ? buildSellerContext(profile) : 'SELLER PROFILE: Not configured. Treat as Arch Revenues, a B2B revenue intelligence platform.';
  const leadCtx    = buildLeadContext(lead);
  const researchCtx = research
    ? buildResearchContext(research)
    : 'WEBSITE INTELLIGENCE: Not available.';

  const hasRealResearch = research?.researchSource === 'website' && research?.confidenceLevel !== 'Low';

  let typePrompt = '';
  if (type === 'email') {
    typePrompt = `
OUTREACH TASK: Write a casual, human-sounding sales outreach email from ${profile?.companyName ?? 'Arch Revenues'} to ${lead.fullName || 'the prospect'}.
RULES:
1. Max 80 words. No buzzwords or corporate jargon.
2. Strictly follow this template:
   Subject: [short, casual subject]

   Hi [First Name],

   [Observation: 1 short sentence about company context]

   [Problem: 1 short sentence about a common challenge they face]

   [Solution: 1 short sentence about how we help]

   [CTA: casual question, e.g. "Open to a quick chat?"]

   Best,
   [Your Name]
3. Return ONLY a JSON object: { "email": "<raw text of email matching template, escape newlines as \\n>" }
    `.trim();
  } else if (type === 'linkedin') {
    typePrompt = `
OUTREACH TASK: Write a short, highly personalized LinkedIn connection request message from ${profile?.companyName ?? 'Arch Revenues'} to ${lead.fullName || 'the prospect'}.
RULES:
1. Under 220 characters total. Direct, casual, and human.
2. Reference one growth, hiring, or business signal.
3. Return ONLY a JSON object: { "linkedin": "<raw text of message, escape newlines as \\n>" }
    `.trim();
  } else {
    typePrompt = `
OUTREACH TASK: Write a cold call script for calling ${lead.fullName || 'the prospect'} on behalf of ${profile?.companyName ?? 'Arch Revenues'}.
RULES:
1. Include Opener, Value Prop (ties their pain to our offer), and a low-friction CTA.
2. No fake stats.
3. Return ONLY a JSON object: { "callScript": "<OPENER: [opener]\\n\\nVALUE PROP: [value prop]\\n\\nCTA: [cta], escape newlines as \\n>" }
    `.trim();
  }

  const prompt = `
${sellerCtx}

${leadCtx}

${researchCtx}

${hasRealResearch ? `
INTEL:
- Growth/Hiring: ${(research!.growthSignals ?? []).concat(research!.hiringSignals ?? []).slice(0, 2).join('; ')}
- Pain Points: ${(research!.painPoints ?? []).slice(0, 2).join('; ')}
- Pitch Angle: ${research!.recommendedPitch ?? ''}
` : ''}

${typePrompt}
  `.trim();

  const res = await callGroq(prompt, 0.35);
  try {
    const raw = JSON.parse(res.content);
    if (type === 'email') return raw.email || '';
    if (type === 'linkedin') return raw.linkedin || '';
    return raw.callScript || '';
  } catch (err) {
    console.error('Failed to parse single outreach JSON:', err);
    throw new Error('AI returned an unexpected response. Please try again.');
  }
}

// ─── Layer 4: Notes Summarization ────────────────────────────────────────────

export async function generateNotesSummary(notes: Note[]): Promise<string> {
  if (!notes || notes.length === 0) return '';

  const notesText = notes.map(n => {
    const d = n.timestamp?.toDate ? n.timestamp.toDate() : new Date(n.timestamp);
    const dateStr = d.toLocaleDateString();
    return `[${dateStr}] [${n.type || 'General'}] ${n.content}`;
  }).join('\n');

  const prompt = `
You are a highly skilled Sales Operations AI. Your job is to read all the notes logged for a specific lead and output a highly concise, bulleted summary of their current status.

Here are the notes:
${notesText}

REQUIREMENTS:
1. Extract the most critical points (budget, objections, next steps, key stakeholders).
2. Keep it to 3-5 short bullet points.
3. Use plain text only, starting each line with a bullet point (•).
4. Return a JSON object with a single field "summary" containing your formatted text.

Example response:
{
  "summary": "• Decision maker: Sarah\\n• Budget approved for $3k\\n• Objection: Pricing too high\\n• Next step: Send proposal on Friday"
}
`;

  console.log('[AI SUMMARY] Generating summary for notes...');
  const response = await callGroq(prompt, 0.1);
  console.log('[AI SUMMARY] Received response:', response.content);

  try {
    const raw = JSON.parse(response.content);
    return raw.summary || '';
  } catch (err) {
    console.error('Failed to parse summary JSON:', err);
    return '';
  }
}

// ─── Layer 5: AI Task Generation ─────────────────────────────────────────────

export async function generateTasks(lead: Lead, sellerProfile?: SellerProfile | null): Promise<AITask[]> {
  const analysis = lead.aiAnalysis;
  const research = lead.research;
  const notes = lead.notes?.slice(-3) ?? [];

  const notesContext = notes.length > 0
    ? notes.map(n => `- [${n.type || 'Note'}] ${n.content}`).join('\n')
    : 'No notes logged yet.';

  const prompt = `
You are a world-class B2B Sales Coach AI. Based on the full context of this lead, generate 3 to 5 precise, actionable next-step tasks a sales rep should do RIGHT NOW.

LEAD:
- Name: ${lead.fullName}
- Company: ${lead.company || 'Unknown'}
- Status: ${lead.status}
- Industry: ${lead.industry || 'Unknown'}

AI ANALYSIS:
- Score: ${analysis?.score ?? 'Not scored'}/100
- Category: ${analysis?.category ?? 'Unknown'}
- Priority: ${analysis?.priority ?? 'Unknown'}
- Recommended Action: ${analysis?.recommendedAction ?? 'None'}
- AI Reasoning: ${analysis?.reason ?? 'None'}

COMPANY RESEARCH:
- Pain Points: ${research?.painPoints?.join(', ') || 'Unknown'}
- Growth Signals: ${research?.growthSignals?.join(', ') || 'None'}
- Recommended Pitch: ${research?.recommendedPitch || 'None'}

LATEST NOTES:
${notesContext}

SELLER CONTEXT:
- Seller: ${sellerProfile?.companyName || 'Arch Revenues'}
- Offer: ${sellerProfile?.primaryOffer || 'B2B Revenue Platform'}

RULES:
1. Tasks must be SHORT, specific, and immediately actionable (start with a verb)
2. No fluff. Each task should be 5-12 words max.
3. Order by urgency (most important first)
4. Do NOT repeat tasks. Make each one distinct.
5. Return ONLY a JSON object with a "tasks" array of strings.

Example:
{
  "tasks": [
    "Send a personalised cold email referencing their hiring growth",
    "Connect on LinkedIn with a short, punchy note",
    "Research the VP of Sales on the company team page",
    "Schedule a 20-min discovery call via Calendly"
  ]
}
`;

  console.log('[AI TASKS] Generating tasks for:', lead.fullName);
  const response = await callGroq(prompt, 0.3);
  console.log('[AI TASKS] Received response:', response.content);

  try {
    const raw = JSON.parse(response.content);
    const rawTasks: string[] = Array.isArray(raw.tasks) ? raw.tasks : [];

    return rawTasks.map((title: string) => ({
      id: crypto.randomUUID(),
      title: title.trim(),
      status: 'pending' as TaskStatus,
      source: 'ai' as const,
      createdAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[AI TASKS] Failed to parse tasks JSON:', err);
    return [];
  }
}


// ─── Layer 6: AI Deal Coach ───────────────────────────────────────────────────

export interface DealCoachResult {
  whyItWillClose: string;
  objections: string[];
  decisionMaker: string;
  bestAngle: string;
  bestCta: string;
  dealStrength: 'Strong' | 'Moderate' | 'Weak';
  tokensUsed?: number;
  generatedAt: string;
}

export async function generateDealCoach(lead: Lead, sellerProfile?: SellerProfile | null): Promise<DealCoachResult> {
  const research = lead.research ?? null;
  const analysis = lead.aiAnalysis ?? null;
  const notes = (lead.notes ?? []).slice(-5).map(n => `- [${n.type || 'Note'}] ${n.content}`).join('\n');

  const sellerCtx = sellerProfile ? buildSellerContext(sellerProfile) : 'SELLER: Arch Revenues — B2B Revenue Intelligence Platform';
  const leadCtx = buildLeadContext(lead);
  const researchCtx = research ? buildResearchContext(research) : 'No website research available.';

  const prompt = `
You are an elite B2B Sales Coach. Analyse this deal and produce a Deal Coach report. Be specific and evidence-based.

${sellerCtx}

${leadCtx}

${researchCtx}

AI ANALYSIS: Score ${analysis?.score ?? 'N/A'}/100, Category: ${analysis?.category ?? 'Unknown'}, Reason: ${analysis?.reason ?? 'None'}

RECENT NOTES:\n${notes || 'None'}

RULES: Base everything on data above. No invented facts. dealStrength: Strong if score 70+, Moderate 40-69, Weak below 40.

Return ONLY this JSON:
{
  "whyItWillClose": "<2 sentences: specific evidence why this deal can close>",
  "objections": ["<objection 1>", "<objection 2>", "<objection 3>"],
  "decisionMaker": "<likely decision maker role based on company size/type>",
  "bestAngle": "<most powerful outreach angle based on their pain points>",
  "bestCta": "<single most effective CTA for this lead>",
  "dealStrength": "<Strong | Moderate | Weak>"
}
`.trim();

  console.log('[AI DEAL COACH] Generating for:', lead.fullName);
  const response = await callGroq(prompt, 0.2);

  try {
    const raw = JSON.parse(response.content);
    return {
      whyItWillClose: raw.whyItWillClose || 'Insufficient data.',
      objections: Array.isArray(raw.objections) ? raw.objections : [],
      decisionMaker: raw.decisionMaker || 'Unknown — needs qualification.',
      bestAngle: raw.bestAngle || 'Focus on identified pain points.',
      bestCta: raw.bestCta || 'Request a 15-minute discovery call.',
      dealStrength: ['Strong', 'Moderate', 'Weak'].includes(raw.dealStrength) ? raw.dealStrength : 'Moderate',
      tokensUsed: response.tokensUsed,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[AI DEAL COACH] Failed to parse JSON:', err);
    throw new Error('Deal Coach AI returned an unexpected response. Please try again.');
  }
}
