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

export interface CompanyResearch {
  // Core
  industry: string;
  services: string[];
  summary: string;
  opportunityScore: number; // 0-100
  painPoints: string[];
  growthSignals: string[];
  recommendedPitch: string;

  // Extended intelligence
  hiringSignals: string[];
  customerSegment: string;
  businessMaturity: 'Early-stage' | 'Growth' | 'Mature' | 'Enterprise' | 'Unknown';
  confidenceLevel: 'High' | 'Medium' | 'Low';
  researchSource: 'website' | 'form-only';
}

export interface AIFollowUp {
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
  pricingModel?: 'Monthly Subscription' | 'Annual Contract' | 'Per Seat' | 'Usage-based' | 'One-time';
  startingPrice?: string;

  // Ideal Customer Profile (ICP)
  targetIndustry?: string;
  targetCompanySize?: string;
  targetRevenueRange?: string;
  targetGeography?: string;

  // Sales Preferences
  tone?: 'Professional' | 'Conversational' | 'Direct' | 'Consultative';
  outreachStyle?: 'Cold Email' | 'LinkedIn-first' | 'Phone-first' | 'Multi-channel';
  ctaStyle?: string;

  // Meta
  createdAt?: any;
  updatedAt?: any;
  setupComplete?: boolean;
}

export interface Lead {
  id?: string;
  userId?: string;
  userEmail?: string;

  // Core Information
  fullName: string;
  email?: string;
  phone?: string;
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
  research?: CompanyResearch;
  notes?: Note[];
  notesSummary?: string;
  tasks?: AITask[];

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
  blockers: string[];
  talkTrack: string;
  recommendedActions: string[];
}
