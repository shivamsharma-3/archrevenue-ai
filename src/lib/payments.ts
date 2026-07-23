import { db, auth } from './firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface PaymentItem {
  id: string;
  name: string;
  type: 'plan' | 'token_pack';
  targetRole?: 'starter' | 'pro';
  tokenAmount?: number;
  priceUsd: number;
  priceInr: number;
}

// Current Market USD to INR Exchange Rate
export const USD_TO_INR_RATE = 86.8;

export function getInrPrice(usdPrice: number): number {
  return Math.round(usdPrice * USD_TO_INR_RATE);
}

export const PAYMENT_ITEMS: Record<string, PaymentItem> = {
  starter_monthly: {
    id: 'starter_monthly',
    name: 'Starter Plan',
    type: 'plan',
    targetRole: 'starter',
    priceUsd: 49,
    priceInr: Math.round(49 * USD_TO_INR_RATE), // ~₹4,253
  },
  starter_annual: {
    id: 'starter_annual',
    name: 'Starter Plan (Annual)',
    type: 'plan',
    targetRole: 'starter',
    priceUsd: 39 * 12, // $468
    priceInr: Math.round(39 * 12 * USD_TO_INR_RATE),
  },
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Plan',
    type: 'plan',
    targetRole: 'pro',
    priceUsd: 99,
    priceInr: Math.round(99 * USD_TO_INR_RATE), // ~₹8,593
  },
  pro_annual: {
    id: 'pro_annual',
    name: 'Pro Plan (Annual)',
    type: 'plan',
    targetRole: 'pro',
    priceUsd: 79 * 12, // $948
    priceInr: Math.round(79 * 12 * USD_TO_INR_RATE),
  },
  pack_50k: {
    id: 'pack_50k',
    name: '50,000 Token Boost Pack',
    type: 'token_pack',
    tokenAmount: 50000,
    priceUsd: 19,
    priceInr: Math.round(19 * USD_TO_INR_RATE), // ~₹1,649
  },
  pack_200k: {
    id: 'pack_200k',
    name: '200,000 Token Growth Pack',
    type: 'token_pack',
    tokenAmount: 200000,
    priceUsd: 49,
    priceInr: Math.round(49 * USD_TO_INR_RATE), // ~₹4,253
  },
  pack_500k: {
    id: 'pack_500k',
    name: '500,000 Token Enterprise Boost',
    type: 'token_pack',
    tokenAmount: 500000,
    priceUsd: 99,
    priceInr: Math.round(99 * USD_TO_INR_RATE), // ~₹8,593
  },
};

// Default Gateway Configurations (can be overridden by system config or env)
export const DEFAULT_PAYMENT_CONFIG = {
  upiVpa: 'archrevenues@axl',
  upiName: 'ArchRevenue Intelligence',
  razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_ArchRevenue',
  paypalClientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AQOapkwWqGH70d8oBY-vGz9ohNuuQPdkRA--ZSjG-rSjv7Rq2l1qtvHu4OiCGR92-PGmlO4gdaXD5YNw',
};

// Get current Gateway Config from Firestore or fallbacks
export async function getPaymentConfig() {
  try {
    const snap = await getDoc(doc(db, 'config', 'payments'));
    if (snap.exists()) {
      return { ...DEFAULT_PAYMENT_CONFIG, ...snap.data() };
    }
  } catch (err) {
    console.warn('Could not load payment config from Firestore, using defaults:', err);
  }
  return DEFAULT_PAYMENT_CONFIG;
}

// Dynamically load Razorpay SDK script
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Dynamically load PayPal SDK script
export function loadPayPalScript(clientId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).paypal) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Generate standard UPI URL for scanning QR code or deep linking
export function generateUpiUrl(vpa: string, payeeName: string, amountInr: number, note: string): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName,
    am: amountInr.toFixed(2),
    cu: 'INR',
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

// Generate dynamic QR Code image URL via quickchart API
export function generateQrCodeImageUrl(data: string, size = 220): string {
  return `https://quickchart.io/qr?text=${encodeURIComponent(data)}&size=${size}&margin=1`;
}

// Submit manual UPI Reference ID for verification
export async function submitUpiTransaction(item: PaymentItem, utrNumber: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be logged in');

  const ref = collection(db, 'payment_requests');
  await addDoc(ref, {
    userId: user.uid,
    userEmail: user.email,
    itemId: item.id,
    itemName: item.name,
    amountInr: item.priceInr,
    amountUsd: item.priceUsd,
    paymentMethod: 'upi_manual',
    utrNumber: utrNumber.trim(),
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}
