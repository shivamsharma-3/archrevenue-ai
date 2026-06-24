export const maxDuration = 60;
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_lib/auth.js';
import { researchCompany } from './_lib/research.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const uid = await verifyAuth(req, res);
  if (!uid) return;

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Missing url' });
    }
    const result = await researchCompany(url, uid);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in researchCompany:', error);
    return res.status(500).json({ error: error.message || 'Failed to research company' });
  }
}
