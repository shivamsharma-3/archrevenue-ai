import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, Database, History, Download } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { SellerProfile, ImportBatch } from '../lib/types';
import { startBulkImport, BulkImportProgress } from '../lib/bulkProcessor';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sellerProfile: SellerProfile | null;
}

export default function CsvImportModal({ isOpen, onClose, sellerProfile }: Props) {
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
      alert('Please select a valid CSV file.');
      return;
    }
    setFile(selectedFile);
  };

  const handleStartImport = () => {
    if (!file) return;
    startBulkImport(file, sellerProfile, (prog) => {
      setProgress(prog);
      if (prog.status === 'completed' || prog.status === 'failed') {
        // We could auto-close or let the user see the final state
      }
    });
  };

  const percentage = progress?.total ? Math.round((progress.completed / progress.total) * 100) : 0;
  const remaining = progress ? progress.total - progress.completed - progress.duplicatesSkipped : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => progress?.status !== 'processing' && onClose()}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-[#0a0a0b] border border-white/[0.08] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden font-sans flex flex-col max-h-[90vh]"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.03] to-transparent pointer-events-none" />
          
          <div className="px-8 py-6 border-b border-white/[0.04] flex justify-between items-center relative shrink-0">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white font-display flex items-center">
                <Database className="w-5 h-5 mr-3 text-blue-500" /> Bulk Import & AI Processing
              </h2>
              <p className="text-sm text-zinc-400 mt-1">Upload a CSV to automatically research, score, and draft outreach.</p>
            </div>
            {progress?.status !== 'processing' && (
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-xl transition-colors bg-white/[0.02] hover:bg-white/[0.05]">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-col flex-1 overflow-y-auto p-8 space-y-8">
            
            {/* Main Action Area */}
            {!progress ? (
              <div className="space-y-4">
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden",
                    isDragging ? "border-blue-500 bg-blue-500/5" : "border-white/[0.1] bg-white/[0.01] hover:bg-white/[0.02]",
                    file ? "border-emerald-500/50 bg-emerald-500/5" : ""
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
                      <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-medium text-white">{file.name}</h3>
                      <p className="text-zinc-400 text-sm mt-1">Ready for AI processing</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                        <Upload className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-medium text-white">Drag & drop your CSV here</h3>
                      <p className="text-zinc-400 text-sm mt-1">or click to browse files</p>
                      
                      <div className="mt-6 flex justify-center space-x-4">
                        <div className="text-left text-xs text-zinc-500">
                          <p className="font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Required Columns:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>Name</li>
                          </ul>
                        </div>
                        <div className="text-left text-xs text-zinc-500">
                          <p className="font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Recommended Columns:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>Email</li>
                            <li>Company</li>
                            <li>Website</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {file && (
                  <button
                    onClick={handleStartImport}
                    className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center"
                  >
                    <SparklesIcon className="w-5 h-5 mr-2" /> Start Bulk Processing
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-black/40 border border-white/[0.08] rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/[0.05]">
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
                      <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                      <div 
                        className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" 
                      />
                      <span className="text-sm font-bold text-white">{percentage}%</span>
                    </div>
                  )}
                  {progress.status === 'completed' && (
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-2 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                  )}
                  {progress.status === 'failed' && (
                    <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-2 border border-red-500/30">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-bold text-white font-display">
                      {progress.status === 'parsing' && 'Reading CSV...'}
                      {progress.status === 'processing' && `Importing ${progress.total} Leads`}
                      {progress.status === 'completed' && 'Processing Complete'}
                      {progress.status === 'failed' && 'Import Failed'}
                    </h3>
                    {progress.error && (
                      <p className="text-red-400 text-sm mt-2">{progress.error}</p>
                    )}
                  </div>

                  {progress.status !== 'parsing' && progress.status !== 'failed' && (
                    <div className="grid grid-cols-3 gap-4 w-full max-w-lg mt-6">
                      <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex flex-col items-center">
                        <span className="text-3xl font-bold text-white font-display">{progress.completed}</span>
                        <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mt-1">Completed</span>
                      </div>
                      <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex flex-col items-center">
                        <span className="text-3xl font-bold text-blue-400 font-display">{remaining}</span>
                        <span className="text-[11px] uppercase tracking-wider text-blue-400/70 font-semibold mt-1">Remaining</span>
                      </div>
                      <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex flex-col items-center">
                        <span className="text-3xl font-bold text-zinc-400 font-display">{progress.duplicatesSkipped}</span>
                        <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mt-1">Skipped</span>
                      </div>
                    </div>
                  )}

                  {progress.status === 'completed' && (
                    <button
                      onClick={onClose}
                      className="mt-8 px-8 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-sm font-semibold transition-colors border border-white/[0.08]"
                    >
                      Return to Dashboard
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Import History */}
            {history.length > 0 && !progress && (
              <div className="pt-8 border-t border-white/[0.04]">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center">
                  <History className="w-4 h-4 mr-2 text-zinc-400" /> Recent Imports
                </h4>
                <div className="space-y-3">
                  {history.map((batch) => (
                    <div key={batch.id} className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border",
                          batch.status === 'completed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                          batch.status === 'processing' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                          "bg-red-500/10 border-red-500/20 text-red-400"
                        )}>
                          {batch.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                           batch.status === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                           <AlertCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Import Batch #{batch.id.substring(0,6)}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {batch.date?.toDate ? batch.date.toDate().toLocaleString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{batch.totalLeads} Leads</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {batch.duplicatesSkipped} skipped
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
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
