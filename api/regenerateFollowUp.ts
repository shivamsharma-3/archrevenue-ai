import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_lib/auth';
import { regenerateOutreach } from './_lib/ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const uid = await verifyAuth(req, res);
  if (!uid) return;

  try {
    const { lead, profile } = req.body;
    const result = await regenerateOutreach(lead, uid, profile);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in regenerateFollowUp:', error);
    return res.status(500).json({ error: error.message || 'Failed to regenerate follow up' });
  }
}
