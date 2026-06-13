import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { SellerProfile } from './types';

const profileDocRef = (userId: string) =>
  doc(db, 'users', userId, 'profile', 'main');

/**
 * Load the seller profile for a given user.
 * Returns null if no profile exists yet.
 */
export async function getProfile(userId: string): Promise<SellerProfile | null> {
  try {
    const snap = await getDoc(profileDocRef(userId));
    if (!snap.exists()) return null;
    return snap.data() as SellerProfile;
  } catch (err) {
    console.error('[profile] Failed to load profile:', err);
    return null;
  }
}

/**
 * Save (or update) the seller profile.
 * Always stamps updatedAt and sets setupComplete = true.
 */
export async function saveProfile(userId: string, data: Partial<SellerProfile>): Promise<void> {
  await setDoc(
    profileDocRef(userId),
    {
      ...data,
      setupComplete: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Quick check: has this user completed the initial profile setup?
 */
export async function hasCompletedSetup(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  return !!profile?.setupComplete;
}
