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

  // Sizing for the Eagle emblem
  const eagleSizes = {
    symbol: 'w-10 h-10 sm:w-12 sm:h-12',
    compact: 'w-9 h-9 sm:w-11 sm:h-11',
    full: 'w-10 h-10 sm:w-13 sm:h-13 md:w-14 md:h-14',
  };

  const LogoContent = (
    <div className={`inline-flex items-center gap-2 sm:gap-3 select-none ${className}`}>
      {/* Official Azaad Eagle Emblem */}
      <div
        className={`relative shrink-0 flex items-center justify-center transition-transform hover:scale-105 duration-300 ${
          eagleSizes[variant] || eagleSizes.full
        }`}
      >
        <img
          src={eagleLogo}
          alt="आज़ाद समाचार ईगल प्रतीक (Azaad Samachar Eagle)"
          className={`w-full h-full object-contain ${
            isDark
              ? 'filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.18)]'
              : 'filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]'
          }`}
          loading="eager"
        />
      </div>

      {/* Brand Typography (Preserved exactly as requested) */}
      {variant !== 'symbol' && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline gap-1 sm:gap-1.5 font-mukta flex-wrap">
            <span
              className={`text-2xl sm:text-3xl md:text-3xl font-black tracking-tight ${
                isDark ? 'text-[#FF3B56]' : 'text-[#C8102E]'
              }`}
            >
              आज़ाद
            </span>
            <span
              className={`text-2xl sm:text-3xl md:text-3xl font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-[#10264B]'
              }`}
            >
              समाचार
            </span>
            <span
              className={`hidden sm:inline-block font-inter text-[10px] md:text-[11px] font-bold tracking-widest uppercase border-l pl-1.5 ml-1 ${
                isDark ? 'border-white/30 text-slate-300' : 'border-[#10264B]/30 text-[#10264B]/70'
              }`}
            >
              Azaad Samachar
            </span>
          </div>

          {/* Full Tagline & Authority Rule */}
          {variant === 'full' && (
            <div className="hidden xs:flex items-center gap-1.5 mt-0.5 sm:mt-1 font-inter">
              <span className="w-2.5 sm:w-3 h-[2px] bg-[#C8102E]"></span>
              <span
                className={`font-mukta text-[11px] sm:text-xs font-semibold tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-[#10264B]/80'
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
