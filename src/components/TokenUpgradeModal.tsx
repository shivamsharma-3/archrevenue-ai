import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { createCheckoutSession, STRIPE_PRICING } from '../lib/stripe';
import { motion } from 'motion/react';
import { Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { AppModal } from './ui/AppModal';
import { AppButton } from './ui/AppButton';
import toast from 'react-hot-toast';

interface TokenUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorDetails?: string;
}

export default function TokenUpgradeModal({ isOpen, onClose, errorDetails }: TokenUpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <AppModal isOpen={isOpen} onClose={onClose} maxWidth="md" noPadding>
      {/* Header Art */}
      <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 relative flex items-center justify-center border-b border-border-default">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] relative z-10 shadow-sm">
          <div className="w-full h-full bg-surface-card rounded-2xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="p-8 relative">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-3 tracking-tight">API Limits Reached</h2>
          <p className="text-[13px] text-text-secondary leading-relaxed font-medium">
            Your AI request was blocked due to API rate limits or insufficient tokens. Upgrade your plan to get unlimited AI generation and prioritize your requests.
          </p>
          {errorDetails && (
             <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-[var(--radius-card)]">
                <p className="text-[10px] text-rose-500 font-mono text-left break-words line-clamp-3">
                  Error: {errorDetails}
                </p>
             </div>
          )}
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center p-4 rounded-[var(--radius-card)] bg-surface-secondary border border-border-default">
            <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center mr-4">
              <Sparkles className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-text-primary">Unlimited Tokens</h4>
              <p className="text-[12px] text-text-secondary font-medium mt-0.5">Generate unlimited analysis and scripts</p>
            </div>
          </div>
          <div className="flex items-center p-4 rounded-[var(--radius-card)] bg-surface-secondary border border-border-default">
            <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center mr-4">
              <Shield className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-text-primary">Priority API Access</h4>
              <p className="text-[12px] text-text-secondary font-medium mt-0.5">Bypass standard rate limits for 10x faster generation</p>
            </div>
          </div>
        </div>

        <AppButton
          variant="primary"
          className="w-full h-12 text-[14px]"
          rightIcon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          onClick={() => {
            onClose();
            window.location.href = '/billing';
          }}
        >
          Upgrade Plan & Add Tokens
        </AppButton>
      </div>
    </AppModal>
  );
}
