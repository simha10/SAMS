import React, { useEffect } from 'react';

const Maintenance: React.FC = () => {
  useEffect(() => {
    // Set a distinctive title when in maintenance mode
    document.title = 'System Maintenance';
    
    // Prevent any background API calls or user interactions
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Hexagonal pattern background */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexagons" x="0" y="0" width="100" height="87" patternUnits="userSpaceOnUse">
              <path d="M50 0 L93.3 25 L93.3 62 L50 87 L6.7 62 L6.7 25 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-cyan-500"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)"/>
        </svg>
      </div>

      {/* Main content */}
      <div className="max-w-4xl w-full text-center relative z-10 px-2 sm:px-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8 md:mb-10">
          <div className="relative">
            <svg width="30" height="30" viewBox="0 0 60 60" className="text-orange-500 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-[60px] lg:h-[60px]">
              <circle cx="30" cy="30" r="28" fill="currentColor"/>
              <path d="M30 15 L35 25 L30 30 L25 25 Z M30 30 L35 35 L30 45 L25 35 Z" fill="#1e3a5f" stroke="#1e3a5f" strokeWidth="2"/>
              <circle cx="30" cy="30" r="4" fill="#1e3a5f"/>
            </svg>
            {/* Gear teeth */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1.5 sm:w-2 sm:h-3 bg-orange-500"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-20px)`,
                }}
              />
            ))}
          </div>
          <div className="text-left">
            <div className="text-white font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-wide">LRM</div>
            <div className="text-gray-300 text-[0.6rem] sm:text-xs md:text-sm tracking-widest uppercase">Consultants</div>
          </div>
        </div>

        {/* Main illustration */}
        <div className="flex justify-center mb-6 sm:mb-8 md:mb-10 relative mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          <div className="relative w-full">
            {/* Background gears */}
            <svg width="100%" height="auto" viewBox="0 0 400 300" className="relative" preserveAspectRatio="xMidYMid meet">
              {/* Left gear - dark */}
              <g transform="translate(120, 150)">
                <circle cx="0" cy="0" r="50" fill="#2d3e50" opacity="0.6"/>
                {[...Array(12)].map((_, i) => (
                  <rect
                    key={`left-${i}`}
                    x="-5"
                    y="-55"
                    width="10"
                    height="10"
                    fill="#2d3e50"
                    opacity="0.6"
                    transform={`rotate(${i * 30})`}
                  />
                ))}
              </g>

              {/* Right gear - dark */}
              <g transform="translate(280, 150)">
                <circle cx="0" cy="0" r="50" fill="#2d3e50" opacity="0.6"/>
                {[...Array(12)].map((_, i) => (
                  <rect
                    key={`right-${i}`}
                    x="-5"
                    y="-55"
                    width="10"
                    height="10"
                    fill="#2d3e50"
                    opacity="0.6"
                    transform={`rotate(${i * 30})`}
                  />
                ))}
              </g>

              {/* Center large gear - orange */}
              <g transform="translate(200, 150)">
                <circle cx="0" cy="0" r="70" fill="#f97316" opacity="0.9"/>
                {[...Array(16)].map((_, i) => (
                  <rect
                    key={`center-${i}`}
                    x="-7"
                    y="-75"
                    width="14"
                    height="14"
                    fill="#f97316"
                    opacity="0.9"
                    transform={`rotate(${i * 22.5})`}
                  />
                ))}
                
                {/* Clock face */}
                <circle cx="0" cy="-20" r="35" fill="#1e3a5f"/>
                
                {/* Clock markers */}
                {[...Array(12)].map((_, i) => (
                  <circle
                    key={`marker-${i}`}
                    cx={Math.sin((i * 30 * Math.PI) / 180) * 25}
                    cy={-20 - Math.cos((i * 30 * Math.PI) / 180) * 25}
                    r="1.5"
                    fill="#f97316"
                  />
                ))}
                
                {/* Clock hands */}
                <line x1="0" y1="-20" x2="0" y2="-35" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
                <line x1="0" y1="-20" x2="12" y2="-15" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
              </g>

              {/* Wrench - top right */}
              <g transform="translate(260, 90)">
                <path d="M0 0 L20 20 M20 20 L25 15 L30 20 L25 25 L20 20 Z" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="20" cy="20" r="6" fill="none" stroke="#f97316" strokeWidth="4"/>
              </g>

              {/* Wrench - bottom right */}
              <g transform="translate(290, 190)">
                <path d="M0 0 L15 15 M15 15 L20 10 L25 15 L20 20 L15 15 Z" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="15" cy="15" r="6" fill="none" stroke="#f97316" strokeWidth="4"/>
              </g>

              {/* Progress bar with glow */}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <g transform="translate(200, 190)" filter="url(#glow)">
                <rect x="-120" y="-10" width="240" height="20" rx="10" fill="#1e3a5f" stroke="#f97316" strokeWidth="1.5"/>
                <rect x="-118" y="-8" width="160" height="16" rx="8" fill="url(#progressGradient)"/>
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fb923c"/>
                    <stop offset="100%" stopColor="#f97316"/>
                  </linearGradient>
                </defs>
              </g>
            </svg>
          </div>
        </div>

        {/* Text content */}
        <div className="mb-6 sm:mb-8 px-2 sm:px-4">
          <h1 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
            Under Maintenance
          </h1>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg mt-3 sm:mt-4">
            We're currently performing scheduled maintenance to improve your experience.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 sm:p-5 mt-5 sm:mt-6 md:mt-8 max-w-md mx-auto">
            <p className="text-base sm:text-lg text-gray-200">
              Please mark your attendance manually with your manager.
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button 
          onClick={handleRefresh}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2.5 sm:py-3 md:py-3.5 px-5 sm:px-6 md:px-8 rounded-lg text-sm sm:text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 mb-5 sm:mb-6 md:mb-8 mx-auto"
        >
          REFRESH PAGE
        </button>

        {/* Footer */}
        <p className="text-gray-400 text-xs">
          © {new Date().getFullYear()} SAMS. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Maintenance;