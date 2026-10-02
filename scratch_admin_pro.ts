import 'dotenv/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  if (process.env.FIREBASE_PRIVATE_KEY) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    initializeApp({ projectId: 'applet-4581f' });
  }
}

const adminDb = getFirestore();
const adminAuth = getAuth();

async function upgrade() {
  const targetEmail = 'trovetech9@gmail.com';
  try {
    const userRecord = await adminAuth.getUserByEmail(targetEmail);
    console.log(`Found Auth User for ${targetEmail}, UID: ${userRecord.uid}`);
    
    await adminDb.collection('users').doc(userRecord.uid).set({
      email: targetEmail,
      role: 'pro'
    }, { merge: true });

    await adminDb.collection('users').doc(userRecord.uid).collection('usage').doc('tokens').set({
      limit: 250000,
      tokensUsed: 0
    }, { merge: true });

    console.log(`SUCCESS: Upgraded ${targetEmail} (UID: ${userRecord.uid}) to PRO tier (250,000 token limit)!`);
  } catch (err: any) {
    console.error('Error upgrading via admin SDK:', err.message);
  }
  process.exit(0);
}

upgrade();
