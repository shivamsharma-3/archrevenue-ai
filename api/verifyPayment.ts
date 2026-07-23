import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_lib/auth.js';
import { db } from './_lib/firebase-admin.js';
import FieldValue from 'firebase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const uid = await verifyAuth(req, res);
  if (!uid) return;

  try {
    const { itemId, paymentMethod, paymentId, targetRole, tokenAmount, priceUsd } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    const userRef = db.collection('users').doc(uid);

    // Case 1: Plan Upgrade (Starter or Pro)
    if (targetRole && (targetRole === 'starter' || targetRole === 'pro')) {
      await userRef.set({ role: targetRole }, { merge: true });

      const tokenLimit = targetRole === 'pro' ? 250000 : 100000;
      const usageRef = userRef.collection('usage').doc('tokens');
      await usageRef.set({
        limit: tokenLimit,
        tokensUsed: 0,
      }, { merge: true });
    }

    // Case 2: Token Add-on Pack Purchase
    if (tokenAmount && typeof tokenAmount === 'number') {
      const usageRef = userRef.collection('usage').doc('tokens');
      const snap = await usageRef.get();
      const currentLimit = snap.exists ? (snap.data()?.limit || 50000) : 50000;

      await usageRef.set({
        limit: currentLimit + tokenAmount,
      }, { merge: true });
    }

    // Record completed transaction
    await db.collection('transactions').add({
      userId: uid,
      itemId,
      paymentMethod: paymentMethod || 'gateway',
      paymentId: paymentId || 'tx_' + Date.now(),
      targetRole: targetRole || null,
      tokenAmount: tokenAmount || 0,
      amountUsd: priceUsd || 0,
      status: 'completed',
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and entitlement applied successfully',
    });
  } catch (error: any) {
    console.error('Error in verifyPayment:', error);
    return res.status(500).json({ error: error.message || 'Payment verification failed' });
  }
}
