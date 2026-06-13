import React from 'react';

export default function BrandLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 50 15 L 20 85 L 38 85 L 50 55 L 62 85 L 80 85 Z" fill="currentColor" />
      <path d="M 38 70 L 62 70" stroke="currentColor" strokeWidth="12" strokeLinecap="square" />
    </svg>
  );
}
