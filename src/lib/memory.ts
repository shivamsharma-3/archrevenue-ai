import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { CompanyKnowledge, Fact } from './types';

/**
 * Normalizes a URL into a clean domain name (e.g. "https://www.stripe.com/billing" -> "stripe.com")
 */
export function normalizeDomain(url: string): string {
  if (!url) return '';
  let domain = url.trim().toLowerCase();
  
  // Remove protocol
  domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
  
  // Strip paths and query parameters
  domain = domain.split('/')[0];
  domain = domain.split('?')[0];
  
  return domain;
}

/**
 * Fetches CompanyKnowledge from the user's persistent company memory collection in Firestore.
 */
export async function fetchCompanyKnowledge(userId: string, domain: string): Promise<CompanyKnowledge | null> {
  if (!userId || !domain) return null;
  
  try {
    const cleanDomain = normalizeDomain(domain);
    if (!cleanDomain) return null;
    
    const docRef = doc(db, 'companies', cleanDomain);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log(`[Memory] Found cached company knowledge for ${cleanDomain}`);
      return docSnap.data() as CompanyKnowledge;
    }
  } catch (err) {
    console.error('[Memory] Error fetching company knowledge:', err);
  }
  
  return null;
}

/**
 * Saves CompanyKnowledge to the user's persistent company memory collection in Firestore.
 */
export async function saveCompanyKnowledge(userId: string, domain: string, newKnowledge: CompanyKnowledge): Promise<void> {
  if (!userId || !domain || !newKnowledge) return;
  
  try {
    const cleanDomain = normalizeDomain(domain);
    if (!cleanDomain) return;
    
    const docRef = doc(db, 'companies', cleanDomain);
    const docSnap = await getDoc(docRef);
    
    let mergedKnowledge = { ...newKnowledge };

    if (docSnap.exists()) {
      const existingKnowledge = docSnap.data() as CompanyKnowledge;
      
      const mergeArrays = (arr1?: string[], arr2?: string[]) => {
        return Array.from(new Set([...(arr1 || []), ...(arr2 || [])]));
      };

      const mergeTimeline = (t1?: CompanyKnowledge['timeline'], t2?: CompanyKnowledge['timeline']) => {
        const allEvents = [...(t1 || []), ...(t2 || [])];
        const uniqueEventsMap = new Map<string, typeof allEvents[0]>();
        
        allEvents.forEach(e => {
          if (!e.date || !e.event) return;
          // deduplicate by date + event string
          const key = `${e.date}_${e.event}`.toLowerCase();
          uniqueEventsMap.set(key, e);
        });

        const merged = Array.from(uniqueEventsMap.values());
        // Sort chronologically descending (newest first)
        return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      };

      const mergeFactArrays = (arr1?: Fact[], arr2?: Fact[]) => {
        const merged = [...(arr1 || []), ...(arr2 || [])];
        const unique = new Map<string, Fact>();
        merged.forEach(f => unique.set(f.value, f));
        return Array.from(unique.values());
      };

      mergedKnowledge = {
        ...existingKnowledge, // keep old base
        ...newKnowledge, // overwrite primitives with new research
        
        facts: {
          ...existingKnowledge.facts,
          ...newKnowledge.facts,
          technologies: mergeFactArrays(existingKnowledge.facts?.technologies, newKnowledge.facts?.technologies),
          hiringSignals: mergeFactArrays(existingKnowledge.facts?.hiringSignals, newKnowledge.facts?.hiringSignals),
        },
        
        signals: {
          ...existingKnowledge.signals,
          ...newKnowledge.signals,
          buying: mergeArrays(existingKnowledge.signals?.buying, newKnowledge.signals?.buying),
          risk: mergeArrays(existingKnowledge.signals?.risk, newKnowledge.signals?.risk),
          growth: mergeArrays(existingKnowledge.signals?.growth, newKnowledge.signals?.growth),
          technology: mergeArrays(existingKnowledge.signals?.technology, newKnowledge.signals?.technology),
        },

        market: {
          ...existingKnowledge.market,
          ...newKnowledge.market,
          competitors: mergeArrays(existingKnowledge.market?.competitors, newKnowledge.market?.competitors),
          products: mergeArrays(existingKnowledge.market?.products, newKnowledge.market?.products),
          targetSegments: mergeArrays(existingKnowledge.market?.targetSegments, newKnowledge.market?.targetSegments),
        },

        timeline: mergeTimeline(existingKnowledge.timeline, newKnowledge.timeline),
        
        services: mergeArrays(existingKnowledge.services, newKnowledge.services),
        growthSignals: mergeArrays(existingKnowledge.growthSignals, newKnowledge.growthSignals),
        hiringSignals: mergeArrays(existingKnowledge.hiringSignals, newKnowledge.hiringSignals),
        painPoints: mergeArrays(existingKnowledge.painPoints, newKnowledge.painPoints),
      };
    }

    await setDoc(docRef, {
      ...mergedKnowledge,
      lastUpdated: new Date().toISOString()
    });
    
    console.log(`[Memory] Successfully persisted and merged company knowledge for ${cleanDomain}`);
  } catch (err) {
    console.error('[Memory] Error saving company knowledge:', err);
  }
}
