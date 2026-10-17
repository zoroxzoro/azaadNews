import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import eagleLogo from '../../assets/logos/logo.png';

/**
 * BrandLogo component for Azaad Samachar
 * Integrates the official flying eagle emblem with the approved Mukta & Inter Devanagari typography.
 * Supports:
 * - variant: 'full' (masthead logo with tagline), 'compact' (header logo), 'symbol' (standalone eagle mark)
 * - theme: 'light' | 'dark' | 'auto' (defaults to 'auto' via useTheme())
 */
export default function BrandLogo({
  variant = 'full',
  theme = 'auto',
  className = '',
  to = '/',
}) {
  const { isDark: globalIsDark } = useTheme();
  const isDark = theme === 'auto' ? globalIsDark : theme === 'dark';

  // Symbol only variant
  if (variant === 'symbol') {
    const symbolContent = (
      <div
        className={`relative shrink-0 flex items-center justify-center transition-transform hover:scale-105 duration-300 w-10 h-10 sm:w-12 sm:h-12 ${className}`}
      >
        <img
          src={eagleLogo}
          alt="आज़ाद समाचार ईगल प्रतीक (Azaad Samachar Eagle)"
          className={`w-full h-full object-contain ${isDark
            ? 'filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.18)]'
            : 'filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]'
            }`}
          loading="eager"
        />
      </div>
    );
    return to ? (
      <Link to={to} className="inline-block hover:opacity-95 transition-opacity">
        {symbolContent}
      </Link>
    ) : (
      symbolContent
    );
  }

  const isFull = variant === 'full';

  const LogoContent = (
    <div className={`inline-flex flex-col select-none ${className}`}>
      {/* Brand Mark Lockup: Azaad directly next to Eagle with zero gap, Samachar on bottom of eagle */}
      <div className="inline-flex gap-2 items-center">
        {/* 'आज़ाद' on the LEFT side of the eagle */}
        <span
          className={`font-mukta font-black leading-none tracking-tight shrink-0 ${isFull
            ? 'text-xl sm:text-2xl md:text-2xl'
            : 'text-base sm:text-lg'
            } ${isDark ? 'text-[#FF3B56]' : 'text-[#C8102E]'}`}
        >
          आज़ाद
        </span>

        {/* Eagle Emblem directly adjacent to 'आज़ाद' with NO GAP (tucked closely) */}
        <div
          className={`relative shrink-0 flex items-center justify-center transition-transform hover:scale-105 duration-300 -ml-1 sm:-ml-1.5 ${isFull
            ? 'w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13'
            : 'w-7 h-7 sm:w-8 sm:h-8'
            }`}
        >
          <img
            src={eagleLogo}
            alt="आज़ाद समाचार ईगल प्रतीक (Azaad Samachar Eagle)"
            className={`w-full h-full object-contain ${isDark
              ? 'filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.18)]'
              : 'filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]'
              }`}
            loading="eager"
          />
        </div>
      </div>

      {/* 'समाचार' on the BOTTOM of that eagle - Blue color, positioned right under the eagle */}
      <div className="flex justify-end -mt-1 sm:-mt-1.5 pr-0.5">
        <span
          className={`font-mukta font-black tracking-tight leading-none ${isFull
            ? 'text-xl sm:text-2xl md:text-2xl'
            : 'text-base sm:text-lg'
            } ${isDark ? 'text-blue-400' : 'text-blue-700'}`}
        >
          समाचार
        </span>
      </div>

      {/* Full Tagline & Authority Rule (for masthead / full branding) */}
      {isFull && (
        <div className="hidden xs:flex items-center gap-1.5 mt-1 sm:mt-1.5 font-inter">
          <span className="w-2.5 sm:w-3 h-[2px] bg-[#C8102E]"></span>
          <span
            className={`font-mukta text-[11px] sm:text-xs font-semibold tracking-wider ${isDark ? 'text-slate-300' : 'text-[#10264B]/80'
              }`}
          >
            सच्ची खबर पक्की खबर
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold tracking-widest font-mono ml-auto text-[#D9B56D]">
            ESTD. 1947
          </span>
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block hover:opacity-95 transition-opacity">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}
