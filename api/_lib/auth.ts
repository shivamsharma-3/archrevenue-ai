import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, initError } from './firebase-admin.js';

export async function verifyAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  if (initError) {
    res.status(500).json({ error: 'Firebase Admin Init Error: ' + (initError.message || String(initError)) });
    return null;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (err: any) {
    console.error('Error verifying Firebase ID token:', err);
    res.status(401).json({ error: 'Unauthorized: ' + (err.message || 'Invalid token') });
    return null;
  }
}
