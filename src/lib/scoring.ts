import { Lead, SellerProfile, CompanyKnowledge } from './types';

export interface FactorScoreBreakdown {
  companySizeFit: number;       // 0-100 (25% weight)
  industryMatch: number;        // 0-100 (20% weight)
  techOverlap: number;          // 0-100 (20% weight)
  growthSignals: number;        // 0-100 (15% weight)
  engagementPotential: number;  // 0-100 (10% weight)
  buyingIntent: number;         // 0-100 (10% weight)
}

export interface DeterministicScoreResult {
  overallScore: number;
  category: 'Hot' | 'Warm' | 'Cold' | 'Dead';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  factorScores: FactorScoreBreakdown;
  reasons: string[];
}

export function calculateDeterministicScore(
  lead: Partial<Lead>,
  sellerProfile?: SellerProfile | null,
  researchData?: CompanyKnowledge | null
): DeterministicScoreResult {
  // 1. Company Size Fit (25%)
  let companySizeFit = 50; // default baseline
  const leadSize = lead.companySize || researchData?.facts?.employees?.value;
  const targetSize = sellerProfile?.targetCompanySize || '51-200';

  if (leadSize) {
    if (leadSize === targetSize) {
      companySizeFit = 100;
    } else if (
      (targetSize === '51-200' && (leadSize === '11-50' || leadSize === '201-1000')) ||
      (targetSize === '201-1000' && (leadSize === '51-200' || leadSize === '1000+'))
    ) {
      companySizeFit = 75;
    } else if (leadSize === '1000+' || leadSize === '201-1000') {
      companySizeFit = 80; // Enterprise bias
    } else {
      companySizeFit = 40;
    }
  }

  // 2. Industry Match (20%)
  let industryMatch = 50;
  const leadIndustry = (lead.industry || researchData?.industry || '').toLowerCase();
  const targetIndustry = (sellerProfile?.targetIndustry || '').toLowerCase();

  if (leadIndustry && targetIndustry) {
    if (leadIndustry.includes(targetIndustry) || targetIndustry.includes(leadIndustry)) {
      industryMatch = 100;
    } else if (
      leadIndustry.includes('tech') ||
      leadIndustry.includes('saas') ||
      leadIndustry.includes('software') ||
      leadIndustry.includes('finance') ||
      leadIndustry.includes('healthcare')
    ) {
      industryMatch = 75;
    } else {
      industryMatch = 45;
    }
  } else if (leadIndustry) {
    industryMatch = 65;
  }

  // 3. Tech Stack Overlap (20%)
  let techOverlap = 40;
  const techList = researchData?.facts?.technologies?.map(t => t.value.toLowerCase()) || [];
  const competitors = (sellerProfile?.competitors || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  
  if (techList.length > 0) {
    techOverlap = Math.min(100, 50 + techList.length * 10);
    // If using competing tech, high intent
    if (competitors.some(comp => comp && techList.some(t => t.includes(comp)))) {
      techOverlap = 95;
    }
  } else if (lead.website) {
    techOverlap = 60; // Web presence exists
  }

  // 4. Growth Signals (15%)
  let growthSignals = 30;
  const growthList = researchData?.growthSignals || researchData?.signals?.growth || [];
  if (growthList.length >= 3) {
    growthSignals = 100;
  } else if (growthList.length === 2) {
    growthSignals = 80;
  } else if (growthList.length === 1) {
    growthSignals = 65;
  } else if (lead.monthlyRevenue || lead.estimatedBudget) {
    growthSignals = 60;
  }

  // 5. Engagement Potential (10%)
  let engagementPotential = 40;
  if (lead.email && lead.phone && lead.website) {
    engagementPotential = 100;
  } else if (lead.email && (lead.website || lead.phone)) {
    engagementPotential = 80;
  } else if (lead.email) {
    engagementPotential = 60;
  }

  // 6. Buying / Hiring Intent Signals (10%)
  let buyingIntent = 30;
  const hiringList = researchData?.hiringSignals || researchData?.signals?.hiring || [];
  if (hiringList.length > 0) {
    buyingIntent = Math.min(100, 60 + hiringList.length * 15);
  } else if (lead.urgency === 'Critical' || lead.urgency === 'High') {
    buyingIntent = 85;
  } else if (lead.urgency === 'Medium') {
    buyingIntent = 60;
  }

  // Calculate Weighted Total Score
  const weightedScore = Math.round(
    companySizeFit * 0.25 +
    industryMatch * 0.20 +
    techOverlap * 0.20 +
    growthSignals * 0.15 +
    engagementPotential * 0.10 +
    buyingIntent * 0.10
  );

  const finalScore = Math.max(0, Math.min(100, weightedScore));

  // Determine Category and Priority
  let category: 'Hot' | 'Warm' | 'Cold' | 'Dead' = 'Cold';
  let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';

  if (finalScore >= 80) {
    category = 'Hot';
    priority = 'Critical';
  } else if (finalScore >= 60) {
    category = 'Warm';
    priority = 'High';
  } else if (finalScore >= 40) {
    category = 'Cold';
    priority = 'Medium';
  } else {
    category = 'Dead';
    priority = 'Low';
  }

  // Generate transparent reasoning strings
  const reasons: string[] = [];

  reasons.push(`Company Size Fit (${companySizeFit}/100): ${leadSize ? `${leadSize} employees aligns with target parameters` : 'Size unconfirmed, estimated from market footprint'}.`);
  reasons.push(`Industry Match (${industryMatch}/100): ${leadIndustry ? `Operates in ${leadIndustry}` : 'General commercial sector'}.`);
  if (techList.length > 0) {
    reasons.push(`Tech Stack Overlap (${techOverlap}/100): Detected ${techList.slice(0, 3).join(', ')}.`);
  }
  if (growthList.length > 0) {
    reasons.push(`Growth Signals (${growthSignals}/100): ${growthList[0]}.`);
  }
  if (hiringList.length > 0) {
    reasons.push(`Hiring Intent (${buyingIntent}/100): ${hiringList[0]}.`);
  }

  return {
    overallScore: finalScore,
    category,
    priority,
    factorScores: {
      companySizeFit,
      industryMatch,
      techOverlap,
      growthSignals,
      engagementPotential,
      buyingIntent
    },
    reasons
  };
}
