import React from 'react';

interface BrandLogoProps {
  className?: string;
  variant?: 'wordmark' | 'mark' | 'monochrome';
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
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
 * When animated={true} (header only), activates:
 *  - Ethereal liquid metallic shimmer through "Rev"
 *  - High-tech radar opportunity signal ping on the brand accent dot
 *  - Micro-spring hover lift with kinetic sheen
 */
export function BrandWordmark({
  className = '',
  theme = 'light',
  size = 'md',
  animated = false,
}: {
  className?: string;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}) {
  // Size-specific typography scaling
  const fontSize = size === 'sm' ? '20px' : size === 'lg' ? '32px' : '25px';
  const dotSize = size === 'sm' ? '5px' : size === 'lg' ? '7px' : '6px';
  const primaryColor = theme === 'dark' ? '#F8FAFC' : '#090D16';

  return (
    <div
      className={`inline-flex items-center select-none group/brand ${animated ? 'rev-header-logo-animated' : ''} ${className}`}
      style={{
        lineHeight: 1,
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
        transition: animated ? 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)' : undefined,
      }}
    >
      {animated && (
        <style>{`
          @keyframes revShimmerFlow {
            0% {
              background-position: 0% 50%;
            }
            32% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 100% 50%;
            }
          }
          @keyframes revRadarPulse {
            0% {
              transform: scale(0.95);
              opacity: 0.9;
            }
            50% {
              transform: scale(2.8);
              opacity: 0;
            }
            100% {
              transform: scale(2.8);
              opacity: 0;
            }
          }
          @keyframes revDotBreathe {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 8px rgba(99, 102, 241, 0.7);
            }
            50% {
              transform: scale(1.16);
              box-shadow: 0 0 16px rgba(99, 102, 241, 0.95), 0 0 24px rgba(129, 140, 248, 0.5);
            }
          }
          .rev-header-logo-animated:hover {
            transform: translateY(-1.5px);
          }
          .rev-header-logo-animated:hover .rev-gradient-text {
            animation-duration: 2.2s !important;
          }
        `}</style>
      )}

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
        {/* "Rev" in signature Electric Indigo gradient (with animated liquid shimmer in header) */}
        <span
          className={animated ? 'rev-gradient-text' : ''}
          style={{
            background: animated
              ? 'linear-gradient(115deg, #4338CA 0%, #6366F1 25%, #A5B4FC 48%, #FFFFFF 52%, #A5B4FC 56%, #6366F1 75%, #4338CA 100%)'
              : 'linear-gradient(135deg, #4F46E5 0%, #6366F1 60%, #818CF8 100%)',
            backgroundSize: animated ? '260% 100%' : undefined,
            animation: animated ? 'revShimmerFlow 6.5s ease-in-out infinite' : undefined,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 800,
            transition: 'background-position 0.4s ease',
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

        {/* Luminous brand anchor dot (with radar opportunity ping in header) */}
        <span
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: dotSize,
            height: dotSize,
            marginLeft: '3px',
            marginBottom: '1px',
            flexShrink: 0,
          }}
        >
          {/* High-tech radar signal wave ring */}
          {animated && (
            <span
              style={{
                position: 'absolute',
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.75)',
                animation: 'revRadarPulse 2.8s cubic-bezier(0, 0, 0.2, 1) infinite',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Core anchor dot */}
          <span
            style={{
              display: 'inline-block',
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366F1, #818CF8)',
              boxShadow: animated
                ? '0 0 10px rgba(99, 102, 241, 0.8), 0 0 20px rgba(129, 140, 248, 0.4)'
                : '0 0 8px rgba(99, 102, 241, 0.6)',
              animation: animated ? 'revDotBreathe 2.8s ease-in-out infinite' : undefined,
              flexShrink: 0,
            }}
          />
        </span>
      </span>
    </div>
  );
}

/**
 * BrandLogo — Default export
 * Intelligent variant resolution: square dimension classes (w-*, h-*) resolve to 'mark' (monogram),
 * otherwise defaults to 'wordmark' for brand headers/titles.
 */
export default function BrandLogo({
  className = '',
  variant,
  theme = 'light',
  size = 'md',
  animated = false,
}: BrandLogoProps) {
  const isSquareBox = className && /\bw-\d+\b/.test(className);
  const resolvedVariant = variant || (isSquareBox ? 'mark' : 'wordmark');

  if (resolvedVariant === 'mark' || resolvedVariant === 'monochrome') {
    return <BrandMark className={className || 'w-6 h-6'} monochrome={resolvedVariant === 'monochrome'} />;
  }
  return <BrandWordmark className={className} theme={theme} size={size} animated={animated} />;
}
