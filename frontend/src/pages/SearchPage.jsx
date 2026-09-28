import React, { useState, useEffect } from 'react';
import { Search, CheckSquare, FolderGit2, Users, X } from 'lucide-react';
import api from '../services/api';

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks', 'projects', 'employees'
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksRes, projRes, empRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/projects'),
          api.get('/employees'),
        ]);
        if (tasksRes.success) setTasks(tasksRes.data);
        if (projRes.success) setProjects(projRes.data);
        if (empRes.success) setEmployees(empRes.data);
      } catch (err) {
        console.error('Search fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleClearFilters = () => {
    setQuery('');
    setStatus('');
    setPriority('');
    setDepartment('');
  };

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesQuery =
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(query.toLowerCase()));
    const matchesStatus = status === '' || t.status === status;
    const matchesPriority = priority === '' || t.priority === priority;
    const matchesDept = department === '' || (t.assignedTo && t.assignedTo.department === department);
    return matchesQuery && matchesStatus && matchesPriority && matchesDept;
  });

  // Filtered Projects
  const filteredProjects = projects.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(query.toLowerCase()));
    const matchesStatus = status === '' || p.status === status;
    return matchesQuery && matchesStatus;
  });

  // Filtered Employees
  const filteredEmployees = employees.filter((e) => {
    const matchesQuery =
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.email.toLowerCase().includes(query.toLowerCase()) ||
      e.role.toLowerCase().includes(query.toLowerCase());
    const matchesDept = department === '' || e.department === department;
    return matchesQuery && matchesDept;
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="p-5 rounded-xl bg-[#14171A] border border-[#23272B]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#181B1F] border border-[#262A2E] flex items-center justify-center text-slate-300">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#F5EFEB]">Universal Search & Filtering</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Search across employees, projects, and tasks with real-time indexing.
            </p>
          </div>
        </div>

        {/* Search Bar + Inline Dropdowns */}
        <div className="mt-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Type anything to search across tasks, projects, employees, and roles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#3E454E]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[#181B1F] border border-[#282D33] text-xs text-slate-300 focus:outline-none focus:border-[#3E454E] cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Active">Active</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[#181B1F] border border-[#282D33] text-xs text-slate-300 focus:outline-none focus:border-[#3E454E] cursor-pointer"
            >
              <option value="">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[#181B1F] border border-[#282D33] text-xs text-slate-300 focus:outline-none focus:border-[#3E454E] cursor-pointer"
            >
              <option value="">All Departments</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
            </select>

            <button
              onClick={handleClearFilters}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 border border-[#282D33] hover:text-white hover:bg-[#1E2227] transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-[#1D2024]">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-[#E8DFD8] text-[#161310] font-semibold'
                : 'text-slate-400 hover:text-white bg-[#181B1F] border border-[#282D33]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks ({filteredTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-[#E8DFD8] text-[#161310] font-semibold'
                : 'text-slate-400 hover:text-white bg-[#181B1F] border border-[#282D33]'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Projects ({filteredProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              activeTab === 'employees'
                ? 'bg-[#E8DFD8] text-[#161310] font-semibold'
                : 'text-slate-400 hover:text-white bg-[#181B1F] border border-[#282D33]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Employees ({filteredEmployees.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Results Content */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Searching workspace records...</div>
      ) : activeTab === 'tasks' ? (
        <div className="rounded-xl bg-[#14171A] border border-[#23272B] overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No tasks match the filter criteria.
            </div>
          ) : (
            <div className="divide-y divide-[#1D2024]">
              {filteredTasks.map((task) => (
                <div key={task._id} className="p-4 hover:bg-[#181B1F] transition-colors flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-[#EAE6E1] truncate">{task.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{task.description || 'Deliverable'}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Assignee: {task.assignedTo?.name || 'Unassigned'} · Project: {task.projectId?.name || 'Unassigned'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#3C191E] text-[#F87171] border border-[#5C242B]">
                      {task.priority}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#142E23] text-[#4ADE80] border border-[#1B4332]">
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'projects' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-xl bg-[#14171A] border border-[#23272B] text-slate-400 text-xs">
              No projects match the search query.
            </div>
          ) : (
            filteredProjects.map((p) => (
              <div key={p._id} className="p-4 rounded-xl bg-[#14171A] border border-[#23272B] hover:border-[#323840] transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-xs font-semibold text-[#EAE6E1]">{p.name}</h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#142E23] text-[#4ADE80] border border-[#1B4332]">
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{p.description || 'Project deliverable'}</p>
                <div className="pt-2 border-t border-[#1D2024] text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Progress</span>
                  <span className="font-semibold text-slate-200">
                    {p.calculatedProgress !== undefined ? p.calculatedProgress : p.progress || 0}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-[#14171A] border border-[#23272B] overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No employees match the search query.
            </div>
          ) : (
            <div className="divide-y divide-[#1D2024]">
              {filteredEmployees.map((e) => (
                <div key={e._id} className="p-3.5 hover:bg-[#181B1F] transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#2A3037] border border-[#343B44] text-xs font-semibold text-[#EAE6E1] flex items-center justify-center shrink-0">
                      {e.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#EAE6E1]">{e.name}</h4>
                      <p className="text-[11px] text-slate-400">{e.role} · {e.department}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:inline">{e.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
