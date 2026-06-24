import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const DEFAULT_TOKEN_LIMIT = 50000;

export interface TokenUsage {
  tokensUsed: number;
  limit: number;
  lastUpdated: any;
}

/**
 * Checks if the user has reached their token limit.
 * Throws an error if the limit is exceeded.
 */
export async function checkTokenLimit(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to check token limits.');
  }

  const usageRef = doc(db, 'users', userId, 'usage', 'tokens');
  const snap = await getDoc(usageRef);

  if (!snap.exists()) {
    // If usage tracking doesn't exist yet, assume 0 tokens used.
    // The backend handles initialization and incrementing securely.
    return;
  }

  const data = snap.data() as TokenUsage;
  const currentLimit = data.limit ?? DEFAULT_TOKEN_LIMIT;
  
  if (data.tokensUsed >= currentLimit) {
    throw new Error(`Token limit exceeded. You have used ${data.tokensUsed} / ${currentLimit} tokens. Please upgrade your plan to continue using AI features.`);
  }
}

/**
 * Increments the token usage for the user.
 */
export async function incrementTokenUsage(userId: string, newTokens: number): Promise<void> {
  // Token increments are now securely handled by the Firebase Cloud Functions backend.
  console.log('[Usage] Token increment bypass — handled by secure backend.');
}
