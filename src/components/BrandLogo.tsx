import React from 'react';

interface BrandLogoProps {
  className?: string;
  /**
   * 'mark' = standalone icon mark (default, for icons, badges, nav dots)
   * 'wordmark' = icon + custom "RevScout" typography
   * 'mark-bg' = icon on dark rounded tile
   * 'monochrome' = uses currentColor for single-tone icons
   */
  variant?: 'mark' | 'wordmark' | 'mark-bg' | 'monochrome';
  /** Text color theme for wordmark variant: 'dark' for dark backgrounds, 'light' for light backgrounds (default) */
  theme?: 'light' | 'dark' | 'auto';
  /** Optional size preset for wordmark: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * RevScout Icon Mark SVG
 * Precision faceted upward delta/chevron combining architectural precision with scouting intelligence.
 */
export function BrandMark({ className, monochrome = false }: { className?: string; monochrome?: boolean }) {
  const gradId = React.useId();

  if (monochrome) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 50 12 L 16 88 L 35 88 L 50 50 L 65 88 L 84 88 Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`grad-l-${gradId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id={`grad-r-${gradId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      {/* Left Wing (faceted shadow plane) */}
      <path d="M 50 12 L 16 88 L 35 88 L 50 50 Z" fill={`url(#grad-l-${gradId})`} />
      {/* Right Wing (faceted light plane) */}
      <path d="M 50 12 L 50 50 L 65 88 L 84 88 Z" fill={`url(#grad-r-${gradId})`} />
      {/* Center Vertex Light Pulse */}
      <circle cx="50" cy="50" r="2.5" fill="#FFFFFF" opacity="0.85" />
    </svg>
  );
}

/**
 * BrandWordmark: Icon + Custom Syne-powered Typography
 * Far from simple fonts — styled with precision geometric typography and gradient accents.
 */
export function BrandWordmark({
  className = '',
  theme = 'light',
  size = 'md',
  iconClassName,
}: {
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'sm' | 'md' | 'lg';
  iconClassName?: string;
}) {
  const iconSizeClass =
    size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';

  const textSizeClass =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';

  const scoutColorClass =
    theme === 'dark' ? 'text-white' : 'text-slate-900';

  return (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      <BrandMark className={iconClassName || iconSizeClass} />
      <span
        className={`font-brand font-extrabold ${textSizeClass} tracking-[-0.03em] flex items-center leading-none`}
        style={{ fontFamily: "'Syne', 'Outfit', sans-serif" }}
      >
        <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
          Rev
        </span>
        <span className={`${scoutColorClass} ml-[0.5px] font-bold`}>
          Scout
        </span>
      </span>
    </div>
  );
}

/**
 * BrandLogo: Default export with versatile variant support
 * Defaults to 'mark' so `<BrandLogo className="w-5 h-5" />` works properly everywhere!
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
      <div className={`rounded-xl bg-[#0A0F1D] border border-slate-800/80 p-2 flex items-center justify-center shadow-md ${className}`}>
        <BrandMark className="w-full h-full" />
      </div>
    );
  }

  if (variant === 'monochrome') {
    return <BrandMark className={className} monochrome />;
  }

  // Default: variant === 'mark'
  return <BrandMark className={className} />;
}
