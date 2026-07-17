import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Zap, Eye, ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { ProductChrome } from '../components/landing/ProductChrome';
import { PRICING_CONFIG } from '../lib/stripe';
import '../styles/landing.css';

import BrandLogo from '../components/BrandLogo';

const FAQS = [
  {
    question: "Is this a CRM replacement?",
    answer: "No. ArchRevenue monitors your leads for commercial signals and tells you when and why to act. It works alongside your existing CRM, not instead of it."
  },
  {
    question: "How does ArchRevenue find buying signals?",
    answer: "The engine continuously monitors publicly available information — hiring pages, press releases, funding announcements, and technology data — and compares current state against historical baselines to detect meaningful changes."
  },
  {
    question: "Where does my data go?",
    answer: "Your lead data is stored in your private Firestore instance. It is never shared, sold, or used to train shared models."
  },
  {
    question: "How is this different from LinkedIn Sales Navigator or Apollo?",
    answer: "Those tools help you find leads. ArchRevenue tells you which leads in your existing list are worth contacting today and exactly what to say. The input is your list. The output is a daily decision."
  }
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeFaqs, setActiveFaqs] = useState<Set<number>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const parallaxRef = useRef<HTMLDivElement>(null);

  // SEO Injection & Scroll Listener
  useEffect(() => {
    // 1. Ultra-Advanced SEO Metadata Injection
    document.title = "ArchRevenue | The Executive Revenue Intelligence Standard";
    
    const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (metaDescription) {
      metaDescription.content = "ArchRevenue is the premium AI intelligence layer for high-performance sales teams. Detect buying signals, forecast with precision, and control the flow of revenue.";
    }

    // 2. Structured Data (JSON-LD) for Rich Snippets
    const schemaOrgJSONLD = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "ArchRevenue",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": PRICING_CONFIG.STARTER_PRICE,
        "priceCurrency": "USD"
      },
      "description": "ArchRevenue is an AI-powered revenue intelligence platform that detects buying signals and prioritizes sales outreach."
    };

    let script = document.querySelector('#seo-schema') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'seo-schema';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(schemaOrgJSONLD);

    // 3. Scroll Handlers
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      
      const matchMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (matchMedia.matches || window.innerWidth < 1024) return;
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.1}px)`;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Warning for placeholders
    console.warn('⚠️ Testimonial data not provided — placeholder rendering active.');

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (script) script.remove();
    };
  }, []);

  return (
    <div className="landing-page min-h-screen bg-surface-background text-text-primary">
      
      {/* Navigation - Ultra Minimalist */}
      <nav
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-500",
          scrolled
            ? "bg-surface-background/95 backdrop-blur-md border-b border-border-default"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="flex items-center justify-between px-6 md:px-12 py-5 max-w-[1200px] mx-auto">
          <div className="flex items-center space-x-4">
            <BrandLogo className="w-5 h-5 text-text-primary" />
            <span className="text-[15px] font-display font-medium tracking-[0.2em] uppercase text-text-primary">ArchRevenue</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-12 text-[12px] uppercase tracking-widest font-medium text-text-secondary">
            <a href="#how-it-works" className="hover:text-text-primary transition-colors">Product</a>
            <a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-text-primary transition-colors">Login</Link>
            <Link
              to="/signup"
              className="btn-luxury px-6 py-3 border border-text-primary text-text-primary hover:bg-text-primary hover:text-surface-background transition-colors"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Mobile Nav Toggle */}
          <button 
            className="lg:hidden text-text-primary p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="space-y-1.5">
              <div className="w-6 h-[1px] bg-current"></div>
              <div className="w-6 h-[1px] bg-current"></div>
            </div>
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-surface-background border-b border-border-default p-8 flex flex-col space-y-6">
            <a href="#how-it-works" className="text-text-primary text-[13px] uppercase tracking-widest" onClick={() => setMobileMenuOpen(false)}>Product</a>
            <a href="#pricing" className="text-text-primary text-[13px] uppercase tracking-widest" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <Link to="/login" className="text-text-primary text-[13px] uppercase tracking-widest" onClick={() => setMobileMenuOpen(false)}>Login</Link>
            <Link to="/signup" className="text-text-primary font-medium text-[13px] uppercase tracking-widest border-b border-text-primary inline-block self-start pb-1" onClick={() => setMobileMenuOpen(false)}>Start 14-Day Free Trial</Link>
          </div>
        )}
      </nav>

      <main>
        {/* Section 1 — Hero */}
        <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-[1200px] mx-auto overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">
            <div className="w-full lg:w-[45%] z-10 animate-fade-in-up">
              <div className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-8 font-medium">
                The Standard in Revenue Intelligence
              </div>
              <h1 className="text-5xl lg:text-[72px] font-display text-text-primary leading-[1.05] mb-8 tracking-[-0.03em] font-medium">
                Know who to call. <br />
                <span className="text-text-secondary">And exactly why.</span>
              </h1>
              <p className="text-[17px] font-body text-text-secondary max-w-[500px] mb-12 leading-[1.8] font-light">
                ArchRevenue continuously monitors your pipeline for buying signals. It acts as an autonomous intelligence layer, surfacing the exact accounts ready to close before your competition even knows they exist.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 mb-8">
                <Link
                  to="/signup"
                  className="btn-luxury px-8 py-4 text-[13px] uppercase tracking-widest font-medium text-surface-background bg-text-primary border border-text-primary transition-all text-center"
                >
                  Start 14-Day Free Trial
                </Link>
              </div>
            </div>

            <div className="w-full lg:w-[45%] max-w-[480px] mx-auto lg:mx-0 lg:ml-auto z-10 animate-fade-in-scale">
              <div ref={parallaxRef} className="parallax-wrapper">
                <ProductChrome variant="mission-briefing" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 — Trust Bar */}
        <section className="py-12 lg:py-16 px-6 border-y border-border-default bg-surface-card">
          <div className="max-w-[1200px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center lg:text-left">
            {[
              { icon: Shield, text: "Uncompromising Privacy" },
              { icon: Lock, text: "SOC 2 Type II In Progress" },
              { icon: Zap, text: "Real-Time Signal Architecture" },
              { icon: Eye, text: "Fully Explainable Algorithms" }
            ].map((item, i) => (
              <div key={i} className={cn("flex flex-col lg:flex-row items-center lg:justify-center gap-4", i !== 0 && "lg:border-l lg:border-border-default")}>
                <item.icon className="w-5 h-5 text-text-primary shrink-0" strokeWidth={1.5} />
                <span className="text-[12px] uppercase tracking-widest text-text-secondary font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 — Problem */}
        <section className="py-24 lg:py-40 px-6 max-w-[800px] mx-auto text-center">
          <div className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-8 font-medium">The Structural Flaw</div>
          <h2 className="text-3xl lg:text-5xl font-display text-text-primary font-medium mb-8 leading-[1.1] tracking-[-0.02em]">
            CRMs record history.<br />
            They do not dictate strategy.
          </h2>
          <p className="text-[18px] text-text-secondary leading-[1.8] font-light max-w-[600px] mx-auto">
            You possess a list and a CRM. Yet every morning begins identically: reviewing stagnant data, guessing who is warm, and hoping you haven't missed a critical window. ArchRevenue changes the paradigm by monitoring reality, not just records.
          </p>
        </section>

        {/* Section 4 — Solution (How It Works) */}
        <section id="how-it-works" className="py-20 lg:py-32 px-6 bg-surface-card border-y border-border-default">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24">
              {[
                {
                  num: "01",
                  title: "Establish the Baseline",
                  body: "Integrate your existing CRM or upload target accounts. ArchRevenue instantly catalogs current leadership, technology, and hiring baselines."
                },
                {
                  num: "02",
                  title: "Autonomous Detection",
                  body: "Our engine continuously monitors structural changes—funding events, leadership transitions, and strategic hiring—across your entire portfolio."
                },
                {
                  num: "03",
                  title: "The Mission Briefing",
                  body: "Receive a stark, prioritized briefing each morning detailing exactly which account requires attention, the precise structural shift, and the recommended angle of approach."
                }
              ].map((step, i) => (
                <div key={i} className="relative">
                  <div className="text-[13px] font-mono text-text-primary mb-8 border-b border-text-primary inline-block pb-2">{step.num}</div>
                  <h3 className="text-2xl font-display font-medium text-text-primary mb-6">{step.title}</h3>
                  <p className="text-[15px] text-text-secondary leading-[1.8] font-light">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6 — Signal Showcase (AI Workflow) */}
        <section className="py-24 lg:py-40 px-6">
          <div className="max-w-[1200px] mx-auto flex flex-col-reverse lg:flex-row items-center gap-16 lg:gap-24">
            <div className="w-full lg:w-1/2">
              <ProductChrome variant="buying-signals" className="max-w-[500px] mx-auto lg:mx-0 shadow-2xl" />
            </div>
            <div className="w-full lg:w-1/2">
              <div className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-8 font-medium">Detection Capabilities</div>
              <h2 className="text-4xl lg:text-[56px] font-display text-text-primary font-medium mb-12 leading-[1.05] tracking-[-0.02em]">
                Signals that force <br />revenue windows.
              </h2>
              
              <div className="space-y-10 border-l border-border-default pl-8">
                {[
                  { title: "Strategic Hiring", body: "New SDR or AE hires signal a company aggressively investing in outbound revenue architecture." },
                  { title: "Capital Influx", body: "A new funding round creates a precise 60–90 day window before newly appointed leadership freezes budgets." },
                  { title: "Executive Transitions", body: "The installation of a new CRO or VP of Sales introduces an immediate mandate to audit and replace legacy vendors." },
                  { title: "Infrastructure Shifts", body: "A migration in their technology stack creates an immediate vacuum for integrated solutions." }
                ].map((signal, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[41px] top-1 w-[18px] h-[1px] bg-text-primary"></div>
                    <h4 className="text-[18px] font-display font-medium text-text-primary mb-3">{signal.title}</h4>
                    <p className="text-[15px] text-text-secondary leading-[1.8] font-light">{signal.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 7 — Testimonials */}
        <section className="py-24 lg:py-40 px-6 bg-surface-card border-y border-border-default">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-16 font-medium text-center">Executive Endorsements</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
              {[
                {
                  quote: "It eliminated hours of manual qualification on my very first day. The precision is unmatched.",
                  name: "Sarah Jenkins",
                  role: "Founder",
                  company: "Acme Corp"
                },
                {
                  quote: "The Deal Coach identified an objection I had completely overlooked. We closed the deal the following afternoon.",
                  name: "Michael Chen",
                  role: "Account Executive",
                  company: "TechFlow"
                },
                {
                  quote: "I uploaded 200 raw domains. Within an hour, I had 200 tailored, strategic outreach drafts prepared.",
                  name: "Elena Rodriguez",
                  role: "Head of Growth",
                  company: "CloudScale"
                }
              ].map((t, i) => (
                <div key={i} className="flex flex-col" data-placeholder="true">
                  <div className="mb-8">
                    <svg className="w-8 h-8 text-border-default" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                      <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                    </svg>
                  </div>
                  <p className="text-[17px] text-text-primary font-light leading-[1.8] mb-10 flex-grow">"{t.quote}"</p>
                  <div className="border-t border-border-default pt-6">
                    <div className="text-[13px] font-medium text-text-primary tracking-wide uppercase">{t.name}</div>
                    <div className="text-[12px] text-text-secondary mt-1">{t.role}, {t.company}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 8 — Pricing CTA */}
        <section id="pricing" className="py-24 lg:py-40 px-6">
          <div className="max-w-[800px] mx-auto text-center border border-border-default bg-surface-card p-12 lg:p-20">
            <div className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-8 font-medium">Pricing Architecture</div>
            <h2 className="text-4xl lg:text-5xl font-display text-text-primary font-medium mb-8 leading-[1.1] tracking-[-0.02em]">
              Command your pipeline.
            </h2>
            <p className="text-[16px] text-text-secondary mb-12 font-light max-w-[400px] mx-auto">
              A single, comprehensive tier. Full access to the intelligence engine, Mission Briefings, and Revenue Strategy modules.
            </p>
            <div className="text-[32px] font-display text-text-primary mb-12">
              ${PRICING_CONFIG.STARTER_PRICE} <span className="text-[14px] text-text-secondary font-body uppercase tracking-widest">/ month</span>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link
                to="/signup"
                className="btn-luxury px-8 py-4 text-[13px] uppercase tracking-widest font-medium text-surface-background bg-text-primary border border-text-primary transition-all text-center"
              >
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>
        </section>

        {/* Section 9 — FAQ */}
        <section className="py-20 lg:py-32 px-6 max-w-[800px] mx-auto">
          <div className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-12 font-medium text-center">Common Inquiries</div>
          <div className="border-t border-border-default">
            {FAQS.map((faq, i) => (
              <div key={i} className="border-b border-border-default">
                <button
                  onClick={() => {
                    const newFaqs = new Set(activeFaqs);
                    if (newFaqs.has(i)) newFaqs.delete(i);
                    else newFaqs.add(i);
                    setActiveFaqs(newFaqs);
                  }}
                  className="w-full text-left py-8 flex items-center justify-between focus:outline-none group"
                  aria-expanded={activeFaqs.has(i)}
                >
                  <span className="text-[16px] font-display font-medium text-text-primary pr-8 group-hover:text-text-secondary transition-colors">{faq.question}</span>
                  <ChevronDown className={cn("w-5 h-5 text-text-secondary shrink-0 transition-transform duration-300", activeFaqs.has(i) && "rotate-180")} />
                </button>
                <div 
                  className={cn("faq-accordion-content", activeFaqs.has(i) ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}
                >
                  <p className="pb-8 text-[15px] text-text-secondary leading-[1.8] font-light">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 10 — Final CTA */}
        <section className="py-24 lg:py-40 px-6 bg-surface-card border-t border-border-default text-center">
          <div className="max-w-[800px] mx-auto">
            <h2 className="text-4xl lg:text-[56px] font-display text-text-primary font-medium mb-6 leading-[1.1] tracking-[-0.02em]">
              The intelligence layer<br />for modern revenue.
            </h2>
            <p className="text-[18px] text-text-secondary mb-12 font-light">
              Elevate your outreach from guesswork to precision engineering.
            </p>
            <Link
              to="/signup"
              className="btn-luxury px-10 py-5 text-[13px] uppercase tracking-widest font-medium text-surface-background bg-text-primary border border-text-primary transition-all inline-block"
            >
              Start 14-Day Free Trial
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border-default">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-3">
            <BrandLogo className="w-5 h-5 text-text-primary" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-text-secondary font-medium">
              © {new Date().getFullYear()} Arch Technologies
            </span>
          </div>
          <div className="flex items-center space-x-8 text-[11px] uppercase tracking-widest text-text-secondary font-medium">
            <Link to="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
            <Link to="/security" className="hover:text-text-primary transition-colors">Security</Link>
            <a href="mailto:contact@archrevenue.com" className="hover:text-text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
