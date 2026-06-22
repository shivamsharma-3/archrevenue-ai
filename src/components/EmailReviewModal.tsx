import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Loader2 } from 'lucide-react';
import { Lead } from '../lib/types';
import { sendEmail } from '../lib/email';
import { connectGmail } from '../lib/firebase';
import { cn } from '../lib/utils';
import { AppModal } from './ui/AppModal';
import { AppButton } from './ui/AppButton';
import { AppInput } from './ui/AppInput';

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
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Email"
      maxWidth="lg"
      footer={
        <>
          <AppButton variant="ghost" onClick={onClose} disabled={isSending}>
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            onClick={handleSend}
            disabled={isSending || !toEmail}
            isLoading={isSending}
            leftIcon={!isSending && <Send className="w-4 h-4" />}
          >
            Send via Gmail
          </AppButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-500 px-4 py-3 rounded-[var(--radius-card)] text-[13px] font-medium shadow-sm">
            {error}
          </div>
        )}
        <AppInput
          label="To"
          type="email"
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
          placeholder="name@company.com"
        />
        <AppInput
          label="Subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Message</label>
          <textarea 
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full bg-surface-card border border-border-default rounded-input px-4 py-3 text-text-primary focus:outline-none focus:border-border-active focus:ring-2 focus:ring-blue-100 hover:border-border-hover transition-all text-[13px] leading-relaxed resize-none shadow-sm"
          />
        </div>
      </div>
    </AppModal>
  );
}
