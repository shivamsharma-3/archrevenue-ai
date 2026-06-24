import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initError } from './_lib/firebase-admin.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (initError) {
    return res.status(200).json({ status: 'error', error: initError.message, stack: initError.stack });
  }
  return res.status(200).json({ status: 'ok', message: 'Firebase initialized successfully', env: {
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasGroqKey: !!process.env.GROQ_API_KEY
  }});
}
