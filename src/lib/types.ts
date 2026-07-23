export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'meeting_booked' | 'proposal' | 'won' | 'lost';

export interface ImportBatch {
  id: string;
  userId?: string;
  date: any; // Firestore Timestamp
  totalLeads: number;
  completed: number;
  duplicatesSkipped: number;
  status: 'processing' | 'completed' | 'failed';
}

// ─── Legacy aliases (used by AIScorePanel) ────────────────────────────────────
export type AIScoreCategory = 'Hot' | 'Warm' | 'Cold' | 'Dead';
export interface AIScore {
  score: number;
  category: AIScoreCategory;
  priority: string;
  reason: string;
  recommendedAction?: string;
}

export type NoteType = 'General' | 'Call' | 'Meeting' | 'Objection' | 'Follow-up';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface AITask {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: any; // Firestore Timestamp
  completedAt?: any;
  source: 'ai' | 'manual';
}

export interface Note {
  id: string;
  content: string;
  timestamp: any; // Firestore Timestamp
  isPinned?: boolean;
  type?: NoteType;
}

export interface ActivityLog {
  id: string;
  action: string;
  timestamp: any;
}

export interface CompanyFacts {
  industry: string;
  employees: number;
  fundingStage: string;
  technologies: string[];
  hiringSignals: string[];
}

// ─── AOM: Commercial Event Taxonomy ──────────────────────────────────────────
export type CommercialEventType =
  // Growth
  | 'FUNDING_ROUND'
  | 'HEADCOUNT_EXPANSION'
  | 'MARKET_EXPANSION'
  | 'REVENUE_MILESTONE'
  // Sales Organization
  | 'SDR_HIRING'
  | 'AE_HIRING'
  | 'VP_SALES_HIRED'
  | 'SALES_ENABLEMENT_INVESTMENT'
  // Technology
  | 'TECH_ADOPTION'
  | 'TECH_MIGRATION'
  | 'PRODUCT_LAUNCH'
  | 'API_INTEGRATION'
  // Leadership
  | 'C_SUITE_CHANGE'
  | 'VP_HIRE'
  | 'FOUNDER_DEPARTURE'
  | 'BOARD_CHANGE'
  // Commercial
  | 'PRICING_CHANGE'
  | 'PARTNERSHIP_ANNOUNCED'
  | 'ACQUISITION'
  | 'CUSTOMER_WIN'
  // Risk
  | 'LAYOFF'
  | 'LEADERSHIP_INSTABILITY'
  | 'FUNDING_DELAYED'
  | 'COMPETITIVE_LOSS'
  // Generic fallback
  | 'GENERAL';

// ─── AOM: Signal TTLs (days until expiry) ────────────────────────────────────
export const SIGNAL_LIFETIME_DAYS: Record<CommercialEventType, number> = {
  FUNDING_ROUND:                365,
  HEADCOUNT_EXPANSION:          180,
  MARKET_EXPANSION:             180,
  REVENUE_MILESTONE:            180,
  SDR_HIRING:                   60,
  AE_HIRING:                    60,
  VP_SALES_HIRED:               90,
  SALES_ENABLEMENT_INVESTMENT:  90,
  TECH_ADOPTION:                9999, // effectively permanent
  TECH_MIGRATION:               365,
  PRODUCT_LAUNCH:               120,
  API_INTEGRATION:              365,
  C_SUITE_CHANGE:               90,
  VP_HIRE:                      90,
  FOUNDER_DEPARTURE:            180,
  BOARD_CHANGE:                 180,
  PRICING_CHANGE:               120,
  PARTNERSHIP_ANNOUNCED:        180,
  ACQUISITION:                  365,
  CUSTOMER_WIN:                 180,
  LAYOFF:                       90,
  LEADERSHIP_INSTABILITY:       120,
  FUNDING_DELAYED:              180,
  COMPETITIVE_LOSS:             90,
  GENERAL:                      30,
};

// ─── AOM: Momentum Decay Table ────────────────────────────────────────────────
// Points contribution at day 0, 30, 90, 180, 365
export const MOMENTUM_DECAY: Record<CommercialEventType, [number, number, number, number, number]> = {
  FUNDING_ROUND:                [40, 35, 22, 12,  5],
  HEADCOUNT_EXPANSION:          [20, 18, 12,  6,  2],
  MARKET_EXPANSION:             [20, 18, 12,  6,  2],
  REVENUE_MILESTONE:            [15, 12,  8,  3,  1],
  SDR_HIRING:                   [30, 25, 10,  0,  0],
  AE_HIRING:                    [25, 20,  8,  0,  0],
  VP_SALES_HIRED:               [25, 20, 15,  8,  3],
  SALES_ENABLEMENT_INVESTMENT:  [15, 12,  8,  4,  1],
  TECH_ADOPTION:                [15, 15, 12, 10,  8],
  TECH_MIGRATION:               [20, 18, 14, 10,  5],
  PRODUCT_LAUNCH:               [20, 17, 12,  6,  2],
  API_INTEGRATION:              [15, 14, 12, 10,  8],
  C_SUITE_CHANGE:               [20, 18, 12,  6,  2],
  VP_HIRE:                      [15, 13, 10,  6,  2],
  FOUNDER_DEPARTURE:            [10,  8,  5,  2,  0],
  BOARD_CHANGE:                 [10,  9,  7,  5,  2],
  PRICING_CHANGE:               [15, 12,  8,  3,  0],
  PARTNERSHIP_ANNOUNCED:        [10, 10,  8,  5,  2],
  ACQUISITION:                  [30, 28, 22, 15,  8],
  CUSTOMER_WIN:                 [10, 10,  8,  6,  3],
  LAYOFF:                       [-15, -12, -8, -4, 0],
  LEADERSHIP_INSTABILITY:       [-10, -8, -5, -2,  0],
  FUNDING_DELAYED:              [-10, -8, -5, -2,  0],
  COMPETITIVE_LOSS:             [-8, -6, -4, -2,   0],
  GENERAL:                      [5,   4,  3,  1,   0],
};

// ─── AOM: Evidence ────────────────────────────────────────────────────────────
export interface Evidence {
  id?: string;
  companyDomain: string;
  source: string;          // exact URL or API
  rawContent: string;      // unmodified observation
  collectedAt: string;
  extractor: 'scrape' | 'api' | 'manual';
  confidence: number;      // 0-100 extraction confidence
}

// ─── AOM: Fact (versioned & maturing) ─────────────────────────────────────────
export interface Fact {
  id?: string;
  companyDomain: string;
  category: 'Industry' | 'Employees' | 'Technology' | 'FundingStage' | 'Headquarters' | 'Product' | 'Pricing' | 'Other';
  value: string;
  previousValue?: string;
  confidence: number;     // 0-100 evolves based on sources
  evidenceIds: string[];
  confirmationCount: number;
  firstSeenAt: string;
  lastConfirmedAt: string;
  maturityLevel: 'Observed' | 'Corroborated' | 'Established';
  freshness: string;      // Time since last confirmed
  provenance: string[];   // Explicit list of source URLs
}

// ─── AOM: Commercial Event ────────────────────────────────────────────────────
export interface CommercialEvent {
  id?: string;
  companyDomain: string;
  type: CommercialEventType;
  description: string;          // Human-readable: "Hired 18 Senior SDRs"
  source?: string;
  confidence: number;           // 0-100
  revenueImpactScore: number;   // 0-100 deterministic
  detectedAt: string;
  expiresAt: string;
  affectedDepartments?: string[];
  relatedEventIds?: string[];
  evidenceIds?: string[];
}

// ─── AOM: Signal (active, time-bounded) ──────────────────────────────────────
export interface ActiveSignal {
  eventId: string;
  type: CommercialEventType;
  description: string;
  activatedAt: string;
  expiresAt: string;
  currentMomentumContribution: number; // decayed value at time of query
}

// ─── AOM: Company Intelligence Record ────────────────────────────────────────
export type CompanyTemperature = 'Cold' | 'Warm' | 'Heating' | 'Hot' | 'Buying';

export interface CompanyIntelligenceRecord {
  domain: string;
  canonicalName?: string;
  companyName?: string;

  // Stable facts (versioned, never overwritten)
  facts: {
    industry?: Fact;
    employees?: Fact;
    fundingStage?: Fact;
    technologies?: Fact[];
    headquarters?: Fact;
    products?: Fact[];
    hiringSignals?: Fact[]; // legacy compat
  };

  // Cached active commercial events for fast UI rendering
  activeEvents?: CommercialEvent[];

  // Active signals (derived from events, respects TTL)
  signals: {
    hiring: string[];
    expansion: string[];
    pricing: string[];
    leadership: string[];
    techAdoption: string[];
    buying?: string[];    // legacy compat
    risk?: string[];      // legacy compat
    growth?: string[];    // legacy compat
    technology?: string[]; // legacy compat
  };

  // Derived metrics (computed by engines, never manually set)
  temperature: CompanyTemperature; // Legacy — keeping for Dashboard/Pipeline compat for now
  momentum: {
    score: number;
    timeframe: 'Last 30 days' | 'Last 7 days';
  };
  intelligenceQuality?: {
    overall: number; // 0-100
    coverage: {
      website: number; // 0-5
      hiring: number;
      leadership: number;
      funding: number;
      techStack: number;
      marketSignals: number;
    };
    freshness: {
      website: string; // ISO String timestamp or relative like "3 hours ago"
      hiring: string;
      leadership: string;
      funding: string;
      pricing: string;
    };
  };

  // AI-generated explanation (constrained to verified facts)
  reasoning: string;

  // Deterministic predictions
  predictions: { label: string; probability: number }[];

  lastSnapshottedAt: string;

  // Legacy backwards-compat fields (remove after full migration)
  opportunityScore?: number;
  confidenceLevel?: 'High' | 'Medium' | 'Low';
  industry?: string;
  services?: string[];
  summary?: string;
  painPoints?: string[];
  growthSignals?: string[];
  recommendedPitch?: string;
  hiringSignals?: string[];
  customerSegment?: string;
  businessMaturity?: 'Early-stage' | 'Growth' | 'Mature' | 'Enterprise' | 'Unknown';
  researchSource?: 'website' | 'form-only';
  tokensUsed?: number;
  timeline?: { date: string; event: string; type: string }[];
  market?: { competitors: string[]; products: string[]; targetSegments: string[] };
  
  // Evals debug info
  rawOutput?: any;
}

export type CompanyKnowledge = CompanyIntelligenceRecord;

// ─── AOM: Revenue Opportunity (volatile computation) ───────────────────────────
export interface BuyingWindow {
  openedAt: string;
  peakAt: string;
  expiresAt: string;
  daysRemaining: number;
  status: 'Peak' | 'Closing' | 'Opening' | 'Closed';
}

export interface RevenueOpportunity {
  companyDomain: string;
  companyName?: string;
  opportunityScore: number;     // 0-100 deterministic multi-factor
  momentum: number;
  triggeringEvents: CommercialEvent[];
  buyingWindow: BuyingWindow;
  commercialNarrative?: string;
  
  // Four required answers (AOM Law 7)
  whatChanged: string;
  whyItMatters: string;
  whatToDo: string;
  whyNow: string;
  
  // Scoring breakdown
  scoreBreakdown: {
    icpMatch: number;       // 0-30
    momentumScore: number;  // 0-40
    signalStrength: number; // 0-15
    timingUrgency: number;  // 0-5
    relationshipBonus: number; // 0-10
  };
  
  confidence: number;
  intelligenceQualityScore: number;
  personalizationAdjustment: number;
}

// ─── AOM: Mission Briefing ────────────────────────────────────────────────────
export interface MissionBriefing {
  generatedAt: string;
  userName: string;
  hotOpportunities: RevenueOpportunity[];
  watchList: { companyDomain: string; companyName?: string; momentum: number; temperature: CompanyTemperature; reason: string }[];
  coolingOpportunities: { companyDomain: string; companyName?: string; daysSinceLastEvent: number; reason: string }[];
  estimatedRevenueUnlocked: number;
  summary: string;
}

// ─── AOM: Commercial Memory ───────────────────────────────────────────────────
export interface CommercialMemory {
  id?: string;
  companyDomain: string;
  userId: string;
  recommendedAction: string;
  recommendedAt: string;
  userResponse: 'acted' | 'ignored' | 'modified' | 'snoozed' | 'pending';
  outcome: 'meeting' | 'deal' | 'no_response' | 'lost' | 'pending';
  triggeringEventIds: string[];
}




export interface AIFollowUp {
  objective?: string;
  messagingAngle?: string;
  painPoints?: string[];
  email: string;
  linkedin: string;
  callScript: string;
}

export interface ScoringEvidence {
  websiteWeight: number;
  formWeight: number;
  budgetSignal: string;
  maturitySignal: string;
  growthSignal: string;
  buyingLikelihood: string;
  limitedConfidence: boolean;
}

export interface AIAnalysis {
  score: number;               // 0-100
  category: string;            // Hot | Warm | Cold | Dead
  priority: string;            // Critical | High | Medium | Low
  recommendedAction: string;
  reason: string;
  analyzedAt: any;             // Firestore Timestamp
  followUp?: AIFollowUp;
  evidence?: ScoringEvidence;
  suggestedFollowUpDays?: number;
  aiProvider?: 'gemini' | 'groq';
  aiModel?: string;            // e.g. "Gemini 2.5 Flash" or "Llama 3.3 (Groq)"
}

export type CompanyType = 'Prospect' | 'Competitor' | 'Partner' | 'Internal/Test';

// ─── Seller Profile ────────────────────────────────────────────────────────────
// Stored in Firestore at users/{userId}/profile/main
// Injected into every AI call so the AI knows who WE are and what WE sell

export interface SellerProfile {
  // Company Information
  companyName: string;
  website?: string;
  industry?: string;
  description?: string;

  // Offer Information
  primaryOffer: string;
  offerDescription?: string;
  valueProposition?: string;
  pricingModel?: 'Monthly Subscription' | 'Annual Contract' | 'Per Seat' | 'Usage-based' | 'One-time';
  startingPrice?: string;

  // Ideal Customer Profile (ICP)
  targetIndustry?: string;
  targetCompanySize?: string;
  targetRevenueRange?: string;
  targetGeography?: string;
  painPointsSolved?: string;
  competitors?: string;

  // Sales Preferences
  tone?: 'Professional' | 'Conversational' | 'Direct' | 'Consultative';
  outreachStyle?: 'Cold Email' | 'LinkedIn-first' | 'Phone-first' | 'Multi-channel';
  ctaStyle?: string;

  // Meta
  createdAt?: any;
  updatedAt?: any;
  setupComplete?: boolean;
}

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface JobState {
  id: string;
  name: string;
  status: JobStatus;
  startedAt?: any; // Firestore Timestamp
  completedAt?: any; // Firestore Timestamp
  tokensUsed: number;
  error?: string;
}

export interface WorkflowState {
  runId: string;
  status: 'queued' | 'running' | 'completed' | 'partial_success' | 'failed';
  startedAt: any; // Firestore Timestamp
  completedAt?: any; // Firestore Timestamp
  jobs: Record<string, JobState>;
  summary?: string;
}

export interface Lead {
  id?: string;
  userId?: string;
  userEmail?: string;

  // Core Information
  fullName: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  website?: string;
  companyType?: CompanyType;

  // Business Intelligence
  industry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';
  monthlyRevenue?: string;
  estimatedBudget?: string;
  leadSource?: string;

  // Qualification Information
  painPoint?: string;
  currentSolution?: string;
  urgency?: 'Low' | 'Medium' | 'High' | 'Critical';
  interestedService?: string;

  status: LeadStatus;
  createdAt?: any;
  updatedAt?: any;

  aiAnalysis?: AIAnalysis;
  activities?: ActivityLog[];
  research?: CompanyKnowledge;
  notes?: Note[];
  notesSummary?: string;
  tasks?: AITask[];
  dealCoach?: DealCoachResult;

  // AI Workflow Engine State
  activeWorkflow?: WorkflowState;

  // Follow-Up Reminder System
  followUpDate?: any; // Firestore Timestamp
  followUpStatus?: 'scheduled' | 'due_today' | 'overdue' | 'completed';
  lastContactedAt?: any; // Firestore Timestamp

  // Email Analytics & Threading
  lastEmailMessageId?: string;
  lastEmailThreadId?: string;
  analytics?: {
    sent: number;
    opens: number;
    replies: number;
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
export interface DealCoachResult {
  whyItWillClose?: string;
  objections: string[];
  decisionMaker?: string;
  bestAngle?: string;
  bestCta?: string;
  
  blockers?: string[];
  talkTrack?: string;
  recommendedActions?: string[];
  dealStrength?: 'Strong' | 'Moderate' | 'Weak';
  tokensUsed?: number;
}
