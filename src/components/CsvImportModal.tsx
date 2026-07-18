import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, Database, History, Download, Sparkles, Coins } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { SellerProfile, ImportBatch } from '../lib/types';
import { startBulkImport, BulkImportProgress } from '../lib/bulkProcessor';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import posthog from 'posthog-js';
import { AppModal } from './ui/AppModal';
import { AppButton } from './ui/AppButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sellerProfile: SellerProfile | null;
  isFreePlan?: boolean;
  currentLeadsCount?: number;
}

export default function CsvImportModal({ isOpen, onClose, sellerProfile, isFreePlan, currentLeadsCount = 0 }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<BulkImportProgress | null>(null);
  const [history, setHistory] = useState<ImportBatch[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !auth.currentUser) return;
    
    // Listen to import history
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/imports`),
      orderBy('date', 'desc'),
      limit(10)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const batches = snapshot.docs.map(doc => doc.data() as ImportBatch);
      setHistory(batches);
    });
    
    return () => unsubscribe();
  }, [isOpen]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setProgress(null);
    }
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a valid CSV file.');
      return;
    }
    setFile(selectedFile);
  };

  const handleStartImport = () => {
    if (!file) return;

    const MAX_FREE_LEADS = 50;
    if (isFreePlan && currentLeadsCount >= MAX_FREE_LEADS) {
      toast.error(`Free plan is limited to ${MAX_FREE_LEADS} leads. Please upgrade to Pro to add unlimited leads.`);
      return;
    }

    startBulkImport(file, sellerProfile, (prog) => {
      setProgress(prog);
      if (prog.status === 'completed') {
        toast.success('Import completed successfully');
        posthog.capture('CSV Imported', { totalLeads: prog.total, completed: prog.completed });
      } else if (prog.status === 'failed') {
        toast.error(prog.error || 'Import failed');
      }
    });
  };

  const percentage = progress?.total ? Math.round((progress.completed / progress.total) * 100) : 0;
  const remaining = progress ? progress.total - progress.completed - progress.duplicatesSkipped : 0;

  if (!isOpen) return null;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={() => { if (progress?.status !== 'processing') onClose(); }}
      maxWidth="lg"
      noPadding
    >
      <div className="flex flex-col h-full max-h-[85vh] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none" />
        
        <div className="px-8 py-6 border-b border-border-default flex justify-between items-center relative shrink-0 bg-surface-card">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-text-primary flex items-center">
              <Database className="w-5 h-5 mr-3 text-blue-500" /> Bulk Import & AI Processing
            </h2>
            <p className="text-[13px] text-text-secondary mt-1">Upload a CSV to automatically research, score, and draft outreach.</p>
          </div>
          {progress?.status !== 'processing' && (
            <button onClick={onClose} className="p-1.5 text-text-tertiary hover:text-text-primary rounded-button transition-colors hover:bg-surface-hover">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto p-8 space-y-8 bg-surface-card relative z-10">
          
          {/* Main Action Area */}
          {!progress ? (
            <div className="space-y-6">
              <div 
                className={cn(
                  "border-2 border-dashed rounded-[var(--radius-card)] p-10 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden",
                  isDragging ? "border-blue-500 bg-blue-50" : "border-border-default bg-surface-background hover:bg-surface-hover",
                  file ? "border-blue-500/50 bg-blue-50" : ""
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv"
                  onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])}
                />
                
                {file ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-text-primary">{file.name}</h3>
                    <p className="text-text-secondary text-sm mt-1">Ready for AI processing</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary hover:text-red-500 transition-colors"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-surface-secondary text-text-tertiary rounded-full flex items-center justify-center mx-auto mb-4 border border-border-default">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-text-primary">Drag & drop your CSV here</h3>
                    <p className="text-text-secondary text-[13px] mt-1">or click to browse files</p>
                  </div>
                )}
              </div>

              {/* Import Requirements & Token Cost Details */}
              <div className="bg-surface-secondary border border-border-default rounded-[var(--radius-card)] p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-text-primary">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-text-primary font-semibold text-[13px]">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>CSV Columns & Formats</span>
                  </div>
                  <ul className="space-y-2 text-[12px] text-text-secondary list-none pl-0">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 font-bold">•</span>
                      <span><strong>Required:</strong> A column named <code className="bg-surface-hover border border-border-default px-1 rounded font-mono text-[11px]">Name</code> or <code className="bg-surface-hover border border-border-default px-1 rounded font-mono text-[11px]">Full Name</code>.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 font-bold">•</span>
                      <span><strong>Auto-Mapped Columns:</strong> Email, Company, Website, Industry, Job Title, Location, Revenue, and Employees.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 font-bold">•</span>
                      <span>Compatible with exports from Apollo, Sales Navigator, Clay, Hunter, etc.</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 border-t md:border-t-0 md:border-l border-border-default pt-4 md:pt-0 md:pl-6">
                  <div className="flex items-center space-x-2 text-text-primary font-semibold text-[13px]">
                    <Coins className="w-4 h-4 text-purple-500" />
                    <span>AI Token Quota Impact</span>
                  </div>
                  <ul className="space-y-2 text-[12px] text-text-secondary list-none pl-0">
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2 font-bold">•</span>
                      <span><strong>With Website URL:</strong> ~1,200 - 2,500 tokens per lead. Performs deep website intelligence gathering, scoring, and personalized outreach drafting.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2 font-bold">•</span>
                      <span><strong>Without Website:</strong> ~600 - 1,200 tokens per lead. Performs form-based scoring and basic outreach drafting only.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2 font-bold">•</span>
                      <span>Tokens are consumed from your monthly plan quota. Monitor usage in the <strong>Billing</strong> section.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {file && (
                <AppButton
                  variant="primary"
                  onClick={handleStartImport}
                  className="w-full h-12 text-[14px]"
                  leftIcon={<SparklesIcon className="w-5 h-5" />}
                >
                  Start Bulk Processing
                </AppButton>
              )}
            </div>
          ) : (
            <div className="bg-surface-secondary border border-border-default rounded-[var(--radius-card)] p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-border-default">
                <motion.div 
                  className={cn(
                    "h-full", 
                    progress.status === 'failed' ? "bg-red-500" : progress.status === 'completed' ? "bg-emerald-500" : "bg-blue-500"
                  )}
                  initial={{ width: '0%' }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>

              <div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                {progress.status === 'processing' && (
                  <div className="w-16 h-16 relative flex items-center justify-center mb-2">
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                    <div 
                      className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" 
                    />
                    <span className="text-sm font-bold text-blue-600">{percentage}%</span>
                  </div>
                )}
                {progress.status === 'completed' && (
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2 border border-emerald-200 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                )}
                {progress.status === 'failed' && (
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2 border border-red-200 shadow-sm">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-text-primary">
                    {progress.status === 'parsing' && 'Reading CSV...'}
                    {progress.status === 'processing' && `Importing ${progress.total} Leads`}
                    {progress.status === 'completed' && 'Processing Complete'}
                    {progress.status === 'failed' && 'Import Failed'}
                  </h3>
                  {progress.error && (
                    <p className="text-red-500 text-sm mt-2">{progress.error}</p>
                  )}
                </div>

                {progress.status !== 'parsing' && progress.status !== 'failed' && (
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-4 w-full max-w-lg mt-6">
                    <div className="flex-1 min-w-[90px] bg-surface-card border border-border-default rounded-[var(--radius-card)] p-3 sm:p-4 flex flex-col items-center shadow-sm">
                      <span className="text-xl sm:text-2xl font-bold text-text-primary">{progress.completed}</span>
                      <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-text-secondary font-semibold mt-1">Completed</span>
                    </div>
                    <div className="flex-1 min-w-[90px] bg-surface-card border border-border-default rounded-[var(--radius-card)] p-3 sm:p-4 flex flex-col items-center shadow-sm">
                      <span className="text-xl sm:text-2xl font-bold text-blue-500">{remaining}</span>
                      <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-blue-500/70 font-semibold mt-1">Remaining</span>
                    </div>
                    <div className="flex-1 min-w-[90px] bg-surface-card border border-border-default rounded-[var(--radius-card)] p-3 sm:p-4 flex flex-col items-center shadow-sm">
                      <span className="text-xl sm:text-2xl font-bold text-text-tertiary">{progress.duplicatesSkipped}</span>
                      <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-text-tertiary font-semibold mt-1">Skipped</span>
                    </div>
                  </div>
                )}

                {progress.status === 'completed' && (
                  <AppButton
                    onClick={onClose}
                    className="mt-8"
                  >
                    Return to Dashboard
                  </AppButton>
                )}
              </div>
            </div>
          )}

          {/* Import History */}
          {history.length > 0 && !progress && (
            <div className="pt-8 border-t border-border-default">
              <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center">
                <History className="w-4 h-4 mr-2" /> Recent Imports
              </h4>
              <div className="space-y-3">
                {history.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-4 bg-surface-secondary border border-border-default rounded-[var(--radius-card)] hover:bg-surface-hover transition-colors shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border",
                        batch.status === 'completed' ? "bg-emerald-50 border-emerald-200 text-emerald-500" :
                        batch.status === 'processing' ? "bg-blue-50 border-blue-200 text-blue-500" :
                        "bg-red-50 border-red-200 text-red-500"
                      )}>
                        {batch.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                         batch.status === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                         <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-text-primary">Import Batch #{batch.id.substring(0,6)}</p>
                        <p className="text-[11px] text-text-tertiary mt-0.5">
                          {batch.date?.toDate ? batch.date.toDate().toLocaleString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-medium text-text-primary">{batch.totalLeads} Leads</p>
                      <p className="text-[11px] text-text-tertiary mt-0.5">
                        {batch.duplicatesSkipped} skipped
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </AppModal>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
