import React from 'react';

interface BrandLogoProps {
  className?: string;
  /** 'mark' = icon only (for favicon / small nav dot)
   *  'wordmark' = icon + custom lettering (default, for nav bar / login)
   *  'mark-bg' = icon on dark rounded background */
  variant?: 'mark' | 'wordmark' | 'mark-bg';
}

export default function BrandLogo({ className, variant = 'wordmark' }: BrandLogoProps) {
  // ── Icon-only on dark background (favicon style) ──────────────────────────
  if (variant === 'mark-bg') {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mbg-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366F1"/>
            <stop offset="100%" stopColor="#8B5CF6"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" fill="#0F172A"/>
        <circle cx="50" cy="53" r="34" stroke="url(#mbg-g)" strokeWidth="2.5" opacity="0.3"/>
        <circle cx="50" cy="53" r="22" stroke="url(#mbg-g)" strokeWidth="2.5" opacity="0.55"/>
        <circle cx="50" cy="53" r="10" stroke="url(#mbg-g)" strokeWidth="2.5" opacity="0.9"/>
        <circle cx="50" cy="53" r="3.5" fill="url(#mbg-g)"/>
        <line x1="50" y1="53" x2="74" y2="24" stroke="url(#mbg-g)" strokeWidth="2.8" strokeLinecap="round"/>
        <polygon points="74,24 64,29 70,37" fill="url(#mbg-g)"/>
        <line x1="50" y1="41" x2="50" y2="45" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        <line x1="50" y1="61" x2="50" y2="65" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        <line x1="38" y1="53" x2="42" y2="53" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        <line x1="58" y1="53" x2="62" y2="53" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      </svg>
    );
  }

  // ── Icon-only flat mark ────────────────────────────────────────────────────
  if (variant === 'mark') {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mk-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366F1"/>
            <stop offset="100%" stopColor="#8B5CF6"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="53" r="34" stroke="url(#mk-g)" strokeWidth="3" opacity="0.28"/>
        <circle cx="50" cy="53" r="22" stroke="url(#mk-g)" strokeWidth="3" opacity="0.55"/>
        <circle cx="50" cy="53" r="10" stroke="url(#mk-g)" strokeWidth="3" opacity="0.9"/>
        <circle cx="50" cy="53" r="3.5" fill="url(#mk-g)"/>
        <line x1="50" y1="53" x2="74" y2="24" stroke="url(#mk-g)" strokeWidth="3" strokeLinecap="round"/>
        <polygon points="74,24 64,29 70,37" fill="url(#mk-g)"/>
        <line x1="50" y1="41" x2="50" y2="45" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" opacity="0.55"/>
        <line x1="50" y1="61" x2="50" y2="65" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" opacity="0.55"/>
        <line x1="38" y1="53" x2="42" y2="53" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" opacity="0.55"/>
        <line x1="58" y1="53" x2="62" y2="53" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" opacity="0.55"/>
      </svg>
    );
  }

  // ── Full wordmark: icon + custom geometric "RevScout" lettering ───────────
  // ViewBox: 320 wide × 72 tall
  // Icon occupies 0-72, text starts at 82
  return (
    <svg className={className} viewBox="0 0 320 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wm-icon-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1"/>
          <stop offset="100%" stopColor="#8B5CF6"/>
        </linearGradient>
        <linearGradient id="wm-text-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366F1"/>
          <stop offset="100%" stopColor="#A78BFA"/>
        </linearGradient>
      </defs>

      {/* ── Radar Icon (36×36, centred at 36,36) ── */}
      <circle cx="36" cy="36" r="30" stroke="url(#wm-icon-g)" strokeWidth="2.2" opacity="0.28"/>
      <circle cx="36" cy="36" r="20" stroke="url(#wm-icon-g)" strokeWidth="2.2" opacity="0.55"/>
      <circle cx="36" cy="36" r="9"  stroke="url(#wm-icon-g)" strokeWidth="2.2" opacity="0.9"/>
      <circle cx="36" cy="36" r="3"  fill="url(#wm-icon-g)"/>
      <line x1="36" y1="36" x2="57" y2="11" stroke="url(#wm-icon-g)" strokeWidth="2.4" strokeLinecap="round"/>
      <polygon points="57,11 49,16 54,23" fill="url(#wm-icon-g)"/>
      {/* crosshair ticks */}
      <line x1="36" y1="26" x2="36" y2="30" stroke="#6366F1" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
      <line x1="36" y1="42" x2="36" y2="46" stroke="#6366F1" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
      <line x1="26" y1="36" x2="30" y2="36" stroke="#6366F1" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
      <line x1="42" y1="36" x2="46" y2="36" stroke="#6366F1" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>

      {/* ── Custom geometric "RevScout" text (y baseline = 52) ── */}
      {/* Using Space Grotesk / Outfit embedded via foreignObject trick is unreliable;
          instead we embed a <text> with a premium Google Font loaded in the app,
          but apply letter-spacing, font-variant, and weight for a strong custom feel.
          The gradient fill makes it non-generic even with a web font. */}
      <text
        x="82"
        y="51"
        fontSize="36"
        fontWeight="800"
        fontFamily="'Outfit', 'Space Grotesk', 'Inter', system-ui, sans-serif"
        letterSpacing="-0.5"
        fill="url(#wm-text-g)"
      >
        Rev
      </text>
      <text
        x="161"
        y="51"
        fontSize="36"
        fontWeight="300"
        fontFamily="'Outfit', 'Space Grotesk', 'Inter', system-ui, sans-serif"
        letterSpacing="1"
        fill="url(#wm-text-g)"
        opacity="0.9"
      >
        Scout
      </text>
    </svg>
  );
}
