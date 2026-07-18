import { collection, doc, addDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, app } from './firebase';

export const STRIPE_PRICING = {
  STARTER: 'price_placeholder_starter', // TODO: Replace with actual Stripe Price ID
  PRO: 'price_placeholder_pro',         // TODO: Replace with actual Stripe Price ID
  ENTERPRISE: 'price_placeholder_ent',  // TODO: Replace with actual Stripe Price ID
  TOKEN_PACK: 'price_placeholder_pack', // Used in TokenUpgradeModal
  TOKEN_PACK_1M: 'price_placeholder_1m',
  TOKEN_PACK_5M: 'price_placeholder_5m',
  TOKEN_PACK_15M: 'price_placeholder_15m',
};

export const PRICING_CONFIG = {
  STARTER_PRICE: 49,
};

export const createCheckoutSession = async (uid: string, priceId: string) => {
  const checkoutSessionRef = collection(db, 'customers', uid, 'checkout_sessions');
  
  const docRef = await addDoc(checkoutSessionRef, {
    price: priceId,
    success_url: window.location.origin + '/?checkout=success',
    cancel_url: window.location.origin + '/',
  });

  // Wait for the CheckoutSession to get attached by the Firebase extension
  return new Promise<void>((resolve, reject) => {
    const unsubscribe = onSnapshot(docRef, (snap) => {
      const data = snap.data();
      if (data?.url) {
        unsubscribe();
        window.location.assign(data.url);
        resolve();
      }
      if (data?.error) {
        unsubscribe();
        reject(new Error(data.error.message));
      }
    });
  });
};

export const createPortalLink = async () => {
  const functions = getFunctions(app, 'us-central1');
  // 'ext-firestore-stripe-payments-createPortalLink' is the default function name deployed by the Stripe Firebase extension
  const functionRef = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
  
  try {
    const { data } = await functionRef({ returnUrl: window.location.origin + '/' }) as any;
    window.location.assign(data.url);
  } catch (error) {
    console.error('Error creating portal link:', error);
    throw error;
  }
};
