import React from 'react';

interface BrandLogoProps {
  className?: string;
  variant?: 'mark' | 'wordmark' | 'mark-bg' | 'monochrome';
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * RevScout Precision Radar Mark
 * Clean concentric rings + sweep vector — instantly recognizable as "scouting intelligence"
 * Uses solid fills (no SVG gradient defs) = 100% reliable rendering in all contexts
 */
export function BrandMark({ className, monochrome = false }: { className?: string; monochrome?: boolean }) {
  const base = monochrome ? 'currentColor' : undefined;

  if (monochrome) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="54" r="33" stroke="currentColor" strokeWidth="3.5" opacity="0.3" />
        <circle cx="50" cy="54" r="21" stroke="currentColor" strokeWidth="3.5" opacity="0.6" />
        <circle cx="50" cy="54" r="9"  stroke="currentColor" strokeWidth="3.5" opacity="0.9" />
        <circle cx="50" cy="54" r="3"  fill="currentColor" />
        <line x1="50" y1="54" x2="75" y2="24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <polygon points="75,24 65,30 72,38" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring */}
      <circle cx="50" cy="54" r="33" stroke="#6366F1" strokeWidth="3" opacity="0.25" />
      {/* Middle ring */}
      <circle cx="50" cy="54" r="21" stroke="#7C3AED" strokeWidth="3" opacity="0.55" />
      {/* Inner ring */}
      <circle cx="50" cy="54" r="9"  stroke="#6366F1" strokeWidth="3" opacity="0.9" />
      {/* Center dot */}
      <circle cx="50" cy="54" r="3.5" fill="#6366F1" />
      {/* Sweep vector line */}
      <line x1="50" y1="54" x2="75" y2="24" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
      {/* Arrow head */}
      <polygon points="75,24 65,30 72,38" fill="#6366F1" />
      {/* Axis ticks for premium feel */}
      <line x1="50" y1="42" x2="50" y2="46" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="50" y1="62" x2="50" y2="66" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="38" y1="54" x2="42" y2="54" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="58" y1="54" x2="62" y2="54" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/**
 * BrandWordmark — Billion-dollar typographic contrast
 * "Rev" in Playfair Display italic (high-fashion editorial serif)
 * "Scout" in Syne ExtraBold (precision geometric sans)
 */
export function BrandWordmark({
  className = '',
  theme = 'light',
  size = 'md',
}: {
  className?: string;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}) {
  const iconClass = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  const revSize  = size === 'sm' ? '16px' : size === 'lg' ? '26px' : '21px';
  const sctSize  = size === 'sm' ? '14px' : size === 'lg' ? '22px' : '18px';
  const dotSize  = size === 'sm' ? '5px'  : size === 'lg' ? '8px'  : '6px';
  const scoutColor = theme === 'dark' ? '#FFFFFF' : '#0F172A';

  return (
    <div className={`inline-flex items-center select-none`} style={{ gap: '10px' }}>
      <BrandMark className={iconClass} />

      <span className="inline-flex items-baseline leading-none" style={{ gap: '0px' }}>
        {/* "Rev" — Playfair Display Italic: ultra-luxury editorial serif */}
        <span
          style={{
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: revSize,
            letterSpacing: '-0.01em',
            background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 45%, #4F46E5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
          }}
        >
          Rev
        </span>

        {/* "Scout" — Syne ExtraBold: sharp precision geometric sans */}
        <span
          style={{
            fontFamily: "'Syne', 'Outfit', sans-serif",
            fontWeight: 800,
            fontStyle: 'normal',
            fontSize: sctSize,
            letterSpacing: '-0.045em',
            color: scoutColor,
            lineHeight: 1,
          }}
        >
          Scout
        </span>

        {/* Glowing brand accent dot */}
        <span
          style={{
            display: 'inline-block',
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1, #A855F7)',
            boxShadow: '0 0 6px rgba(99,102,241,0.65)',
            marginLeft: '3px',
            marginBottom: '2px',
            flexShrink: 0,
          }}
        />
      </span>
    </div>
  );
}

/**
 * BrandLogo — Default export
 */
export default function BrandLogo({
  className = 'w-6 h-6',
  variant = 'mark',
  theme = 'light',
  size = 'md',
}: BrandLogoProps) {
  if (variant === 'wordmark') return <BrandWordmark className={className} theme={theme} size={size} />;

  if (variant === 'mark-bg') {
    return (
      <div
        style={{
          background: 'linear-gradient(160deg, #0F172A 0%, #06091A 100%)',
          border: '1px solid rgba(99,102,241,0.3)',
          boxShadow: '0 4px 20px rgba(99,102,241,0.18)',
          borderRadius: '22%',
          padding: '18%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className={className}
      >
        <BrandMark className="w-full h-full" />
      </div>
    );
  }

  if (variant === 'monochrome') return <BrandMark className={className} monochrome />;

  return <BrandMark className={className} />;
}
