import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Briefcase, Target, Building } from 'lucide-react';
import { Lead } from '../lib/types';
import { cn } from '../lib/utils';

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

  const handleSubmit = async () => {
    if (!formData.fullName) return;
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err: any) {
      let msg = 'Unknown error occurred.';
      try {
        const parsed = JSON.parse(err.message);
        msg = parsed.error;
      } catch {
        msg = err.message;
      }
      alert(`Failed to save lead: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-black border border-white/[0.08] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden font-sans flex flex-col max-h-[90vh]"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
          
          <div className="px-6 py-5 border-b border-white/[0.04] flex justify-between items-center relative shrink-0">
            <div>
              <h2 className="text-lg font-medium tracking-tight text-white font-display">
                {initialData ? 'Edit Lead Profile' : 'New Lead Intelligence'}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Collect data to power revenue intelligence.</p>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors bg-white/[0.02] hover:bg-white/[0.05]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex border-b border-white/[0.04] shrink-0 bg-white/[0.01]">
            <button
              type="button"
              onClick={() => setActiveTab('core')}
              className={cn("flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center border-b-2 transition-colors", activeTab === 'core' ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-500 hover:text-zinc-300")}
            >
              <User className="w-4 h-4 mr-2" /> Core Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('intelligence')}
              className={cn("flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center border-b-2 transition-colors", activeTab === 'intelligence' ? "border-violet-500 text-violet-400" : "border-transparent text-zinc-500 hover:text-zinc-300")}
            >
              <Briefcase className="w-4 h-4 mr-2" /> Business Intel
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qualification')}
              className={cn("flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center border-b-2 transition-colors", activeTab === 'qualification' ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-500 hover:text-zinc-300")}
            >
              <Target className="w-4 h-4 mr-2" /> Qualification
            </button>
          </div>

          <div className="flex flex-col flex-1 overflow-hidden relative">
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {activeTab === 'core' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Full Name *</label>
                    <input
                      type="text"
                      value={formData.fullName || ''}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                      required
                      placeholder="Jane Doe"
                      className="block w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all text-sm outline-none placeholder:text-zinc-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Email Address</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        placeholder="jane@company.com"
                        className="block w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all text-sm outline-none placeholder:text-zinc-600 text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        placeholder="+1 (555) 000-0000"
                        className="block w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all text-sm outline-none placeholder:text-zinc-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Company</label>
                      <input
                        type="text"
                        value={formData.company || ''}
                        onChange={e => setFormData({...formData, company: e.target.value})}
                        placeholder="Acme Corp"
                        className="block w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all text-sm outline-none placeholder:text-zinc-600 text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Website URL</label>
                      <input
                        type="url"
                        value={formData.website || ''}
                        onChange={e => setFormData({...formData, website: e.target.value})}
                        placeholder="https://acme.com"
                        className="block w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all text-sm outline-none placeholder:text-zinc-600 text-white"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'intelligence' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Company Type</label>
                    <div className="flex space-x-2">
                      {companyTypes.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({...formData, companyType: type as Lead['companyType']})}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold border transition-all flex-1 text-center",
                            formData.companyType === type 
                              ? "bg-violet-500 text-white border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                              : "bg-white/[0.02] text-zinc-400 border-white/[0.08] hover:bg-white/[0.06] hover:text-white"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Industry</label>
                      <select
                        value={formData.industry || ''}
                        onChange={e => setFormData({...formData, industry: e.target.value})}
                        className="block w-full px-4 py-3 bg-[#121214] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-violet-500/50 transition-all text-sm outline-none text-white appearance-none"
                      >
                        <option value="">Select Industry</option>
                        {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Company Size</label>
                      <select
                        value={formData.companySize || ''}
                        onChange={e => setFormData({...formData, companySize: e.target.value as Lead['companySize']})}
                        className="block w-full px-4 py-3 bg-[#121214] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-violet-500/50 transition-all text-sm outline-none text-white appearance-none"
                      >
                        <option value="">Select Size</option>
                        {companySizes.map(size => <option key={size} value={size}>{size} employees</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Monthly Revenue Range</label>
                      <input
                        type="text"
                        value={formData.monthlyRevenue || ''}
                        onChange={e => setFormData({...formData, monthlyRevenue: e.target.value})}
                        placeholder="$10k - $50k"
                        className="block w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-violet-500/50 transition-all text-sm outline-none placeholder:text-zinc-600 text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Estimated Budget</label>
                      <input
                        type="text"
                        value={formData.estimatedBudget || ''}
                        onChange={e => setFormData({...formData, estimatedBudget: e.target.value})}
                        placeholder="$5,000"
                        className="block w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-violet-500/50 transition-all text-sm outline-none placeholder:text-zinc-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Lead Source</label>
                    <input
                      type="text"
                      value={formData.leadSource || ''}
                      onChange={e => setFormData({...formData, leadSource: e.target.value})}
                      placeholder="e.g. LinkedIn, Inbound, Referral"
                      className="block w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-violet-500/50 transition-all text-sm outline-none placeholder:text-zinc-600 text-white"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'qualification' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Pain Point / Challenge</label>
                    <textarea
                      value={formData.painPoint || ''}
                      onChange={e => setFormData({...formData, painPoint: e.target.value})}
                      placeholder="What is their primary business challenge?"
                      rows={2}
                      className="block w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-emerald-500/50 transition-all text-sm outline-none placeholder:text-zinc-600 text-white resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Current Solution Used</label>
                    <input
                      type="text"
                      value={formData.currentSolution || ''}
                      onChange={e => setFormData({...formData, currentSolution: e.target.value})}
                      placeholder="e.g. In-house, Competitor X, Excel"
                      className="block w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-emerald-500/50 transition-all text-sm outline-none placeholder:text-zinc-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Urgency Level</label>
                      <select
                        value={formData.urgency || ''}
                        onChange={e => setFormData({...formData, urgency: e.target.value as Lead['urgency']})}
                        className="block w-full px-4 py-3 bg-[#121214] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-emerald-500/50 transition-all text-sm outline-none text-white appearance-none"
                      >
                        <option value="">Select Urgency</option>
                        {urgencies.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Interested Service</label>
                      <input
                        type="text"
                        value={formData.interestedService || ''}
                        onChange={e => setFormData({...formData, interestedService: e.target.value})}
                        placeholder="e.g. Enterprise Tier"
                        className="block w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl focus:ring-0 focus:border-emerald-500/50 transition-all text-sm outline-none placeholder:text-zinc-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                    <label className="text-sm font-medium text-zinc-300">Initial Status Pipeline</label>
                    <div className="flex space-x-2">
                      {['new', 'contacted', 'qualified'].map(status => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setFormData({...formData, status: status as Lead['status']})}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold border transition-all flex-1 text-center",
                            formData.status === status 
                              ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                              : "bg-white/[0.02] text-zinc-500 border-white/[0.08] hover:bg-white/[0.06] hover:text-white"
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

          <div className="p-6 border-t border-white/[0.04] bg-black/50 shrink-0 flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'qualification') setActiveTab('intelligence');
                  if (activeTab === 'intelligence') setActiveTab('core');
                }}
                disabled={activeTab === 'core'}
                className="px-4 py-2.5 bg-transparent text-zinc-400 rounded-xl text-sm font-medium hover:text-white transition-colors disabled:opacity-0"
              >
                Back
              </button>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-transparent text-zinc-400 rounded-xl text-sm font-medium hover:text-white transition-colors"
              >
                Cancel
              </button>
              {activeTab !== 'qualification' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'core') setActiveTab('intelligence');
                    if (activeTab === 'intelligence') setActiveTab('qualification');
                  }}
                  className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-semibold hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center"
                >
                  {loading ? 'Saving...' : (initialData ? 'Update Profile' : 'Create Intelligence Profile')}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
