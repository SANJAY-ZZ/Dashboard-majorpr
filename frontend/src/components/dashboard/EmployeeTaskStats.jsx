import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmployeeTaskStats({ employeeStats = [] }) {
  const navigate = useNavigate();
  const [selectedDept, setSelectedDept] = useState('All');
  const [sortBy, setSortBy] = useState('workload'); // 'workload' or 'completion'

  // Extract unique departments
  const departments = ['All', ...new Set(employeeStats.map((e) => e.department).filter(Boolean))];

  // Filter & Sort
  const filtered = employeeStats.filter(
    (e) => selectedDept === 'All' || e.department === selectedDept
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'completion') {
      return (b.completionRate || 0) - (a.completionRate || 0);
    }
    return (b.totalTasks || 0) - (a.totalTasks || 0);
  });

  return (
    <div className="rounded-xl bg-[#14171A] border border-[#23272B] p-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#23272B]">
        <div>
          <h3 className="text-base font-semibold text-[#F5EFEB]">
            Team Workload
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Capacity and task completion performance across workspace members.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#181B1F] border border-[#282D33] text-xs text-slate-300 focus:outline-none focus:border-[#3E454E] cursor-pointer"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'All Departments' : dept}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#181B1F] border border-[#282D33] text-xs text-slate-300 focus:outline-none focus:border-[#3E454E] cursor-pointer"
          >
            <option value="workload">Sort by Workload</option>
            <option value="completion">Sort by Completion</option>
          </select>
        </div>
      </div>

      {/* Employee Workload Rows */}
      <div className="mt-2 divide-y divide-[#1D2024]">
        {sorted.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No team members found for this filter.
          </div>
        ) : (
          sorted.map((emp) => {
            const total = emp.totalTasks || 0;
            const completionRate = emp.completionRate || 0;

            return (
              <div
                key={emp.employeeId}
                onClick={() => navigate('/employees')}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#181B1F] px-2 -mx-2 rounded-lg transition-colors cursor-pointer group"
              >
                {/* Employee Info */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="w-7 h-7 rounded-full bg-[#2A3037] border border-[#343B44] text-xs font-semibold text-[#EAE6E1] flex items-center justify-center shrink-0">
                    {emp.name ? emp.name.charAt(0) : 'E'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#EAE6E1] group-hover:text-white truncate">
                      {emp.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {emp.role} {emp.department && `· ${emp.department}`}
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Workload Figures */}
                <div className="flex items-center gap-4 flex-1 max-w-md sm:ml-auto">
                  <div className="flex-1 h-1.5 bg-[#23272B] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(completionRate, 100)}%` }}
                      className="h-full rounded-full bg-[#E8DFD8] transition-all duration-300"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 text-xs w-28 shrink-0">
                    <span className="text-slate-400 whitespace-nowrap">
                      {total} {total === 1 ? 'task' : 'tasks'}
                    </span>
                    <span className="font-semibold text-slate-200 w-9 text-right">
                      {completionRate}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
