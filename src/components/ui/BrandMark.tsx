import React from 'react';

export const APP_NAME = 'G.K. BTU Students';

/** Monogram in BTU magenta: rounded tile, "GK" letterforms and a small spark. */
export const BrandMark: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = '' }) => (
  <div
    className={`relative shrink-0 rounded-[30%] grid place-items-center ring-1 ring-white/15 shadow-[0_10px_30px_-8px_rgba(226,0,116,0.7)] ${className}`}
    style={{
      width: size,
      height: size,
      background: 'linear-gradient(140deg, #ff4fa8 0%, #e20074 45%, #8f1fbd 100%)',
    }}
    aria-hidden
  >
    <span
      className="absolute inset-0 rounded-[30%]"
      style={{ background: 'radial-gradient(120% 80% at 20% 0%, rgba(255,255,255,.35), transparent 55%)' }}
    />
    <svg viewBox="0 0 32 32" width={size * 0.62} height={size * 0.62} className="relative">
      <path
        d="M14.5 9.2A7 7 0 1 0 15 22.6h-.1V16.8h-4"
        fill="none"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 9.5v13M19 16.4l5.6-6.9M20.6 14.5l4.4 8" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="27" cy="5.5" r="1.7" fill="#fff" />
    </svg>
  </div>
);
