import React from 'react';

export default function DashboardSkeletons() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-28 rounded-2xl bg-[#14171A] border border-[#23272B] animate-shimmer" />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-28 rounded-xl bg-[#14171A] border border-[#23272B] animate-shimmer ${
              i === 4 ? 'col-span-2 lg:col-span-1' : ''
            }`}
          />
        ))}
      </div>

      {/* 2-Column: Project Progress + Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-80 rounded-xl bg-[#14171A] border border-[#23272B] animate-shimmer" />
        <div className="h-80 rounded-xl bg-[#14171A] border border-[#23272B] animate-shimmer" />
      </div>

      {/* Team Workload */}
      <div className="h-64 rounded-xl bg-[#14171A] border border-[#23272B] animate-shimmer" />
    </div>
  );
}
