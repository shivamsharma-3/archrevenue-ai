import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/firebase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const snap = await db.collection('system_logs').limit(5).get();
    return res.status(200).json({ success: true, count: snap.size, logs: snap.docs.map(d => d.data()) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
