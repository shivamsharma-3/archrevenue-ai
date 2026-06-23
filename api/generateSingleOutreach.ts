import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_lib/auth';
import { generateSingleOutreach } from './_lib/ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const uid = await verifyAuth(req, res);
  if (!uid) return;

  try {
    const { type, lead, profile } = req.body;
    const result = await generateSingleOutreach(type, lead, uid, profile);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in generateSingleOutreach:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate single outreach' });
  }
}
