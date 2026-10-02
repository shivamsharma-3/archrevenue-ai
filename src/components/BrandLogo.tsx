import React from 'react';

interface BrandLogoProps {
  className?: string;
  /** If true, renders the full mark on a dark rounded background (nav/favicon style).
   *  If false (default), renders just the mark using currentColor for flexible theming. */
  withBackground?: boolean;
}

export default function BrandLogo({ className, withBackground = false }: BrandLogoProps) {
  if (withBackground) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="22" fill="#0F172A"/>
        <circle cx="50" cy="52" r="34" stroke="#6366F1" strokeWidth="2.5" opacity="0.35"/>
        <circle cx="50" cy="52" r="22" stroke="#6366F1" strokeWidth="2.5" opacity="0.55"/>
        <circle cx="50" cy="52" r="10" stroke="#6366F1" strokeWidth="2.5" opacity="0.85"/>
        <circle cx="50" cy="52" r="3.5" fill="#6366F1"/>
        <line x1="50" y1="52" x2="72" y2="22" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round"/>
        <polygon points="72,22 63,26 68,34" fill="#6366F1"/>
        <line x1="50" y1="40" x2="50" y2="44" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
        <line x1="50" y1="60" x2="50" y2="64" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
        <line x1="38" y1="52" x2="42" y2="52" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
        <line x1="58" y1="52" x2="62" y2="52" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      </svg>
    );
  }

  // Flat mark — uses indigo fixed colors, scales with className size
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="52" r="34" stroke="#6366F1" strokeWidth="3" opacity="0.3"/>
      <circle cx="50" cy="52" r="22" stroke="#6366F1" strokeWidth="3" opacity="0.55"/>
      <circle cx="50" cy="52" r="10" stroke="#6366F1" strokeWidth="3" opacity="0.85"/>
      <circle cx="50" cy="52" r="3.5" fill="#6366F1"/>
      <line x1="50" y1="52" x2="72" y2="22" stroke="#6366F1" strokeWidth="3" strokeLinecap="round"/>
      <polygon points="72,22 63,26 68,34" fill="#6366F1"/>
      <line x1="50" y1="40" x2="50" y2="44" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <line x1="50" y1="60" x2="50" y2="64" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <line x1="38" y1="52" x2="42" y2="52" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <line x1="58" y1="52" x2="62" y2="52" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}
