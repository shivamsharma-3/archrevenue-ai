import React from 'react';

interface BrandLogoProps {
  className?: string;
  /**
   * 'mark' = standalone stylish icon mark (default, for icons, badges, nav dots)
   * 'wordmark' = icon + custom "RevScout" typography
   * 'mark-bg' = icon on dark rounded luxury tile
   * 'monochrome' = uses currentColor for single-tone icons
   */
  variant?: 'mark' | 'wordmark' | 'mark-bg' | 'monochrome';
  /** Text color theme for wordmark variant: 'dark' for dark backgrounds, 'light' for light backgrounds (default) */
  theme?: 'light' | 'dark' | 'auto';
  /** Optional size preset for wordmark: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * RevScout Stylish Aerodynamic Delta Mark
 * Modern architectural chevron with precision kinetic slit, chamfered wings,
 * specular edge lighting, and an inner scouting intelligence core.
 */
export function BrandMark({ className, monochrome = false }: { className?: string; monochrome?: boolean }) {
  const gradId = React.useId().replace(/:/g, '');

  if (monochrome) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left Wing */}
        <path d="M 48.5 11 L 16 83 L 21 88 L 35 88 L 48.5 51 Z" fill="currentColor" />
        {/* Right Wing */}
        <path d="M 51.5 11 L 51.5 51 L 65 88 L 79 88 L 84 83 Z" fill="currentColor" />
        {/* Inner Scout Core */}
        <polygon points="50,38 55,47 50,56 45,47" fill="currentColor" opacity="0.9" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Left Wing Gradient - Deep Cobalt to Vibrant Indigo */}
        <linearGradient id={`grad-l-${gradId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="45%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Right Wing Gradient - Electric Indigo to Vivid Violet/Magenta */}
        <linearGradient id={`grad-r-${gradId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="60%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>

        {/* Inner Scout Core Gradient */}
        <linearGradient id={`grad-c-${gradId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A5B4FC" />
          <stop offset="100%" stopColor="#E0E7FF" />
        </linearGradient>

        {/* Specular Rim Highlight Left */}
        <linearGradient id={`rim-l-${gradId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#93C5FD" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
        </linearGradient>

        {/* Specular Rim Highlight Right */}
        <linearGradient id={`rim-r-${gradId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#C4B5FD" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Left Wing (Aerodynamic faceted shadow plane with chamfered base) */}
      <path
        d="M 48.5 11 L 16 83 L 21 88 L 35 88 L 48.5 51 Z"
        fill={`url(#grad-l-${gradId})`}
      />

      {/* Right Wing (Aerodynamic faceted light plane with chamfered base) */}
      <path
        d="M 51.5 11 L 51.5 51 L 65 88 L 79 88 L 84 83 Z"
        fill={`url(#grad-r-${gradId})`}
      />

      {/* Left Leading Edge Specular Rim */}
      <line
        x1="48.5"
        y1="11"
        x2="16"
        y2="83"
        stroke={`url(#rim-l-${gradId})`}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Right Leading Edge Specular Rim */}
      <line
        x1="51.5"
        y1="11"
        x2="84"
        y2="83"
        stroke={`url(#rim-r-${gradId})`}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Inner Scout Intelligence Core (Glowing diamond aperture) */}
      <polygon
        points="50,38 55,47 50,56 45,47"
        fill={`url(#grad-c-${gradId})`}
        filter="drop-shadow(0 0 3px rgba(129, 140, 248, 0.6))"
      />
      {/* Central Spark */}
      <circle cx="50" cy="47" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * BrandWordmark: Icon + Distinctive Syne Typography + Sleek Brand Dot
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
    size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-2xl' : 'text-[19px]';

  const scoutColorClass =
    theme === 'dark' ? 'text-white' : 'text-slate-900';

  const dotSizeClass =
    size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5';

  return (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      <BrandMark className={iconClassName || iconSizeClass} />
      <span
        className={`font-brand font-extrabold ${textSizeClass} tracking-[-0.035em] flex items-center leading-none`}
        style={{ fontFamily: "'Syne', 'Outfit', sans-serif" }}
      >
        <span className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 bg-clip-text text-transparent drop-shadow-sm">
          Rev
        </span>
        <span className={`${scoutColorClass} ml-[1px] font-bold tracking-tight`}>
          Scout
        </span>
        {/* Stylish Brand Accent Dot */}
        <span className={`inline-block ${dotSizeClass} rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 ml-1 mb-0.5 shadow-sm shadow-indigo-500/50`} />
      </span>
    </div>
  );
}

/**
 * BrandLogo: Default export with versatile variant support
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
      <div className={`rounded-xl bg-gradient-to-b from-[#0F172A] to-[#0A0F1D] border border-slate-700/60 p-2 flex items-center justify-center shadow-lg shadow-indigo-950/30 ${className}`}>
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
