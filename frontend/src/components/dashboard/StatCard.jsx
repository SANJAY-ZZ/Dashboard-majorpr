import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isAccent = false,
  route,
  className = '',
}) {
  const navigate = useNavigate();
  const [displayValue, setDisplayValue] = useState(0);

  // Smooth number counter
  useEffect(() => {
    if (value === undefined || value === null) return;
    const target = Number(value);
    if (isNaN(target)) {
      setDisplayValue(0);
      return;
    }

    if (target === 0) {
      setDisplayValue(0);
      return;
    }

    let start = 0;
    const duration = 400; // ms
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setDisplayValue(target);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.ceil(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  if (isAccent) {
    return (
      <div
        onClick={() => route && navigate(route)}
        className={`rounded-xl bg-[#E8DFD8] border border-[#DDD3CB] p-4 sm:p-5 flex flex-col justify-between transition-all duration-150 ${
          route ? 'cursor-pointer hover:bg-[#E2D8D0]' : ''
        } ${className}`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-[#4A443E] tracking-tight">
            {title}
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#DDD3CB]/60 border border-[#CBC0B6] flex items-center justify-center text-[#2C2621] shrink-0">
            {Icon && <Icon className="w-4 h-4" />}
          </div>
        </div>

        <div className="my-2">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#161310]">
            {displayValue}
          </span>
        </div>

        <div>
          <span className="text-xs font-normal text-[#5C554D]">
            {description}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => route && navigate(route)}
      className={`rounded-xl bg-[#14171A] border border-[#23272B] p-4 sm:p-5 flex flex-col justify-between transition-all duration-150 ${
        route ? 'cursor-pointer hover:border-[#32373E]' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-400 tracking-tight">
          {title}
        </span>
        <div className="w-8 h-8 rounded-lg bg-[#1A1D22] border border-[#262A2E] flex items-center justify-center text-slate-300 shrink-0">
          {Icon && <Icon className="w-4 h-4" />}
        </div>
      </div>

      <div className="my-2">
        <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5EFEB]">
          {displayValue}
        </span>
      </div>

      <div>
        <span className="text-xs font-normal text-slate-400">
          {description}
        </span>
      </div>
    </div>
  );
}
