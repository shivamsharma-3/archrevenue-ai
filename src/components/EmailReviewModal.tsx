import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Loader2 } from 'lucide-react';
import { Lead } from '../lib/types';
import { sendEmail } from '../lib/email';
import { connectGmail } from '../lib/firebase';
import { cn } from '../lib/utils';

interface EmailReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSendSuccess: (edited: boolean, sentMessageId?: string, threadId?: string) => void;
}

export function EmailReviewModal({ isOpen, onClose, lead, onSendSuccess }: EmailReviewModalProps) {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('Following up');
  const [initialSubject, setInitialSubject] = useState('');
  const [body, setBody] = useState('');
  const [initialBody, setInitialBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && lead) {
      setToEmail(lead.email || '');
      if (lead.aiAnalysis?.followUp?.email) {
        // Try to extract subject from AI email if it has "Subject: ..."
        const emailContent = lead.aiAnalysis.followUp.email;
        const match = emailContent.match(/^Subject:\s*(.*)/i);
        if (match) {
          setSubject(match[1].trim());
          setInitialSubject(match[1].trim());
          setBody(emailContent.replace(/^Subject:\s*.*\n?/i, '').trim());
          setInitialBody(emailContent.replace(/^Subject:\s*.*\n?/i, '').trim());
        } else {
          setBody(emailContent);
          setInitialBody(emailContent);
          setSubject(`ArchRevenue x ${lead.company || lead.fullName}`);
          setInitialSubject(`ArchRevenue x ${lead.company || lead.fullName}`);
        }
      }
      setError(null);
    }
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const handleSend = async () => {
    if (!toEmail || !toEmail.includes('@') || !toEmail.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      let token = localStorage.getItem('gmail_token');
      if (!token) {
         // Try to connect
         const res = await connectGmail();
         token = res.token;
      }
      
      let sentMessageId: string | undefined;
      let threadId: string | undefined;
      try {
        const res = await sendEmail(toEmail, subject, body, token!, lead?.lastEmailThreadId, lead?.lastEmailMessageId);
        sentMessageId = res.sentMessageId;
        threadId = res.threadId;
      } catch (err: any) {
        if (err.message === 'UNAUTHORIZED') {
           // Token expired, refresh
           const res = await connectGmail();
           token = res.token;
           const retryRes = await sendEmail(toEmail, subject, body, token!, lead?.lastEmailThreadId, lead?.lastEmailMessageId);
           sentMessageId = retryRes.sentMessageId;
           threadId = retryRes.threadId;
        } else {
           throw err;
        }
      }
      
      onSendSuccess(body !== initialBody || subject !== initialSubject, sentMessageId, threadId);
      onClose();
    } catch (err: any) {
      console.error('Email send failed:', err);
      setError(err.message || 'Failed to send email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#0a0a0b] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Send className="w-5 h-5 mr-2 text-blue-500" /> Review Email
              </h2>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">To</label>
                <input 
                  type="email" 
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Subject</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Message</label>
                <textarea 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-zinc-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm leading-relaxed"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-white/[0.08] flex justify-end space-x-3 shrink-0 bg-white/[0.01]">
              <button
                onClick={onClose}
                disabled={isSending}
                className="px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || !toEmail}
                className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:hover:bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              >
                {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {isSending ? 'Sending...' : 'Send via Gmail'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
