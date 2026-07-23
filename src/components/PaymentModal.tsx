import React, { useState, useEffect } from 'react';
import { AppModal } from './ui/AppModal';
import { AppButton } from './ui/AppButton';
import {
  PaymentItem, getPaymentConfig, loadRazorpayScript, loadPayPalScript,
  generateUpiUrl, generateQrCodeImageUrl, submitUpiTransaction
} from '../lib/payments';
import { auth } from '../lib/firebase';
import { CreditCard, QrCode, Globe, Copy, Check, Sparkles, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PaymentItem;
  onSuccess?: () => void;
}

type PaymentTab = 'razorpay' | 'upi' | 'paypal';

export function PaymentModal({ isOpen, onClose, item, onSuccess }: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>('razorpay');
  const [config, setConfig] = useState({ upiVpa: 'archrevenue@upi', upiName: 'ArchRevenue', razorpayKeyId: 'rzp_test_ArchRevenue', paypalClientId: 'sb' });
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmittingUpi, setIsSubmittingUpi] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [isPaypalLoading, setIsPaypalLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getPaymentConfig().then(setConfig);
    }
  }, [isOpen]);

  // Razorpay Checkout Handler
  const handleRazorpayPayment = async () => {
    setIsRazorpayLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load Razorpay SDK. Please check your internet connection.');
        setIsRazorpayLoading(false);
        return;
      }

      const user = auth.currentUser;
      const options = {
        key: config.razorpayKeyId,
        amount: Math.round(item.priceInr * 100), // In paise
        currency: 'INR',
        name: 'ArchRevenue Intelligence',
        description: item.name,
        prefill: {
          email: user?.email || '',
        },
        theme: {
          color: '#4F46E5', // Indigo accent
        },
        handler: async (response: any) => {
          const toastId = toast.loading('Verifying payment & updating plan...');
          try {
            const token = await user?.getIdToken();
            const res = await fetch('/api/verifyPayment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                itemId: item.id,
                paymentMethod: 'razorpay',
                paymentId: response.razorpay_payment_id,
                targetRole: item.targetRole,
                tokenAmount: item.tokenAmount,
                priceUsd: item.priceUsd,
              }),
            });

            if (!res.ok) throw new Error('Payment verification failed');

            toast.success('Payment successful! Your account has been upgraded.', { id: toastId });
            onSuccess?.();
            onClose();
            window.location.reload();
          } catch (err: any) {
            toast.error(err.message || 'Verification failed. Please contact support.', { id: toastId });
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error('Razorpay initialization failed: ' + err.message);
    } finally {
      setIsRazorpayLoading(false);
    }
  };

  // UPI Manual Transaction Submission
  const handleSubmitUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      toast.error('Please enter the 12-digit UPI Reference / UTR Number');
      return;
    }

    setIsSubmittingUpi(true);
    try {
      await submitUpiTransaction(item, utrNumber);
      toast.success('UPI Reference submitted! Instant verification in progress. Our team will credit your account shortly.');
      setUtrNumber('');
      onClose();
    } catch (err: any) {
      toast.error('Failed to submit UPI reference: ' + err.message);
    } finally {
      setIsSubmittingUpi(false);
    }
  };

  // Copy UPI VPA Helper
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(config.upiVpa);
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  // Dynamic UPI URL & QR
  const upiUrl = generateUpiUrl(config.upiVpa, config.upiName, item.priceInr, `${item.name} - ${auth.currentUser?.email || ''}`);
  const qrImageUrl = generateQrCodeImageUrl(upiUrl);

  return (
    <AppModal isOpen={isOpen} onClose={onClose} title={`Checkout — ${item.name}`} maxWidth="md">
      <div className="space-y-6">
        
        {/* Item Summary Banner */}
        <div className="p-4 bg-surface-secondary border border-border-default rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">Selected Tier / Pack</span>
            <h4 className="text-[16px] font-bold text-text-primary mt-0.5">{item.name}</h4>
          </div>
          <div className="text-right">
            <span className="text-[20px] font-bold text-text-primary font-mono">${item.priceUsd}</span>
            <span className="text-[11px] text-text-tertiary block font-mono">₹{item.priceInr.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-surface-secondary border border-border-default rounded-xl">
          <button
            onClick={() => setActiveTab('razorpay')}
            className={cn(
              "py-2 px-3 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
              activeTab === 'razorpay'
                ? "bg-surface-card text-indigo-600 shadow-xs border border-border-default"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cards / NetBank</span>
          </button>

          <button
            onClick={() => setActiveTab('upi')}
            className={cn(
              "py-2 px-3 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
              activeTab === 'upi'
                ? "bg-surface-card text-indigo-600 shadow-xs border border-border-default"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>UPI / QR</span>
          </button>

          <button
            onClick={() => setActiveTab('paypal')}
            className={cn(
              "py-2 px-3 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
              activeTab === 'paypal'
                ? "bg-surface-card text-indigo-600 shadow-xs border border-border-default"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>PayPal (USD)</span>
          </button>
        </div>

        {/* TAB 1: Razorpay Checkout */}
        {activeTab === 'razorpay' && (
          <div className="space-y-4 text-center py-2">
            <div className="p-5 border border-border-default bg-surface-card rounded-xl space-y-4">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h5 className="text-[15px] font-bold text-text-primary">Instant Gateway Payment</h5>
                <p className="text-[13px] text-text-secondary mt-1 max-w-sm mx-auto">
                  Supports Indian & International Credit/Debit Cards, NetBanking, and Razorpay UPI Popup.
                </p>
              </div>

              <AppButton
                variant="primary"
                onClick={handleRazorpayPayment}
                disabled={isRazorpayLoading}
                className="w-full py-3 text-[13px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {isRazorpayLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{item.priceInr.toLocaleString('en-IN')} via Razorpay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </AppButton>
            </div>
            <p className="text-[11px] text-text-tertiary flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              256-Bit SSL Encrypted Checkout
            </p>
          </div>
        )}

        {/* TAB 2: UPI QR & Manual Ref ID */}
        {activeTab === 'upi' && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row items-center gap-6 p-5 border border-border-default bg-surface-card rounded-xl">
              
              {/* QR Code */}
              <div className="flex flex-col items-center shrink-0">
                <div className="p-2 bg-white border border-border-default rounded-xl shadow-xs">
                  <img src={qrImageUrl} alt="UPI Payment QR" className="w-40 h-40 object-contain" />
                </div>
                <span className="text-[10px] font-bold uppercase text-text-tertiary mt-2">Scan with GPay / PhonePe / Paytm</span>
              </div>

              {/* UPI Details & Copy */}
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Official Business VPA</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-[13px] font-mono font-bold bg-surface-secondary px-3 py-1.5 rounded-lg border border-border-default text-text-primary flex-1 truncate">
                      {config.upiVpa}
                    </code>
                    <AppButton variant="secondary" size="sm" onClick={handleCopyUpi}>
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </AppButton>
                  </div>
                </div>

                <div className="border-t border-border-default pt-2 text-[12px] text-text-secondary space-y-1">
                  <p><span className="font-semibold text-text-primary">Payee Name:</span> {config.upiName}</p>
                  <p><span className="font-semibold text-text-primary">Amount:</span> <span className="font-mono text-indigo-600 font-bold">₹{item.priceInr.toLocaleString('en-IN')}</span> (${item.priceUsd})</p>
                </div>
              </div>
            </div>

            {/* UTR Reference Submission Form */}
            <form onSubmit={handleSubmitUpi} className="p-4 border border-border-default bg-surface-card rounded-xl space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Enter 12-Digit UTR / Transaction Ref No.
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 420918239012"
                  className="w-full px-3.5 py-2.5 bg-surface-background border border-border-default rounded-lg text-[13px] font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-indigo-500"
                  maxLength={16}
                  required
                />
              </div>

              <AppButton
                variant="primary"
                type="submit"
                disabled={isSubmittingUpi}
                className="w-full py-2.5 text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {isSubmittingUpi ? 'Submitting...' : 'Submit UPI Reference for Instant Approval'}
              </AppButton>
            </form>
          </div>
        )}

        {/* TAB 3: PayPal (International USD) */}
        {activeTab === 'paypal' && (
          <div className="space-y-4 text-center py-2">
            <div className="p-6 border border-border-default bg-surface-card rounded-xl space-y-4">
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h5 className="text-[15px] font-bold text-text-primary">PayPal International (USD)</h5>
                <p className="text-[13px] text-text-secondary mt-1 max-w-sm mx-auto">
                  Ideal for global customers. Pay securely with your PayPal account or International Credit Cards.
                </p>
              </div>

              <AppButton
                variant="primary"
                onClick={handleRazorpayPayment} // Razorpay also processes USD International cards natively!
                className="w-full py-3 text-[13px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>Pay ${item.priceUsd} USD</span>
                <ArrowRight className="w-4 h-4" />
              </AppButton>
            </div>
          </div>
        )}

      </div>
    </AppModal>
  );
}
