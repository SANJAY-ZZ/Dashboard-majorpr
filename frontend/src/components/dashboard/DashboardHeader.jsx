import React from 'react';

export default function DashboardHeader({ user }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  const displayName = user?.name || 'Sanjay Kumar';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#101316] border border-[#23272B] p-6 sm:p-8">
      {/* Editorial Silk Wave Decorative Graphic (Upper Right) */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none overflow-hidden select-none hidden sm:block">
        <svg
          viewBox="0 0 600 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute right-0 top-0 h-full w-full object-cover opacity-35"
        >
          <path
            d="M150 0C250 80 400 30 550 120C650 180 600 240 600 240H0V0H150Z"
            fill="url(#champagne-wave-1)"
          />
          <path
            d="M300 0C400 100 480 80 600 180V0H300Z"
            fill="url(#champagne-wave-2)"
          />
          <defs>
            <linearGradient id="champagne-wave-1" x1="600" y1="0" x2="200" y2="240" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D8CEBE" stopOpacity="0.4" />
              <stop offset="0.5" stopColor="#B4A48E" stopOpacity="0.15" />
              <stop offset="1" stopColor="#101316" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="champagne-wave-2" x1="600" y1="0" x2="350" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E8DFD8" stopOpacity="0.25" />
              <stop offset="1" stopColor="#101316" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-xl">
        <p className="font-serif italic text-slate-400 text-sm sm:text-base mb-1">
          {getGreeting()}
        </p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-[#F4EFEA] tracking-tight">
          {displayName}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 font-normal">
          Here's what's happening across your workspace.
        </p>
      </div>
    </div>
  );
}
