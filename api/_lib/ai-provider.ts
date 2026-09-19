import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { db } from './firebase-admin.js';
import { checkTokenLimit, incrementTokenUsage } from './usage.js';

export interface AICallResult {
  text: string;
  provider: 'gemini' | 'groq';
  modelName: string;
}

/** Determine if a user is on a paid plan based on their token limit in Firestore */
export async function getUserPlanTier(userId: string): Promise<'free' | 'paid'> {
  if (!userId) return 'free';
  try {
    const usageRef = db.collection('users').doc(userId).collection('usage').doc('tokens');
    const snap = await usageRef.get();
    if (!snap.exists) return 'free';
    const limit = snap.data()?.limit ?? 50000;
    // Starter (100K) and Pro (250K) are paid tiers
    return limit > 50000 ? 'paid' : 'free';
  } catch {
    return 'free'; // safe fallback
  }
}

// Ordered list of Groq models to try
const GROQ_CANDIDATE_MODELS = [
  process.env.GROQ_MODEL,
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
].filter(Boolean) as string[];

/** Groq caller with automatic model fallback */
export async function callGroq(prompt: string, userId: string, temperature = 0.2): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured in environment.');
  }
  if (userId) await checkTokenLimit(userId);

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  let lastError: any = null;

  for (const model of GROQ_CANDIDATE_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from Groq');

      const tokensUsed = completion.usage?.total_tokens || 0;
      if (userId && tokensUsed > 0) {
        await incrementTokenUsage(userId, tokensUsed).catch(err =>
          console.error('[AI] Non-fatal error recording token usage:', err)
        );
      }
      return content;
    } catch (err: any) {
      lastError = err;
      const isModelError =
        err?.status === 404 ||
        err?.code === 'model_not_found' ||
        err?.message?.includes('does not exist') ||
        err?.message?.includes('decommissioned') ||
        err?.message?.includes('not found');

      if (isModelError) {
        console.warn(`[AI] Groq model "${model}" unavailable (${err.message}), trying next fallback model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All configured Groq models failed.');
}

/** Gemini 2.5 Flash caller */
export async function callGemini(prompt: string, userId: string, temperature = 0.2): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }
  if (userId) await checkTokenLimit(userId);

  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature,
      responseMimeType: 'application/json',
    },
  });

  const content = response.text;
  if (!content) throw new Error('Empty response from Gemini');

  const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
  if (userId && tokensUsed > 0) {
    await incrementTokenUsage(userId, tokensUsed).catch(err =>
      console.error('[AI] Non-fatal error recording token usage:', err)
    );
  }
  return content;
}

/** Unified AI dispatcher with plan tier awareness and cross-provider fallback */
export async function callAI(prompt: string, userId: string, temperature = 0.0): Promise<AICallResult> {
  const tier = await getUserPlanTier(userId);
  if (tier === 'paid') {
    console.log('[AI] → Advanced AI Engine (paid user: Gemini)');
    try {
      const text = await callGemini(prompt, userId, temperature);
      return { text, provider: 'gemini', modelName: 'Advanced AI Engine' };
    } catch (err: any) {
      console.warn('[AI] Gemini engine failed/rate-limited for paid user, attempting Groq fallback:', err?.message || err);
      try {
        const text = await callGroq(prompt, userId, temperature);
        return { text, provider: 'groq', modelName: 'Standard AI Engine (Fallback)' };
      } catch (fallbackErr: any) {
        console.error('[AI] Both Gemini and Groq engines failed:', fallbackErr);
        throw new Error('AI Engine rate limit reached. Please wait a moment and click Retry.');
      }
    }
  }

  console.log('[AI] → Standard AI Engine (free user: Groq)');
  try {
    const text = await callGroq(prompt, userId, temperature);
    return { text, provider: 'groq', modelName: 'Standard AI Engine' };
  } catch (err: any) {
    console.warn('[AI] Groq failed for free user, attempting Gemini fallback:', err?.message || err);
    try {
      const text = await callGemini(prompt, userId, temperature);
      return { text, provider: 'gemini', modelName: 'Advanced AI Engine (Fallback)' };
    } catch (fallbackErr: any) {
      console.error('[AI] Both Groq and Gemini failed:', fallbackErr);
      throw new Error('AI Engine rate limit reached. Please wait a moment and click Retry.');
    }
  }
}
