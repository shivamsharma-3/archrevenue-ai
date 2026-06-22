import React from 'react';

/**
 * AuroraBackground
 * ─────────────────
 * A purely visual, fixed-position layer that sits behind all content.
 * Inspired by: Bloomberg Terminal + Linear + Stripe + Attio
 *
 * Layers (bottom → top):
 *  1. Deep black base (#000)
 *  2. Three animated aurora gradient blobs (indigo / violet / cyan)
 *  3. SVG data-grid at 6% opacity
 *  4. Ghost metric labels at 4-5% opacity — subliminally reinforces "revenue system"
 *  5. Vignette overlay to darken edges
 */
export default function AuroraBackground() {
  return (
    <div className="aurora-root" aria-hidden="true">
      {/* ── Aurora blobs ─────────────────────────────────── */}
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />

      {/* ── Data-grid SVG overlay ────────────────────────── */}
      <svg
        className="data-grid-svg"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="0.5" />
          </pattern>
          {/* Subtle dot accent at intersections */}
          <pattern id="dots" width="48" height="48" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="1" fill="rgba(255,255,255,0.04)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* ── Vignette ─────────────────────────────────────── */}
      <div className="aurora-vignette" />
    </div>
  );
}
