import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_lib/auth.js';
import { db } from './_lib/firebase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const uid = await verifyAuth(req, res);
  if (!uid) return;

  try {
    const targetId = req.body.targetUserId || req.body.targetUid;
    const newRole = req.body.role || 'pro'; // Default to pro for backwards compatibility
    
    if (!targetId || typeof targetId !== 'string') {
      return res.status(400).json({ error: 'targetUserId or targetUid is required' });
    }

    // Check if the caller is an admin
    const callerDoc = await db.collection('users').doc(uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You must be an admin to perform this action' });
    }

    // Update the role in the user document
    await db.collection('users').doc(targetId).set({
      role: newRole
    }, { merge: true });

    // Update the tokens limit based on the role
    const tokenLimit = newRole === 'pro' ? 15000000 : (newRole === 'starter' ? 5000000 : 500000);
    const usageRef = db.collection('users').doc(targetId).collection('usage').doc('tokens');
    await usageRef.set({
      limit: tokenLimit,
      tokensUsed: 0,
    }, { merge: true });

    return res.status(200).json({ success: true, message: `Successfully changed user ${targetId} role to ${newRole}` });
  } catch (error: any) {
    console.error('Error in upgradeUser:', error);
    return res.status(500).json({ error: error.message || 'Failed to upgrade user' });
  }
}
