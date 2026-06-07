import React from 'react';

interface SadafLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
  withMarbleBackground?: boolean;
}

export default function SadafLogo({
  className = '',
  size = 48,
  showText = true,
  textClassName = 'font-serif text-lg tracking-[0.2em]',
  withMarbleBackground = false
}: SadafLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        style={{ width: size, height: size }} 
        className={`relative flex items-center justify-center shrink-0 rounded-lg overflow-hidden ${
          withMarbleBackground 
            ? 'bg-gradient-to-tr from-[#060B24] via-[#1B2A6B] to-[#2B3E8C] border border-[#C9A84C]/30 shadow-lg shadow-black/40' 
            : ''
        }`}
      >
        {/* Subtle marble vein background effects if requested */}
        {withMarbleBackground && (
          <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <filter id="marble-noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" stitchTiles="stitch" />
                <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.4 0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#marble-noise)" />
            </svg>
          </div>
        )}

        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 p-1"
        >
          {/* Gilded Calligraphy Accent (Golden stroke on right) */}
          <path
            d="M 64,50 C 72,55 74,75 62,88 C 65,83 66,73 60,60 C 58,54 61,51 64,50 Z"
            fill="url(#goldGradient)"
            opacity="0.95"
          />

          {/* Core White Monogram Seen/S shape */}
          <path
            d="M 50,10 
               C 58,10 59,25 45,35 
               C 35,42 25,50 35,70 
               C 42,85 58,85 64,75 
               C 58,80 44,80 38,72 
               C 32,62 38,55 46,48 
               C 56,38 65,30 54,16 
               C 52,14 51,12 50,10 Z"
            fill="#FFFFFF"
            className="drop-shadow-[0_2px_4px_rgba(10,15,44,0.3)]"
          />

          {/* Premium Calligraphic Pearl Monogram Loop detail inside */}
          <circle
            cx="48"
            cy="15"
            r="3"
            fill="#FFFFFF"
          />

          {/* Golden Nuqta / Calligraphy Diamond Accent Dot inside the upper hook */}
          <path
            d="M 45,23 L 50,18 L 55,23 L 50,28 Z"
            fill="url(#goldGradient)"
          />

          {/* Gradients definitions */}
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F0D080" />
              <stop offset="50%" stopColor="#C9A84C" />
              <stop offset="100%" stopColor="#A48431" />
            </linearGradient>
            <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4FC3F7" />
              <stop offset="100%" stopColor="#1B2A6B" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col select-none">
          <span className={`text-white font-serif uppercase tracking-[0.25em] ${textClassName}`}>
            SADAF
          </span>
          <span className="text-[9px] text-[#C9A84C] tracking-[0.45em] uppercase font-sans font-medium -mt-0.5 whitespace-nowrap">
            ART & FASHION HOUSE
          </span>
        </div>
      )}
    </div>
  );
}
