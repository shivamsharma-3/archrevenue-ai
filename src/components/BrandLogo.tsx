import React from 'react';

export default function BrandLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 50 10 L 15 90 L 35 90 L 50 50 L 65 90 L 85 90 Z" fill="currentColor" />
    </svg>
  );
}
