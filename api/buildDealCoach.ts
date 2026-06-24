export const maxDuration = 60;
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_lib/auth.js';
import { generateDealCoach } from './_lib/ai.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const uid = await verifyAuth(req, res);
  if (!uid) return;

  try {
    const { lead, profile } = req.body;
    const result = await generateDealCoach(lead, uid, profile);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in buildDealCoach:', error);
    return res.status(500).json({ error: error.message || 'Failed to build deal coach' });
  }
}
