import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth } from './firebase-admin.js';

export async function verifyAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (err) {
    console.error('Error verifying Firebase ID token:', err);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return null;
  }
}
