import { db, FieldValue } from './firebase-admin.js';

export const DEFAULT_TOKEN_LIMIT = 50000;

export interface TokenUsage {
  tokensUsed: number;
  limit: number;
  lastUpdated: any;
}

export async function checkTokenLimit(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to check token limits.');
  }

  const usageRef = db.collection('users').doc(userId).collection('usage').doc('tokens');
  const snap = await usageRef.get();

  if (!snap.exists) {
    await usageRef.set({
      tokensUsed: 0,
      limit: DEFAULT_TOKEN_LIMIT,
      lastUpdated: FieldValue.serverTimestamp()
    });
    return;
  }

  const data = snap.data() as TokenUsage;
  const currentLimit = data.limit ?? DEFAULT_TOKEN_LIMIT;
  
  if (data.tokensUsed >= currentLimit) {
    throw new Error(`Token limit exceeded. You have used ${data.tokensUsed} / ${currentLimit} tokens. Please upgrade your plan to continue using AI features.`);
  }
}

export async function incrementTokenUsage(userId: string, newTokens: number): Promise<void> {
  if (!userId || newTokens <= 0) return;

  const usageRef = db.collection('users').doc(userId).collection('usage').doc('tokens');
  
  try {
    await usageRef.update({
      tokensUsed: FieldValue.increment(newTokens),
      lastUpdated: FieldValue.serverTimestamp()
    });
  } catch (error: any) {
    if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
      await usageRef.set({
        tokensUsed: newTokens,
        limit: DEFAULT_TOKEN_LIMIT,
        lastUpdated: FieldValue.serverTimestamp()
      });
    } else {
      console.error('Failed to increment token usage:', error);
    }
  }
}
