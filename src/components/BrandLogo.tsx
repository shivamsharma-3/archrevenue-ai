import React from 'react';

interface BrandLogoProps {
  className?: string;
  variant?: 'wordmark' | 'mark' | 'monochrome';
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * BrandMark — Letter "R" Monogram Tile
 * Used when a standalone mark/avatar is requested
 */
export function BrandMark({
  className = 'w-7 h-7',
  monochrome = false,
}: {
  className?: string;
  monochrome?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <linearGradient id="rsBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>
      {/* Premium Squircle Tile */}
      <rect
        width="100"
        height="100"
        rx="26"
        fill={monochrome ? 'currentColor' : 'url(#rsBgGrad)'}
      />
      <rect
        x="1.5"
        y="1.5"
        width="97"
        height="97"
        rx="24.5"
        fill="none"
        stroke={monochrome ? 'currentColor' : '#6366F1'}
        strokeWidth="2"
        strokeOpacity={monochrome ? 0.3 : 0.45}
      />
      {/* Letter R */}
      <text
        x="50"
        y="72"
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Outfit', sans-serif"
        fontWeight="900"
        fontSize="66"
        fill="#FFFFFF"
        letterSpacing="-2"
      >
        R
      </text>
    </svg>
  );
}

/**
 * BrandWordmark — Billion-Dollar Typographic Logotype
 * Pure typography, no distracting icons.
 * Engineered for executive authority, cohesion, and timeless luxury.
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
  // Size-specific typography scaling
  const fontSize = size === 'sm' ? '20px' : size === 'lg' ? '32px' : '25px';
  const dotSize = size === 'sm' ? '5px' : size === 'lg' ? '7px' : '6px';
  const primaryColor = theme === 'dark' ? '#F8FAFC' : '#090D16';

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      style={{
        lineHeight: 1,
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      }}
    >
      <span
        style={{
          fontSize,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          display: 'inline-flex',
          alignItems: 'baseline',
          color: primaryColor,
        }}
      >
        {/* "Rev" in signature Electric Indigo gradient */}
        <span
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 60%, #818CF8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 800,
          }}
        >
          Rev
        </span>

        {/* "Scout" in commanding executive slate */}
        <span
          style={{
            fontWeight: 800,
            color: primaryColor,
            marginLeft: '-0.02em',
          }}
        >
          Scout
        </span>

        {/* Subtle luminous brand anchor dot */}
        <span
          style={{
            display: 'inline-block',
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
            boxShadow: '0 0 8px rgba(99, 102, 241, 0.6)',
            marginLeft: '3px',
            marginBottom: '1px',
            flexShrink: 0,
          }}
        />
      </span>
    </div>
  );
}

/**
 * BrandLogo — Default export
 * Defaults to pure wordmark (no icon) for a pristine, billion-dollar brand presence
 */
export default function BrandLogo({
  className = '',
  variant = 'wordmark',
  theme = 'light',
  size = 'md',
}: BrandLogoProps) {
  if (variant === 'mark' || variant === 'monochrome') {
    return <BrandMark className={className || 'w-6 h-6'} monochrome={variant === 'monochrome'} />;
  }
  return <BrandWordmark className={className} theme={theme} size={size} />;
}
