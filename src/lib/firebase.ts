import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // CRITICAL
export const auth = getAuth(app);
export const functions = getFunctions(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export const calendarProvider = new GoogleAuthProvider();
calendarProvider.addScope('email');
calendarProvider.addScope('profile');
calendarProvider.addScope('https://www.googleapis.com/auth/calendar.events');

export const gmailProvider = new GoogleAuthProvider();
gmailProvider.addScope('email');
gmailProvider.addScope('profile');
gmailProvider.addScope('https://www.googleapis.com/auth/gmail.send');

/**
 * Sign in with Google.
 * Tries popup first (instant UX). If the browser blocks popups (popup-blocked
 * error), falls back to redirect flow automatically.
 * After a redirect, getRedirectResult() in App.tsx picks up the result.
 */
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      localStorage.setItem('gcal_token', credential.accessToken);
    }
    return result;
  } catch (error: any) {
    // Popup was blocked or closed by user — fall back to redirect
    if (
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      // Redirect flow: page will reload and App.tsx will catch the result
      await signInWithRedirect(auth, googleProvider);
      return null; // Never reached — page redirects
    }
    console.error('Google sign-in error:', error);
    throw error;
  }
};

/**
 * Call this on app startup to complete any in-progress redirect sign-in.
 * Returns the UserCredential if a redirect just completed, otherwise null.
 */
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem('gcal_token', credential.accessToken);
      }
    }
    return result;
  } catch (error: any) {
    // auth/account-exists-with-different-credential etc.
    console.error('Redirect result error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('gcal_token');
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
};

export const connectCalendar = async () => {
  try {
    if (auth.currentUser?.email) {
      calendarProvider.setCustomParameters({
        login_hint: auth.currentUser.email
      });
    }
    const result = await signInWithPopup(auth, calendarProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      localStorage.setItem('gcal_token', credential.accessToken);
      return credential.accessToken;
    }
    throw new Error('No access token received');
  } catch (error) {
    console.error('Calendar connection error:', error);
    throw error;
  }
};

export const connectGmail = async () => {
  try {
    if (auth.currentUser?.email) {
      gmailProvider.setCustomParameters({
        login_hint: auth.currentUser.email
      });
    }
    const result = await signInWithPopup(auth, gmailProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      localStorage.setItem('gmail_token', credential.accessToken);
      // We can also store the connected email from result.user.email if needed
      return { token: credential.accessToken, email: result.user.email };
    }
    throw new Error('No access token received');
  } catch (error) {
    console.error('Gmail connection error:', error);
    throw error;
  }
};
