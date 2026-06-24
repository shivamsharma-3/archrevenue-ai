import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let initError: any = null;
try {
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
      initializeApp();
    }
  }
} catch (error) {
  console.error('FIREBASE INIT ERROR:', error);
  initError = error;
}

export const db = initError ? {} as any : getFirestore();
export const auth = initError ? {} as any : getAuth();
export { FieldValue, initError };
