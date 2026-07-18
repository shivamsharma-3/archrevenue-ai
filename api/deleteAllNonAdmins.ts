import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/firebase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const usersSnap = await db.collection('users').get();
    let deletedCount = 0;
    
    for (const doc of usersSnap.docs) {
      if (doc.data().role !== 'admin') {
        await doc.ref.delete();
        deletedCount++;
      }
    }
    
    return res.status(200).json({ success: true, deletedCount });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
