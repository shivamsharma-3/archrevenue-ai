import React from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowLeft, CheckCircle2, ShieldCheck, Database, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import Shell from './Shell';

export default function SecurityTrust() {
  return (
    <Shell hideSidebar={true}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-6 mt-16"
      >
        <div className="mb-12 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#6366f1]/10 border border-[#6366f1]/20 mb-6">
            <ShieldCheck className="w-8 h-8 text-[#6366f1]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-display mb-4">Security & Trust Center</h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Enterprise-grade security built into every layer. We designed Arch Revenues so you can focus on closing deals, knowing your pipeline is mathematically protected.
          </p>
        </div>
        {/* Trust Indicators Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {[
            'Firebase Authentication',
            'User-Level Data Isolation',
            'Firestore Security Rules',
            'Encrypted Data In Transit',
            'Secure Google Authentication',
            'Restricted Database Access'
          ].map((item, i) => (
            <div key={i} className="flex items-center space-x-3 bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-sm font-medium text-white">{item}</span>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {/* Section 1 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-3xl p-8 md:p-10 backdrop-blur-xl">
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white mb-3 font-display">1. Lead Data Isolation & Database Security</h2>
                <p className="leading-relaxed text-zinc-400 mb-4">
                  In Arch Revenues, your leads are strictly scoped to your account. Why can't users see each other's leads? Because our database architecture uses rigorous Firestore Security Rules that evaluate every single request at the server level. 
                </p>
                <p className="leading-relaxed text-zinc-400">
                  Even if someone tries to request data outside the application, the database explicitly rejects any read or write where the authenticated user ID doesn't perfectly match the data owner. This guarantees complete pipeline isolation.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-3xl p-8 md:p-10 backdrop-blur-xl">
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Key className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white mb-3 font-display">2. Authentication Security</h2>
                <p className="leading-relaxed text-zinc-400 mb-4">
                  We leverage Google's enterprise-grade identity platform (Firebase Authentication) to handle all sign-ins. This means your passwords are never stored in plain text, and you can opt to use secure Google Authentication to bypass passwords entirely.
                </p>
                <p className="leading-relaxed text-zinc-400">
                  Every session is cryptographically signed, ensuring that only you can access your terminal.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-3xl p-8 md:p-10 backdrop-blur-xl">
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white mb-3 font-display">3. Customer Data Protection</h2>
                <p className="leading-relaxed text-zinc-400 mb-4">
                  Your trust is our ultimate metric. Arch Revenues does not sell customer data to third parties. Your proprietary pipeline, notes, and strategies remain yours. All customer information is stored securely on modern cloud infrastructure with encryption applied to data in transit.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-3xl p-8 md:p-10 backdrop-blur-xl">
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white mb-3 font-display">4. AI Processing Security</h2>
                <p className="leading-relaxed text-zinc-400 mb-4">
                  Our AI intelligence engine processes your requests in real-time. The data sent to our AI providers (like Groq) is ephemeral—used strictly to score leads or generate outreach for that specific request, and never retained to train public models.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Security Best Practices */}
        <div className="mt-16 bg-gradient-to-br from-[#6366f1]/10 to-transparent border border-[#6366f1]/20 rounded-3xl p-8 md:p-10">
          <h2 className="text-2xl font-semibold text-white mb-6 font-display text-center">Security Best Practices</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-[#6366f1] font-semibold mb-2">Use Strong Passwords</div>
              <p className="text-sm text-zinc-400">If using email login, ensure your password is unique and complex.</p>
            </div>
            <div>
              <div className="text-[#6366f1] font-semibold mb-2">Google Sign-in</div>
              <p className="text-sm text-zinc-400">Use Google Auth for seamless, passwordless security backed by your workspace.</p>
            </div>
            <div>
              <div className="text-[#6366f1] font-semibold mb-2">Review Access</div>
              <p className="text-sm text-zinc-400">Regularly monitor your active sessions and connected accounts.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </Shell>
  );
}

