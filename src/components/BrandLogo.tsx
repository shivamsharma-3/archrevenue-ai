import React from 'react';

interface BrandLogoProps {
  className?: string;
  /**
   * 'mark' = standalone stylish icon mark (default)
   * 'wordmark' = icon + "RevScout" typography
   * 'mark-bg' = icon on dark rounded tile
   * 'monochrome' = currentColor single-tone
   */
  variant?: 'mark' | 'wordmark' | 'mark-bg' | 'monochrome';
  /** 'dark' for dark backgrounds, 'light' (default) for light */
  theme?: 'light' | 'dark' | 'auto';
  /** Size preset for wordmark: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
}

// Stable counter for unique IDs (avoids colon issues from React.useId)
let _idCounter = 0;
function nextId() {
  return `rs${++_idCounter}`;
}

/**
 * RevScout Stylish Aerodynamic Delta Icon Mark
 */
export function BrandMark({ className, monochrome = false }: { className?: string; monochrome?: boolean }) {
  // Generate stable IDs without colons
  const [id] = React.useState(() => nextId());

  if (monochrome) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 48.5 11 L 16 83 L 21 88 L 35 88 L 48.5 51 Z" fill="currentColor" />
        <path d="M 51.5 11 L 51.5 51 L 65 88 L 79 88 L 84 83 Z" fill="currentColor" />
        <polygon points="50,38 55,47 50,56 45,47" fill="currentColor" opacity="0.7" />
      </svg>
    );
  }

  const lGrad = `lg-${id}`;
  const rGrad = `rg-${id}`;
  const cGrad = `cg-${id}`;
  const rimL = `rl-${id}`;
  const rimR = `rr-${id}`;

  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Left Wing: Deep Cobalt → Indigo */}
        <linearGradient id={lGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="45%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Right Wing: Indigo → Violet → Purple */}
        <linearGradient id={rGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="55%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>

        {/* Inner Core: Soft Lavender */}
        <linearGradient id={cGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E0E7FF" />
          <stop offset="100%" stopColor="#A5B4FC" />
        </linearGradient>

        {/* Specular Left Rim */}
        <linearGradient id={rimL} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#93C5FD" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
        </linearGradient>

        {/* Specular Right Rim */}
        <linearGradient id={rimR} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#D8B4FE" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Left Wing (chamfered aerodynamic base) */}
      <path d="M 48.5 11 L 16 83 L 21 88 L 35 88 L 48.5 51 Z" fill={`url(#${lGrad})`} />

      {/* Right Wing (chamfered aerodynamic base) */}
      <path d="M 51.5 11 L 51.5 51 L 65 88 L 79 88 L 84 83 Z" fill={`url(#${rGrad})`} />

      {/* Specular edge highlights */}
      <line x1="48.5" y1="11" x2="16" y2="83"
        stroke={`url(#${rimL})`} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="51.5" y1="11" x2="84" y2="83"
        stroke={`url(#${rimR})`} strokeWidth="1.8" strokeLinecap="round" />

      {/* Inner Scout Intelligence Core (diamond aperture) */}
      <polygon points="50,38 55,47 50,56 45,47" fill={`url(#${cGrad})`} opacity="0.95" />
      {/* Central Spark */}
      <circle cx="50" cy="47" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * BrandWordmark: Icon + Syne Custom Typography
 */
export function BrandWordmark({
  className = '',
  theme = 'light',
  size = 'md',
}: {
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'sm' | 'md' | 'lg';
}) {
  const iconClass =
    size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';

  const textClass =
    size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-[22px]' : 'text-[19px]';

  const scoutColor =
    theme === 'dark' ? 'text-white' : 'text-slate-900';

  const dotClass =
    size === 'lg' ? 'w-2 h-2 ml-1.5' : 'w-1.5 h-1.5 ml-1';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <BrandMark className={iconClass} />
      <span
        className={`flex items-center leading-none`}
        style={{ fontFamily: "'Syne', 'Outfit', sans-serif" }}
      >
        {/* "Rev" — Cormorant Garamond italic: ultra-luxury serif contrast */}
        <span
          className={`font-bold italic ${textClass} tracking-[-0.01em]`}
          style={{
            fontFamily: "'Cormorant Garamond', 'Georgia', serif",
            fontWeight: 700,
            fontStyle: 'italic',
            background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 40%, #4F46E5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Rev
        </span>
        {/* "Scout" — Syne bold geometric sans */}
        <span
          className={`font-extrabold tracking-[-0.045em] ${textClass} ${scoutColor}`}
          style={{ fontFamily: "'Syne', 'Outfit', sans-serif", fontWeight: 800 }}
        >
          Scout
        </span>
        {/* Brand accent dot */}
        <span
          className={`inline-block ${dotClass} rounded-full mb-0.5 flex-shrink-0`}
          style={{
            background: 'linear-gradient(135deg, #6366F1, #A855F7)',
            boxShadow: '0 0 6px rgba(99,102,241,0.6)',
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
  if (variant === 'wordmark') {
    return <BrandWordmark className={className} theme={theme} size={size} />;
  }

  if (variant === 'mark-bg') {
    return (
      <div
        className={`rounded-xl flex items-center justify-center shadow-lg ${className}`}
        style={{
          background: 'linear-gradient(160deg, #0F172A 0%, #06091A 100%)',
          border: '1px solid rgba(99,102,241,0.35)',
          boxShadow: '0 4px 20px rgba(99,102,241,0.2)',
          padding: '8px',
        }}
      >
        <BrandMark className="w-full h-full" />
      </div>
    );
  }

  if (variant === 'monochrome') {
    return <BrandMark className={className} monochrome />;
  }

  return <BrandMark className={className} />;
}
