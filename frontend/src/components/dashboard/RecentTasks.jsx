import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecentTasks({ tasks = [] }) {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#3C191E] text-[#F87171] border border-[#5C242B]">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#3B2B17] text-[#FBBF24] border border-[#5A4220]">
            Medium
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#142E23] text-[#4ADE80] border border-[#1B4332]">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#142E23] text-[#4ADE80] border border-[#1B4332]">
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#16273B] text-[#38BDF8] border border-[#1E3A5F]">
            In Progress
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#332514] text-[#FBBF24] border border-[#4D361B]">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl bg-[#14171A] border border-[#23272B] p-4 sm:p-5 flex flex-col justify-between">
      <div>
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#23272B]">
          <div>
            <h3 className="text-base font-semibold text-[#F5EFEB]">
              Recent / Priority Tasks
            </h3>
          </div>

          <button
            onClick={() => navigate('/tasks')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 border border-[#2B3036] hover:text-white hover:border-[#3E454E] hover:bg-[#1A1D22] transition-colors cursor-pointer"
          >
            View All
          </button>
        </div>

        {/* Tasks Table */}
        <div className="mt-1 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#23272B] text-slate-400 font-medium">
                <th scope="col" className="py-2.5 pr-2 font-medium">Task</th>
                <th scope="col" className="py-2.5 px-2 font-medium hidden sm:table-cell">Project</th>
                <th scope="col" className="py-2.5 px-2 font-medium">Assignee</th>
                <th scope="col" className="py-2.5 px-2 font-medium">Priority</th>
                <th scope="col" className="py-2.5 px-2 font-medium">Status</th>
                <th scope="col" className="py-2.5 pl-2 text-right font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D2024]">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    No deliverables found.
                  </td>
                </tr>
              ) : (
                tasks.slice(0, 5).map((task) => {
                  const assigneeName = task.assignedTo?.name
                    ? task.assignedTo.name.split(' ')[0]
                    : 'Unassigned';
                  const projectName = task.projectId?.name || 'Project';

                  return (
                    <tr
                      key={task._id}
                      onClick={() => navigate('/tasks')}
                      className="hover:bg-[#181B1F] transition-colors cursor-pointer group"
                    >
                      {/* Task Title */}
                      <td className="py-3 pr-2 font-medium text-[#EAE6E1] group-hover:text-white truncate max-w-[110px] sm:max-w-[130px]">
                        {task.title}
                      </td>

                      {/* Project Name */}
                      <td className="py-3 px-2 text-slate-400 whitespace-nowrap truncate max-w-[80px] hidden sm:table-cell">
                        {projectName}
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-2 text-slate-300 whitespace-nowrap">
                        {assigneeName}
                      </td>

                      {/* Priority Pill */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        {getPriorityBadge(task.priority)}
                      </td>

                      {/* Status Pill */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        {getStatusBadge(task.status)}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 pl-2 text-right text-[11px] text-slate-400 whitespace-nowrap">
                        {formatDate(task.dueDate)}
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
