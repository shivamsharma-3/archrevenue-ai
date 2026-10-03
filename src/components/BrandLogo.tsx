import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

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

const REV_LETTERS = ['R', 'e', 'v'];
const SCOUT_LETTERS = ['S', 'c', 'o', 'u', 't'];

/**
 * BrandWordmark — Billion-Dollar Typographic Logotype
 * When animated={true} (header only), activates:
 *  1. Interactive kinetic letter-by-letter spring physics wave
 *  2. Specular chromatic liquid shimmer through "Rev"
 *  3. Dual-harmonic quantum radar beacon pulse on the accent dot
 *  4. Precision intelligence scanner laser baseline
 *  5. Volumetric ambient depth aura & 3D micro-tilt parallax
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
  const dotSize = size === 'sm' ? 5 : size === 'lg' ? 7 : 6;
  const primaryColor = theme === 'dark' ? '#F8FAFC' : '#090D16';

  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 3D Magnetic Micro-Tilt Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 350 };
  const rotateX = useSpring(useTransform(mouseY, [-20, 20], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-60, 60], [-7, 7]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!animated || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  if (!animated) {
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
          <span style={{ fontWeight: 800, color: primaryColor, marginLeft: '-0.02em' }}>
            Scout
          </span>
          <span
            style={{
              display: 'inline-block',
              width: `${dotSize}px`,
              height: `${dotSize}px`,
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

  // Top-Level Animated Header Wordmark
  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 800,
      }}
      className={`relative inline-flex items-center select-none cursor-pointer py-1 px-1.5 rounded-lg ${className}`}
    >
      {/* 1. Volumetric Ambient Aurora Halo */}
      <motion.div
        aria-hidden="true"
        animate={{
          opacity: isHovered ? 0.65 : 0.22,
          scale: isHovered ? 1.25 : 1,
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          inset: '-6px -12px',
          background: 'radial-gradient(ellipse at 35% 50%, rgba(99, 102, 241, 0.45) 0%, rgba(139, 92, 246, 0.25) 45%, transparent 75%)',
          filter: 'blur(16px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* 2. Main Wordmark Typography Container */}
      <motion.div
        animate={{
          y: isHovered ? -1.5 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        style={{
          position: 'relative',
          zIndex: 1,
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
          {/* "Rev" — Staggered Elastic Kinetic Wave with Liquid Chromatic Shimmer */}
          <span className="inline-flex items-baseline overflow-visible">
            {REV_LETTERS.map((char, index) => (
              <motion.span
                key={`rev-${index}`}
                animate={
                  isHovered
                    ? {
                        y: [0, -3.5, 0],
                        scale: [1, 1.06, 1],
                      }
                    : { y: 0, scale: 1 }
                }
                transition={{
                  duration: 0.42,
                  delay: index * 0.035,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-block rev-shimmer-letter"
                style={{
                  background: 'linear-gradient(115deg, #4338CA 0%, #6366F1 25%, #A5B4FC 48%, #FFFFFF 52%, #A5B4FC 56%, #6366F1 75%, #4338CA 100%)',
                  backgroundSize: '240% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 800,
                  transformOrigin: 'bottom center',
                  animation: `revLetterShimmer 6s ease-in-out infinite`,
                  animationDelay: `${index * 0.12}s`,
                }}
              >
                {char}
              </motion.span>
            ))}
          </span>

          {/* "Scout" — Staggered Kinetic Wave in Executive Slate */}
          <span className="inline-flex items-baseline overflow-visible" style={{ marginLeft: '-0.02em' }}>
            {SCOUT_LETTERS.map((char, index) => (
              <motion.span
                key={`scout-${index}`}
                animate={
                  isHovered
                    ? {
                        y: [0, -3.5, 0],
                        scale: [1, 1.05, 1],
                        color: theme === 'dark' ? '#FFFFFF' : '#020617',
                      }
                    : { y: 0, scale: 1, color: primaryColor }
                }
                transition={{
                  duration: 0.42,
                  delay: (REV_LETTERS.length + index) * 0.035,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-block"
                style={{
                  fontWeight: 800,
                  transformOrigin: 'bottom center',
                }}
              >
                {char}
              </motion.span>
            ))}
          </span>

          {/* 3. Living Quantum Radar Beacon (The Brand Accent Dot) */}
          <span
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              marginLeft: '3.5px',
              marginBottom: '1px',
              flexShrink: 0,
            }}
          >
            {/* Harmonic Sonar Wave 1 (Tight & Fast) */}
            <motion.span
              animate={{
                scale: [1, 2.6],
                opacity: [0.9, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                width: `${dotSize}px`,
                height: `${dotSize}px`,
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.8)',
                pointerEvents: 'none',
              }}
            />

            {/* Harmonic Sonar Wave 2 (Expansive & Soft) */}
            <motion.span
              animate={{
                scale: [1, 3.8],
                opacity: [0.55, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: 0.75,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                width: `${dotSize}px`,
                height: `${dotSize}px`,
                borderRadius: '50%',
                background: 'rgba(129, 140, 248, 0.65)',
                pointerEvents: 'none',
              }}
            />

            {/* Quantum Core */}
            <motion.span
              animate={{
                scale: isHovered ? 1.35 : [1, 1.15, 1],
                boxShadow: isHovered
                  ? '0 0 16px rgba(99, 102, 241, 1), 0 0 28px rgba(129, 140, 248, 0.8)'
                  : '0 0 8px rgba(99, 102, 241, 0.75), 0 0 16px rgba(129, 140, 248, 0.4)',
              }}
              transition={{
                scale: isHovered ? { duration: 0.25 } : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
                boxShadow: isHovered ? { duration: 0.25 } : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
              }}
              style={{
                display: 'inline-block',
                width: `${dotSize}px`,
                height: `${dotSize}px`,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 50%, #C7D2FE 100%)',
                flexShrink: 0,
                zIndex: 2,
              }}
            />
          </span>
        </span>

        {/* 4. Autonomous Intelligence Scanner Laser Line */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '0px',
            right: '0px',
            height: '1.5px',
            overflow: 'hidden',
            pointerEvents: 'none',
            opacity: isHovered ? 0.9 : 0.4,
            transition: 'opacity 0.3s ease',
          }}
        >
          {/* Subtle baseline track */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.15) 20%, rgba(99, 102, 241, 0.15) 80%, transparent 100%)',
            }}
          />
          {/* Travelling scanning beam */}
          <motion.div
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: isHovered ? 1.6 : 3.8,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatDelay: 0.6,
            }}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '45%',
              background: 'linear-gradient(90deg, transparent 0%, #6366F1 40%, #818CF8 80%, #FFFFFF 100%)',
              boxShadow: '0 0 6px #6366F1, 0 0 12px #818CF8',
            }}
          />
        </div>
      </motion.div>

      {/* Scoped CSS Keyframes for Metallic Liquid Shimmer */}
      <style>{`
        @keyframes revLetterShimmer {
          0% {
            background-position: 0% 50%;
          }
          30% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </motion.div>
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
