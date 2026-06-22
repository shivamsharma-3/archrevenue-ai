import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Bug, Lightbulb, Send, CheckCircle2, X } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { AppModal } from './ui/AppModal';
import { AppButton } from './ui/AppButton';
import { useLocation } from 'react-router-dom';

export function BetaFeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [type, setType] = useState<'bug' | 'feature' | 'general'>('general');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const location = useLocation();

  // Pulse every 20 seconds to draw attention
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 2000);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !auth.currentUser) return;

    setStatus('loading');
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        type,
        message,
        page: location.pathname,
        timestamp: serverTimestamp()
      });
      setStatus('success');
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
          setType('general');
        }, 300);
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <>
      {/* Floating trigger button — bottom right, discoverable */}
      <motion.div 
        drag="y" 
        dragConstraints={{ top: -500, bottom: 0 }} 
        dragElastic={0.1}
        className="fixed bottom-6 right-6 z-[100] group touch-none"
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "flex items-center space-x-2 px-4 py-2.5 rounded-full shadow-lg transition-all duration-300",
            "bg-surface-card border border-border-default text-text-secondary hover:border-blue-300 hover:text-blue-600",
            "hover:shadow-xl hover:shadow-blue-100"
          )}
          title="Help us improve ArchRevenue"
        >
          {/* Pulse ring */}
          {isPulsing && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full bg-indigo-400"
              style={{ pointerEvents: 'none' }}
            />
          )}
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-semibold tracking-wide">Feedback</span>
        </motion.button>
        {/* Hover tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-surface-inverse text-surface-card text-xs font-medium px-3 py-1.5 rounded-[var(--radius-button)] whitespace-nowrap shadow-lg">
            Help us improve ArchRevenue
          </div>
          <div className="w-2 h-2 bg-surface-inverse rotate-45 ml-auto mr-4 -mt-1" />
        </div>
      </motion.div>

      <AppModal isOpen={isOpen} onClose={() => setIsOpen(false)} maxWidth="sm">
        <div className="relative z-10 w-full">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Share Feedback</h3>
              <p className="text-xs text-text-secondary mt-0.5">Help us improve ArchRevenue</p>
            </div>
          </div>
          
          {status === 'success' ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-[var(--radius-card)] p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <p className="text-emerald-700 font-semibold text-sm">Feedback sent!</p>
              <p className="text-emerald-600 text-xs mt-1">Thank you for helping us improve.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('bug')}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-[var(--radius-button)] border text-xs font-semibold transition-all",
                      type === 'bug' ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm" : "bg-surface-card border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    )}
                  >
                    <Bug className="w-4 h-4 mb-1" /> Bug
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('feature')}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-[var(--radius-button)] border text-xs font-semibold transition-all",
                      type === 'feature' ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm" : "bg-surface-card border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    )}
                  >
                    <Lightbulb className="w-4 h-4 mb-1" /> Feature
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('general')}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-[var(--radius-button)] border text-xs font-semibold transition-all",
                      type === 'general' ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" : "bg-surface-card border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    )}
                  >
                    <MessageSquare className="w-4 h-4 mb-1" /> General
                  </button>
                </div>

                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={4}
                  className="w-full bg-surface-card border border-border-default rounded-[var(--radius-button)] px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 hover:border-border-hover transition-all resize-none text-sm"
                  disabled={status === 'loading'}
                />

                {status === 'error' && (
                  <p className="text-rose-500 text-xs font-medium">Failed to send. Please try again.</p>
                )}

                <AppButton
                  variant="primary"
                  type="submit"
                  disabled={status === 'loading' || !message.trim()}
                  className="w-full"
                  isLoading={status === 'loading'}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Send Feedback
                </AppButton>
              </form>
            )}
          </div>
      </AppModal>
    </>
  );
}
