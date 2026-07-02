import Groq from 'groq-sdk';
import { Lead, AIAnalysis, CompanyKnowledge, ScoringEvidence, SellerProfile, Note, AITask, TaskStatus } from './types.js';
import { FieldValue } from './firebase-admin.js';
import { researchCompany } from './research.js';
import { checkTokenLimit, incrementTokenUsage } from './usage.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function callGroq(prompt: string, userId: string, temperature = 0.2): Promise<string> {
  if (userId) {
    await checkTokenLimit(userId);
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature,
    response_format: { type: 'json_object' },
  });
  
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from AI');

  const tokensUsed = completion.usage?.total_tokens || 0;
  if (userId && tokensUsed > 0) {
    await incrementTokenUsage(userId, tokensUsed).catch(err => 
      console.error('[AI] Non-fatal error recording token usage:', err)
    );
  }

  return content;
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

OUTREACH TASK: Act like a top-performing SDR. Write three pieces of outreach from ${profile?.companyName ?? 'Arch Revenues'} to ${leadName || 'the prospect'} that sound like a real human.

MANDATORY RULES:
1. WE are ${profile?.companyName ?? 'Arch Revenues'}. THEY are the prospect. Never pitch their own services back to them.
2. NO HALLUCINATIONS: Never generate statistics, percentages, ROI estimates, revenue projections, or performance improvements unless explicitly in the source data.
3. FORBIDDEN phrases (instantly fails): ${forbiddenPhrases}. No corporate jargon. No AI buzzwords. No generic sales language.
4. Focus on ONE specific pain point and ONE clear outcome.
5. Simple English. Short paragraphs. Maximum 120-150 words total for the email.
6. Our offer: ${profile?.primaryOffer ?? 'revenue intelligence and AI-powered lead scoring'}. ${profile?.offerDescription ?? ''}
7. Email format MUST strictly follow this template, with blank lines between EVERY section:
   Subject: [short, casual subject]

   Hi [First Name],

   [Observation/Insight: 1 short sentence about their business]

   [Problem: 1 short sentence about a common challenge they likely face]

   [Solution: 1 short sentence about how we might help create a reliable pipeline/outcome]

   [CTA: 1 short, low-friction question, e.g. "Open to a quick chat?"]

   Best,
   [Your Name]
8. LinkedIn: Under 290 characters. References one specific thing about their company. Ends with a direct question.
9. Call script: OPENER / VALUE PROP / CTA. Opener references company context. No invented numbers in VALUE PROP.
10. Tone: ${profile?.tone ?? 'Professional but highly conversational and human'}. CTA style: ${profile?.ctaStyle ?? 'Request a 15-minute discovery call'}.
${hasRealResearch ? `
SPECIFIC INTEL TO REFERENCE:
- Customer segment: ${research!.customerSegment ?? 'Unknown'}
- Growth signals: ${(research!.growthSignals ?? []).join('; ') || 'None'}
- Hiring signals: ${(research!.hiringSignals ?? []).join('; ') || 'None'}
- Their pain points (from site): ${(research!.painPoints ?? []).join('; ')}
- Pitch angle from research: ${research!.recommendedPitch ?? ''}
` : ''}

Return ONLY this JSON, no markdown. 
CRITICAL JSON RULE: You must escape all newlines as \\n in the string values. Do not insert actual line breaks into the JSON string values.
{
  "email": "<Write the exact email using the strict template above. Use '\\n\\n' to create blank lines between sections. ESCAPE NEWLINES PROPERLY.>",
  "linkedin": "<Under 290 characters. References something specific about ${leadName || 'their company'}. Direct. Ends with question.>",
  "callScript": "<OPENER: [context-specific]\\n\\nVALUE PROP: [ties their pain to our offer — no fake stats]\\n\\nCTA: [one specific ask]>"
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

export async function scoreLead(lead: Lead, userId: string, profile?: SellerProfile | null): Promise<AIAnalysis> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY in environment');
  }

  // ── Step 1: Research website if it exists and not already researched ─────
  let research = lead.research ?? null;

  if (lead.website && !research) {
    try {
      console.log('[AI] No existing research — fetching website intelligence first...');
      research = await researchCompany(lead.website, userId);
    } catch (err) {
      console.warn('[AI] Website research failed, continuing with form data only:', err);
      research = null;
    }
  }

  const hasRealResearch = research?.researchSource === 'website' && research?.confidenceLevel !== 'Low';
  const evidence        = buildScoringEvidence(lead, research, profile ?? null);

  // Build context layers
  const sellerCtx  = profile ? buildSellerContext(profile) : 'SELLER PROFILE: Not configured. Treat as Arch Revenues, a B2B revenue intelligence platform.';
  const leadCtx    = buildLeadContext(lead);
  const researchCtx = research
    ? buildResearchContext(research)
    : 'WEBSITE INTELLIGENCE: Not available. No website provided or research failed.\nScoring must use form data only. Cap score at 55 unless form data is exceptionally strong.';

  // ICP match bonus context
  const icpMatchNote = profile?.targetIndustry && lead.industry
    ? `ICP Match check: our target industry is "${profile.targetIndustry}". Lead industry is "${lead.industry}". ${lead.industry.toLowerCase().includes(profile.targetIndustry.toLowerCase()) ? '✓ ICP MATCH — add 5-10 points.' : '✗ No ICP match.'}`
    : '';

  // ── Step 2: Scoring prompt — evidence-gated ───────────────────────────────
  const scorePrompt = `
${sellerCtx}

${leadCtx}

${researchCtx}

${icpMatchNote}

SCORING RULES (MANDATORY — violating these invalidates the output):
1. Score weighted: 70% website intelligence, 30% form data. If no website data, cap at 55.
2. "Hot" requires ALL: (a) growth/hiring signals detected, AND (b) budget stated OR urgency High/Critical, AND (c) businessMaturity is Growth or above (NEVER Early-stage).
3. "Critical"/"High" priority requires 2+ of: stated budget, confirmed urgency, website growth signals, maturity >= Growth. Early-stage or $0 revenue companies are NEVER High/Critical.
4. If confidenceLevel is Low or researchSource is "form-only", note in reason: "(Limited confidence — website data unavailable)"
5. reason MUST cite SPECIFIC evidence. No generic statements. No invented data.
6. recommendedAction must be a concrete, evidence-based next step — not a generic CTA.
7. NO HALLUCINATIONS: Never generate statistics, percentages, ROI estimates, or performance improvements unless explicitly in the source data.

SCORE RANGES (follow these strictly):
- 90-100: Enterprise-ready — confirmed budget, growth signals, mature business, strong ICP match
- 70-89:  Strong fit — 2+ positive signals, clear ICP match, Growth+ stage
- 50-69:  Moderate fit — some signals, gaps in evidence
- 30-49:  Weak fit — early stage or low budget without compensating signals
- 0-29:   Poor fit — no budget, no maturity, no signals

Current evidence summary:
- Budget signal: ${evidence.budgetSignal}
- Maturity signal: ${evidence.maturitySignal}
- Growth signal: ${evidence.growthSignal}
- Buying likelihood: ${evidence.buyingLikelihood}
- Limited confidence: ${evidence.limitedConfidence}

Return ONLY this JSON, no markdown:
{
  "score": <integer 0-100>,
  "category": <"Hot" | "Warm" | "Cold" | "Dead">,
  "priority": <"Critical" | "High" | "Medium" | "Low">,
  "recommendedAction": "<specific, evidence-based next step>",
  "reason": "<MANDATORY FORMAT: Start with '[Company name] scored [X] because [what positive signals raised the score — cite specific evidence: growth signals, stated budget, urgency, ICP match, hiring signals, etc.]. However, [what reduced it — cite specific gaps: early stage, $0 revenue, no website data, no budget, low confidence, etc.]. [Final sentence: buying likelihood verdict and recommended sales posture.] RULES: Exactly 2-3 sentences. 40-80 words total. Always open with the company name and the numeric score. Never use generic openers. No invented data.>"
}
`.trim();

  // ── Step 3: Outreach prompt — seller-aware, no generic language ───────────
  const outreachPrompt = getOutreachPrompt(leadCtx, researchCtx, sellerCtx, profile, lead.company || lead.fullName, research, hasRealResearch);

  // ── Step 4: Fire calls in parallel (skip outreach for Internal/Test) ──────
  const groqPromises: Promise<string>[] = [callGroq(scorePrompt, userId, 0.1)];

  if (lead.companyType === 'Internal/Test') {
    console.log('[AI] Internal/Test — skipping outreach generation.');
    groqPromises.push(Promise.resolve(JSON.stringify({ email: '', linkedin: '', callScript: '' })));
  } else {
    groqPromises.push(callGroq(outreachPrompt, userId, 0.35));
  }

  const [scoreRaw, outreachRaw] = await Promise.all(groqPromises);

  const scoreResult   = JSON.parse(scoreRaw);
  const outreachResult = JSON.parse(outreachRaw);

  console.log('[AI] Score result:', scoreResult);
  console.log('[AI] Outreach result keys:', Object.keys(outreachResult));

  // ── Step 5: Validate score result ────────────────────────────────────────
  const scoreResultKeys = Object.keys(scoreResult);
  const scoreKey = scoreResultKeys.find(k => k.toLowerCase() === 'score') || 'score';
  const categoryKey = scoreResultKeys.find(k => k.toLowerCase() === 'category') || 'category';
  const priorityKey = scoreResultKeys.find(k => k.toLowerCase() === 'priority') || 'priority';
  const reasonKey = scoreResultKeys.find(k => k.toLowerCase() === 'reason') || 'reason';
  const recommendedActionKey = scoreResultKeys.find(k => k.toLowerCase() === 'recommendedaction' || k.toLowerCase() === 'recommended_action') || 'recommendedAction';

  const normalizedScoreResult = {
    score: scoreResult[scoreKey],
    category: scoreResult[categoryKey],
    priority: scoreResult[priorityKey],
    reason: scoreResult[reasonKey],
    recommendedAction: scoreResult[recommendedActionKey]
  };

  if (typeof normalizedScoreResult.score !== 'number' || normalizedScoreResult.score < 0 || normalizedScoreResult.score > 100) {
    if (typeof normalizedScoreResult.score === 'string') {
        normalizedScoreResult.score = parseInt(normalizedScoreResult.score, 10);
    }
    if (isNaN(normalizedScoreResult.score)) throw new Error('Invalid score returned');
  }
  
  if (!['Hot', 'Warm', 'Cold', 'Dead'].includes(normalizedScoreResult.category)) {
    const cat = normalizedScoreResult.category?.toString().toLowerCase();
    if (cat === 'hot') normalizedScoreResult.category = 'Hot';
    else if (cat === 'warm') normalizedScoreResult.category = 'Warm';
    else if (cat === 'cold') normalizedScoreResult.category = 'Cold';
    else if (cat === 'dead') normalizedScoreResult.category = 'Dead';
    else throw new Error('Invalid category returned');
  }

  if (!['Critical', 'High', 'Medium', 'Low'].includes(normalizedScoreResult.priority)) {
    const pri = normalizedScoreResult.priority?.toString().toLowerCase();
    if (pri === 'critical') normalizedScoreResult.priority = 'Critical';
    else if (pri === 'high') normalizedScoreResult.priority = 'High';
    else if (pri === 'medium') normalizedScoreResult.priority = 'Medium';
    else if (pri === 'low') normalizedScoreResult.priority = 'Low';
    else throw new Error('Invalid priority returned');
  }

  if (!normalizedScoreResult.reason || normalizedScoreResult.reason.length === 0)
    throw new Error('Invalid reason returned');
  if (!normalizedScoreResult.recommendedAction || normalizedScoreResult.recommendedAction.length === 0)
    throw new Error('Invalid recommended action returned');

  // ── Step 6: Normalize outreach (defensive key handling) ──────────────────
  let raw = (outreachResult && typeof outreachResult === 'object') ? outreachResult : {};
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

  console.log('[AI] RAW OUTREACH JSON PARSED:', JSON.stringify(raw, null, 2));
  
  const emailKey = Object.keys(raw).find(k => k.toLowerCase().includes('email'));
  const linkedinKey = Object.keys(raw).find(k => k.toLowerCase().includes('linkedin'));
  const callKey = Object.keys(raw).find(k => k.toLowerCase().includes('call'));

  const followUp = {
    email: emailKey && typeof raw[emailKey] === 'string' ? raw[emailKey] : '',
    linkedin: linkedinKey && typeof raw[linkedinKey] === 'string' ? raw[linkedinKey] : '',
    callScript: callKey && typeof raw[callKey] === 'string' ? raw[callKey] : '',
  };
  console.log('[AI] NORMALIZED FOLLOWUP:', followUp);

  let suggestedFollowUpDays: number | undefined;
  if (normalizedScoreResult.category === 'Hot') suggestedFollowUpDays = 2;
  else if (normalizedScoreResult.category === 'Warm') suggestedFollowUpDays = 4;
  else if (normalizedScoreResult.category === 'Cold') suggestedFollowUpDays = 7;

  return {
    score:             normalizedScoreResult.score,
    category:          normalizedScoreResult.category,
    priority:          normalizedScoreResult.priority,
    recommendedAction: normalizedScoreResult.recommendedAction,
    reason:            normalizedScoreResult.reason,
    followUp,
    evidence,
    suggestedFollowUpDays,
    analyzedAt: FieldValue.serverTimestamp(),
    // Attach any auto-fetched research so caller can persist it
    ...(research && !lead.research ? { _freshResearch: research } : {}),
  } as AIAnalysis & { _freshResearch?: CompanyKnowledge };
}

export async function regenerateOutreach(lead: Lead, userId: string, profile?: SellerProfile | null): Promise<AIAnalysis['followUp']> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY in environment');
  }

  const research = lead.research ?? null;
  const sellerCtx  = profile ? buildSellerContext(profile) : 'SELLER PROFILE: Not configured. Treat as Arch Revenues, a B2B revenue intelligence platform.';
  const leadCtx    = buildLeadContext(lead);
  const researchCtx = research
    ? buildResearchContext(research)
    : 'WEBSITE INTELLIGENCE: Not available.';

  const hasRealResearch = research?.researchSource === 'website' && research?.confidenceLevel !== 'Low';
  const outreachPrompt = getOutreachPrompt(leadCtx, researchCtx, sellerCtx, profile, lead.company || lead.fullName, research, hasRealResearch);

  const outreachRaw = await callGroq(outreachPrompt, userId, 0.4);
  let raw = (JSON.parse(outreachRaw) && typeof JSON.parse(outreachRaw) === 'object') ? JSON.parse(outreachRaw) : {};
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

// ─── Layer 4: Notes Summarization ────────────────────────────────────────────

export async function generateNotesSummary(notes: Note[], userId: string): Promise<string> {
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
  const jsonStr = await callGroq(prompt, userId, 0.1);
  console.log('[AI SUMMARY] Received response:', jsonStr);

  try {
    const raw = JSON.parse(jsonStr);
    return raw.summary || '';
  } catch (err) {
    console.error('Failed to parse summary JSON:', err);
    return '';
  }
}

// ─── Layer 5: AI Task Generation ─────────────────────────────────────────────

export async function generateTasks(lead: Lead, userId: string, sellerProfile?: SellerProfile | null): Promise<AITask[]> {
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
  const jsonStr = await callGroq(prompt, userId, 0.3);
  console.log('[AI TASKS] Received response:', jsonStr);

  try {
    const raw = JSON.parse(jsonStr);
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
  generatedAt: string;
}

export async function generateDealCoach(lead: Lead, userId: string, sellerProfile?: SellerProfile | null): Promise<DealCoachResult> {
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
  const jsonStr = await callGroq(prompt, userId, 0.2);

  try {
    const raw = JSON.parse(jsonStr);
    return {
      whyItWillClose: raw.whyItWillClose || 'Insufficient data.',
      objections: Array.isArray(raw.objections) ? raw.objections : [],
      decisionMaker: raw.decisionMaker || 'Unknown — needs qualification.',
      bestAngle: raw.bestAngle || 'Focus on identified pain points.',
      bestCta: raw.bestCta || 'Request a 15-minute discovery call.',
      dealStrength: ['Strong', 'Moderate', 'Weak'].includes(raw.dealStrength) ? raw.dealStrength : 'Moderate',
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[AI DEAL COACH] Failed to parse JSON:', err);
    throw new Error('Deal Coach AI returned an unexpected response. Please try again.');
  }
}

export async function generateSingleOutreach(
  type: 'email' | 'linkedin' | 'callScript',
  lead: Lead,
  userId: string,
  profile?: SellerProfile | null
): Promise<string> {
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

  const resContent = await callGroq(prompt, userId, 0.35);
  try {
    const raw = JSON.parse(resContent);
    if (type === 'email') return raw.email || '';
    if (type === 'linkedin') return raw.linkedin || '';
    return raw.callScript || '';
  } catch (err) {
    console.error('Failed to parse single outreach JSON:', err);
    throw new Error('AI returned an unexpected response. Please try again.');
  }
}
