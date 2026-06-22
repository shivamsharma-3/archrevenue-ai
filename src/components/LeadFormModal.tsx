import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { X, User, Briefcase, Target, Building } from 'lucide-react';
import { Lead } from '../lib/types';
import { cn } from '../lib/utils';
import posthog from 'posthog-js';
import { AppModal } from './ui/AppModal';
import { AppButton } from './ui/AppButton';
import { AppInput } from './ui/AppInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Lead>) => Promise<void>;
  initialData?: Lead;
}

const industries = [
  "Technology", "Healthcare", "Finance", "Retail", 
  "Manufacturing", "Real Estate", "Education", "Other"
];

const companySizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
const urgencies = ['Low', 'Medium', 'High', 'Critical'];
const companyTypes = ['Prospect', 'Competitor', 'Partner', 'Internal/Test'];

export default function LeadFormModal({ isOpen, onClose, onSubmit, initialData }: Props) {
  const [formData, setFormData] = useState<Partial<Lead>>({ status: 'new' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'core' | 'intelligence' | 'qualification'>('core');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ status: 'new' });
    }
    setActiveTab('core');
  }, [initialData, isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!formData.fullName) return;
    setLoading(true);
    try {
      await onSubmit(formData);
      posthog.capture('Lead Created', { leadSource: formData.leadSource || 'Manual' });
    } catch (err: any) {
      let msg = 'Unknown error occurred.';
      try {
        const parsed = JSON.parse(err.message);
        msg = parsed.error;
      } catch {
        msg = err.message;
      }
      toast.error(`Failed to save lead: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      noPadding
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        <div className="px-6 py-5 border-b border-border-default flex justify-between items-center relative shrink-0 bg-surface-card">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight text-text-primary">
              {initialData ? 'Edit Lead Profile' : 'New Lead Intelligence'}
            </h2>
            <p className="text-[13px] text-text-secondary mt-0.5">Collect data to power revenue intelligence.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-tertiary hover:text-text-primary rounded-button transition-colors hover:bg-surface-hover">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-border-default shrink-0 bg-surface-secondary">
          <button
            type="button"
            onClick={() => setActiveTab('core')}
            className={cn("flex-1 py-3 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center border-b-2 transition-colors", activeTab === 'core' ? "border-blue-500 text-blue-600" : "border-transparent text-text-tertiary hover:text-text-secondary")}
          >
            <User className="w-4 h-4 mr-2" /> Core Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('intelligence')}
            className={cn("flex-1 py-3 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center border-b-2 transition-colors", activeTab === 'intelligence' ? "border-blue-500 text-blue-600" : "border-transparent text-text-tertiary hover:text-text-secondary")}
          >
            <Briefcase className="w-4 h-4 mr-2" /> Business Intel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qualification')}
            className={cn("flex-1 py-3 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center border-b-2 transition-colors", activeTab === 'qualification' ? "border-blue-500 text-blue-600" : "border-transparent text-text-tertiary hover:text-text-secondary")}
          >
            <Target className="w-4 h-4 mr-2" /> Qualification
          </button>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden relative bg-surface-card">
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
            {activeTab === 'core' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <AppInput
                  label="Full Name *"
                  type="text"
                  value={formData.fullName || ''}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  required
                  placeholder="Jane Doe"
                />
                <div className="grid grid-cols-2 gap-4">
                  <AppInput
                    label="Email Address"
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="jane@company.com"
                  />
                  <AppInput
                    label="Phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <AppInput
                    label="Company"
                    type="text"
                    value={formData.company || ''}
                    onChange={e => setFormData({...formData, company: e.target.value})}
                    placeholder="Acme Corp"
                  />
                  <AppInput
                    label="Website URL"
                    type="url"
                    value={formData.website || ''}
                    onChange={e => setFormData({...formData, website: e.target.value})}
                    placeholder="https://acme.com"
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'intelligence' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Company Type</label>
                  <div className="flex space-x-2">
                    {companyTypes.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, companyType: type as Lead['companyType']})}
                        className={cn(
                          "px-3 py-2 rounded-button text-[12px] font-semibold border transition-all flex-1 text-center",
                          formData.companyType === type 
                            ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                            : "bg-surface-card text-text-secondary border-border-default hover:bg-surface-hover hover:text-text-primary"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Industry</label>
                    <div className="relative">
                      <select
                        value={formData.industry || ''}
                        onChange={e => setFormData({...formData, industry: e.target.value})}
                        className="block w-full h-10 px-4 text-[13px] bg-surface-card border border-border-default rounded-input focus:ring-2 focus:ring-blue-100 focus:border-border-active hover:border-border-hover transition-all outline-none text-text-primary appearance-none"
                      >
                        <option value="">Select Industry</option>
                        {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-tertiary">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Company Size</label>
                    <div className="relative">
                      <select
                        value={formData.companySize || ''}
                        onChange={e => setFormData({...formData, companySize: e.target.value as Lead['companySize']})}
                        className="block w-full h-10 px-4 text-[13px] bg-surface-card border border-border-default rounded-input focus:ring-2 focus:ring-blue-100 focus:border-border-active hover:border-border-hover transition-all outline-none text-text-primary appearance-none"
                      >
                        <option value="">Select Size</option>
                        {companySizes.map(size => <option key={size} value={size}>{size} employees</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-tertiary">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <AppInput
                    label="Monthly Revenue Range"
                    type="text"
                    value={formData.monthlyRevenue || ''}
                    onChange={e => setFormData({...formData, monthlyRevenue: e.target.value})}
                    placeholder="$10k - $50k"
                  />
                  <AppInput
                    label="Estimated Budget"
                    type="text"
                    value={formData.estimatedBudget || ''}
                    onChange={e => setFormData({...formData, estimatedBudget: e.target.value})}
                    placeholder="$5,000"
                  />
                </div>
                <AppInput
                  label="Lead Source"
                  type="text"
                  value={formData.leadSource || ''}
                  onChange={e => setFormData({...formData, leadSource: e.target.value})}
                  placeholder="e.g. LinkedIn, Inbound, Referral"
                />
              </motion.div>
            )}

            {activeTab === 'qualification' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Pain Point / Challenge</label>
                  <textarea
                    value={formData.painPoint || ''}
                    onChange={e => setFormData({...formData, painPoint: e.target.value})}
                    placeholder="What is their primary business challenge?"
                    rows={2}
                    className="block w-full px-4 py-3 bg-surface-card border border-border-default rounded-input focus:ring-2 focus:ring-blue-100 focus:border-border-active hover:border-border-hover transition-all text-[13px] outline-none placeholder:text-text-tertiary text-text-primary resize-none"
                  />
                </div>
                <AppInput
                  label="Current Solution Used"
                  type="text"
                  value={formData.currentSolution || ''}
                  onChange={e => setFormData({...formData, currentSolution: e.target.value})}
                  placeholder="e.g. In-house, Competitor X, Excel"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Urgency Level</label>
                    <div className="relative">
                      <select
                        value={formData.urgency || ''}
                        onChange={e => setFormData({...formData, urgency: e.target.value as Lead['urgency']})}
                        className="block w-full h-10 px-4 text-[13px] bg-surface-card border border-border-default rounded-input focus:ring-2 focus:ring-blue-100 focus:border-border-active hover:border-border-hover transition-all outline-none text-text-primary appearance-none"
                      >
                        <option value="">Select Urgency</option>
                        {urgencies.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-tertiary">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <AppInput
                    label="Interested Service"
                    type="text"
                    value={formData.interestedService || ''}
                    onChange={e => setFormData({...formData, interestedService: e.target.value})}
                    placeholder="e.g. Enterprise Tier"
                  />
                </div>
                
                <div className="space-y-1.5 pt-4 border-t border-border-default">
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Initial Status Pipeline</label>
                  <div className="flex space-x-2">
                    {['new', 'contacted', 'qualified'].map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({...formData, status: status as Lead['status']})}
                        className={cn(
                          "px-4 py-2 rounded-button text-[12px] uppercase tracking-wider font-semibold border transition-all flex-1 text-center",
                          formData.status === status 
                            ? "bg-text-primary text-text-inverse border-text-primary shadow-sm"
                            : "bg-surface-card text-text-secondary border-border-default hover:bg-surface-hover hover:text-text-primary"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-border-default bg-surface-secondary shrink-0 flex justify-between items-center rounded-b-3xl">
          <div className="flex space-x-2">
            <AppButton
              variant="ghost"
              onClick={() => {
                if (activeTab === 'qualification') setActiveTab('intelligence');
                if (activeTab === 'intelligence') setActiveTab('core');
              }}
              disabled={activeTab === 'core'}
              className={activeTab === 'core' ? "opacity-0" : ""}
            >
              Back
            </AppButton>
          </div>
          <div className="flex space-x-3">
            <AppButton variant="secondary" onClick={onClose}>
              Cancel
            </AppButton>
            {activeTab !== 'qualification' ? (
              <AppButton
                variant="primary"
                onClick={() => {
                  if (activeTab === 'core') setActiveTab('intelligence');
                  if (activeTab === 'intelligence') setActiveTab('qualification');
                }}
              >
                Next Step
              </AppButton>
            ) : (
              <AppButton
                variant="primary"
                onClick={handleSubmit}
                isLoading={loading}
              >
                {initialData ? 'Update Profile' : 'Create Intelligence Profile'}
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </AppModal>
  );
}
