import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProjectProgress({ projects = [] }) {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#142E23] text-[#4ADE80] border border-[#1B4332]">
          Completed
        </span>
      );
    }
    if (status === 'Active' || status === 'In Progress') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#142E23] text-[#4ADE80] border border-[#1B4332]">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#332514] text-[#FBBF24] border border-[#4D361B]">
        {status || 'Planning'}
      </span>
    );
  };

  return (
    <div className="rounded-xl bg-[#14171A] border border-[#23272B] p-4 sm:p-5 flex flex-col justify-between">
      <div>
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#23272B]">
          <div>
            <h3 className="text-base font-semibold text-[#F5EFEB]">
              Project Progress
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Track overall progress across all projects.
            </p>
          </div>

          <button
            onClick={() => navigate('/projects')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 border border-[#2B3036] hover:text-white hover:border-[#3E454E] hover:bg-[#1A1D22] transition-colors cursor-pointer"
          >
            View All
          </button>
        </div>

        {/* Project Table */}
        <div className="mt-1 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#23272B] text-slate-400 font-medium">
                <th scope="col" className="py-2.5 pr-1 font-medium">Project</th>
                <th scope="col" className="py-2.5 px-1.5 font-medium">Progress</th>
                <th scope="col" className="py-2.5 px-1.5 font-medium">Status</th>
                <th scope="col" className="py-2.5 px-1.5 font-medium hidden sm:table-cell">Start Date</th>
                <th scope="col" className="py-2.5 px-1.5 font-medium hidden md:table-cell">End Date</th>
                <th scope="col" className="py-2.5 pl-1.5 text-right font-medium">Members</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D2024]">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    No active projects found.
                  </td>
                </tr>
              ) : (
                projects.map((project) => {
                  const progress = project.progress !== undefined ? project.progress : 0;
                  const memberCount =
                    project.assignedEmployeesCount !== undefined
                      ? project.assignedEmployeesCount
                      : (project.assignedEmployees ? project.assignedEmployees.length : 0);

                  return (
                    <tr
                      key={project._id}
                      onClick={() => navigate('/projects')}
                      className="hover:bg-[#181B1F] transition-colors cursor-pointer group"
                    >
                      {/* Project Name */}
                      <td className="py-3 pr-1 font-medium text-[#EAE6E1] group-hover:text-white truncate max-w-[105px] sm:max-w-[125px]">
                        {project.name}
                      </td>

                      {/* Progress Bar + % */}
                      <td className="py-3 px-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 sm:w-12 h-1.5 bg-[#23272B] rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(progress, 100)}%` }}
                              className="h-full rounded-full bg-[#E8DFD8] transition-all duration-300"
                            />
                          </div>
                          <span className="text-[11px] text-slate-300 font-medium w-6">
                            {progress}%
                          </span>
                        </div>
                      </td>

                      {/* Status Pill */}
                      <td className="py-3 px-1.5 whitespace-nowrap">
                        {getStatusBadge(project.status)}
                      </td>

                      {/* Start Date */}
                      <td className="py-3 px-1.5 text-[11px] text-slate-400 whitespace-nowrap hidden sm:table-cell">
                        {formatDate(project.startDate)}
                      </td>

                      {/* End Date */}
                      <td className="py-3 px-1.5 text-[11px] text-slate-400 whitespace-nowrap hidden md:table-cell">
                        {formatDate(project.endDate)}
                      </td>

                      {/* Member Avatars */}
                      <td className="py-3 pl-1.5 whitespace-nowrap text-right">
                        {memberCount === 0 ? (
                          <span className="text-[11px] text-slate-500 font-medium">0</span>
                        ) : (
                          <div className="flex items-center justify-end -space-x-1.5">
                            {Array.isArray(project.assignedEmployees) &&
                              project.assignedEmployees.slice(0, 2).map((emp, i) => (
                                <div
                                  key={emp._id || i}
                                  title={emp.name || 'Member'}
                                  className={`w-5 h-5 rounded-full border border-[#14171A] text-[9px] font-bold flex items-center justify-center ${
                                    i === 0
                                      ? 'bg-[#2A3037] text-slate-200'
                                      : 'bg-[#3D352E] text-[#E8DFD8]'
                                  }`}
                                >
                                  {(emp.name || 'M').charAt(0).toUpperCase()}
                                </div>
                              ))}
                            {memberCount > 2 && (
                              <div className="w-5 h-5 rounded-full bg-[#1F2328] border border-[#14171A] text-[8px] font-medium text-slate-400 flex items-center justify-center">
                                +{memberCount - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
