import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { createCheckoutSession } from '../lib/stripe';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Shield, ArrowRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface TokenUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorDetails?: string;
}

export default function TokenUpgradeModal({ isOpen, onClose, errorDetails }: TokenUpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#0a0a0b] border border-white/[0.1] rounded-3xl z-[210] overflow-hidden shadow-[0_20px_100px_rgba(0,0,0,0.8)]"
          >
            {/* Header Art */}
            <div className="h-32 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 relative flex items-center justify-center border-b border-white/[0.05]">
              <div className="absolute inset-0 bg-black/40" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 relative z-10 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                <div className="w-full h-full bg-[#0a0a0b] rounded-2xl flex items-center justify-center">
                  <Zap className="w-8 h-8 text-indigo-400" />
                </div>
              </div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white rounded-full transition-colors z-20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 relative">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">API Limits Reached</h2>
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                  Your AI request was blocked due to API rate limits or insufficient tokens. Upgrade your plan to get unlimited AI generation and prioritize your requests.
                </p>
                {errorDetails && (
                   <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-[10px] text-red-400 font-mono text-left break-words line-clamp-3">
                        Error: {errorDetails}
                      </p>
                   </div>
                )}
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mr-4">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Unlimited Tokens</h4>
                    <p className="text-xs text-zinc-500 font-medium">Generate unlimited analysis and scripts</p>
                  </div>
                </div>
                <div className="flex items-center p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mr-4">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Priority API Access</h4>
                    <p className="text-xs text-zinc-500 font-medium">Bypass standard rate limits for 10x faster generation</p>
                  </div>
                </div>
              </div>

              <button
                disabled={isLoading}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    if (!auth.currentUser) throw new Error('Not authenticated');
                    // "price_upgrade" is a placeholder for your actual Stripe Price ID
                    await createCheckoutSession(auth.currentUser.uid, 'price_upgrade');
                  } catch (err: any) {
                    console.error('Stripe checkout error:', err);
                    alert('Failed to start checkout: ' + err.message);
                    setIsLoading(false);
                  }
                }}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-2xl text-sm font-bold shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center group disabled:opacity-50"
              >
                {isLoading ? 'Redirecting to Stripe...' : 'Upgrade Plan & Add Tokens'}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
