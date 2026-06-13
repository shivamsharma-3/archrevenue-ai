import React from 'react';
import { motion } from 'motion/react';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Shell from './Shell';

export default function TermsOfService() {
  return (
    <Shell hideSidebar={true}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-6 mt-16"
      >
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#6366f1]/10 border border-[#6366f1]/20 mb-6">
            <FileText className="w-8 h-8 text-[#6366f1]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-display mb-4">Terms of Service</h1>
          <p className="text-zinc-400 text-lg">The rules of engagement for using the Arch Revenues platform.</p>
        </div>

        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4 font-display">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using Arch Revenues, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform. Our platform is designed to provide AI-powered revenue intelligence for professional B2B teams.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4 font-display">2. Account Responsibilities</h2>
            <p className="leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4 font-display">3. Acceptable Use</h2>
            <p className="leading-relaxed mb-4">
              Arch Revenues must be used in a professional manner. You agree not to use the platform to process illegal, misleading, or malicious data. Accounts found engaging in abusive practices, spamming, or violating platform integrity may be suspended immediately.
            </p>
            <p className="leading-relaxed text-[#ff4b4b] font-medium">
              We reserve the right to suspend accounts for abuse of the service.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4 font-display">4. User Content Ownership</h2>
            <p className="leading-relaxed">
              You retain complete ownership of all data, leads, and content you upload to or generate within the platform. Arch Revenues claims no ownership rights over your proprietary business information. We only use this data to provide the service to you.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4 font-display">5. AI Generated Content Disclaimer</h2>
            <p className="leading-relaxed mb-4">
              Arch Revenues provides AI-generated insights, scoring, and outreach recommendations. While we strive for high accuracy, these outputs are informational and not guaranteed. 
            </p>
            <p className="leading-relaxed text-amber-400 font-medium">
              Users are solely responsible for validating AI-generated recommendations before taking action or sending outreach to prospects.
            </p>
          </section>

          {/* Section 6 & 7 */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white mb-4 font-display">6. Service Availability</h2>
              <p className="leading-relaxed">
                We strive to maintain maximum uptime for the platform. However, the service is provided "as is," and we do not guarantee uninterrupted access or operations.
              </p>
            </section>

            <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white mb-4 font-display">7. Limitation of Liability</h2>
              <p className="leading-relaxed">
                Arch Revenues is not liable for any direct, indirect, or consequential business losses or damages resulting from the use or inability to use our platform or AI recommendations.
              </p>
            </section>
          </div>

          {/* Section 8 & 9 */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white mb-4 font-display">8. Termination</h2>
              <p className="leading-relaxed">
                You may terminate your account at any time. We may also terminate or suspend your access if you breach these terms. Upon termination, your right to use the platform ceases immediately.
              </p>
            </section>

            <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white mb-4 font-display">9. Contact Information</h2>
              <p className="leading-relaxed">
                For legal inquiries or questions about these Terms of Service, please contact our administrative team via the dashboard support channel.
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </Shell>
  );
}

