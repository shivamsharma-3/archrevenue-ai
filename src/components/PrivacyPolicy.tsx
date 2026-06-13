import React from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Shell from './Shell';

export default function PrivacyPolicy() {
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
            <Shield className="w-8 h-8 text-[#6366f1]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-display mb-4">Privacy Policy</h1>
          <p className="text-zinc-400 text-lg">How we handle and protect your revenue data.</p>
        </div>

        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4 font-display">1. Information We Collect</h2>
            <p className="leading-relaxed mb-4">
              When you use Arch Revenues, we collect information necessary to provide our core services. This includes your account details (email, name), the company profile you set up, and the lead data you input or connect to our system.
            </p>
            <p className="leading-relaxed text-[#6366f1] font-medium">
              Important: Users retain complete ownership of all their data.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4 font-display">2. How We Use Information</h2>
            <p className="leading-relaxed mb-4">
              Your information is used strictly to deliver the Arch Revenues platform functionality. We use it to authenticate your access, store your leads, and power the AI insights tailored to your specific company profile.
            </p>
            <p className="leading-relaxed text-[#00d2ff] font-medium">
              We never sell your data, and your data is never shared with other customers.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4 font-display">3. AI Processing Disclosure</h2>
            <p className="leading-relaxed mb-4">
              Arch Revenues uses advanced AI models to score leads, research companies, and generate personalized outreach. The data you provide (such as your seller profile and lead information) is temporarily processed by our AI partners solely to generate these insights.
            </p>
            <p className="leading-relaxed text-zinc-400">
              AI processing is used exclusively to provide platform functionality. It is not used to train global public models.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4 font-display">4. Data Storage & Security</h2>
            <p className="leading-relaxed mb-4">
              Your data is stored securely in our cloud infrastructure. We implement strict, mathematically verified security rules to ensure that your customer records remain entirely isolated from all other users on the platform. No one else can access your pipeline.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4 font-display">5. Third-Party Services</h2>
            <p className="leading-relaxed mb-4">To deliver a premium experience, we partner with industry-leading infrastructure providers:</p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong className="text-zinc-200">Firebase & Firestore:</strong> For secure database storage and real-time syncing.</li>
              <li><strong className="text-zinc-200">Google Authentication:</strong> For secure, passwordless account access.</li>
              <li><strong className="text-zinc-200">Groq AI:</strong> For ultra-fast, high-performance artificial intelligence processing.</li>
            </ul>
          </section>

          {/* Section 6 & 7 */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white mb-4 font-display">6. Data Retention</h2>
              <p className="leading-relaxed">
                We retain your data only for as long as your account is active. You can manage your pipeline directly from your dashboard.
              </p>
            </section>

            <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white mb-4 font-display">7. User Rights</h2>
              <p className="leading-relaxed">
                You have the right to access, modify, export, or permanently delete any of the leads or company profiles you have created within the platform.
              </p>
            </section>
          </div>

          {/* Section 8 & 9 */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white mb-4 font-display">8. Account Deletion</h2>
              <p className="leading-relaxed">
                If you choose to delete your Arch Revenues account, all associated leads, settings, and profile data will be permanently wiped from our databases.
              </p>
            </section>

            <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-4 font-display">9. Contact Information</h2>
              <p className="leading-relaxed">
                For questions regarding your privacy or data security, please reach out to our dedicated support team via your account dashboard.
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </Shell>
  );
}

