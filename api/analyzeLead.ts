export const maxDuration = 60;
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_lib/auth.js';
import { scoreLead } from './_lib/ai.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const uid = await verifyAuth(req, res);
  if (!uid) return; // verifyAuth handles the response if invalid

  try {
    const { lead, profile } = req.body;
    if (!lead) {
      return res.status(400).json({ error: 'Missing lead object' });
    }
    const result = await scoreLead(lead, uid, profile);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in analyzeLead:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze lead' });
  }
}
