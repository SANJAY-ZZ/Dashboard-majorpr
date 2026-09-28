import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import api from '../services/api';
import authService from '../services/authService';

export default function TasksPage() {
  const user = authService.getUser();
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager' || userRole === 'project_manager';
  const canManageTasks = isAdmin || isManager;

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [search, setSearch] = useState('');

  // New task modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    projectId: '',
    priority: 'Medium',
    status: 'Pending',
    dueDate: '',
    completionPercentage: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksRes, empRes, projRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/employees'),
        api.get('/projects'),
      ]);
      if (tasksRes.success) setTasks(tasksRes.data);
      if (empRes.success) setEmployees(empRes.data);
      if (projRes.success) setProjects(projRes.data);
    } catch (err) {
      console.error('Error fetching tasks data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/tasks', formData);
      if (res.success) {
        setShowModal(false);
        setFormData({
          title: '',
          description: '',
          assignedTo: '',
          projectId: '',
          priority: 'Medium',
          status: 'Pending',
          dueDate: '',
          completionPercentage: 0,
        });
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
    const nextPct = nextStatus === 'Completed' ? 100 : 50;
    try {
      await api.put(`/tasks/${task._id}`, {
        status: nextStatus,
        completionPercentage: nextPct,
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesProject = projectFilter === 'All' || (t.projectId && (t.projectId._id === projectFilter || t.projectId === projectFilter));
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.assignedTo?.name && t.assignedTo.name.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesPriority && matchesProject && matchesSearch;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#3C191E] text-[#F87171] border border-[#5C242B]">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#3B2B17] text-[#FBBF24] border border-[#5A4220]">
            Medium
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#142E23] text-[#4ADE80] border border-[#1B4332]">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#142E23] text-[#4ADE80] border border-[#1B4332]">
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#16273B] text-[#38BDF8] border border-[#1E3A5F]">
            In Progress
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#332514] text-[#FBBF24] border border-[#4D361B]">
            Pending
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#14171A] border border-[#23272B]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#181B1F] border border-[#262A2E] flex items-center justify-center text-slate-300">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#F5EFEB]">Tasks</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Create, assign, track and manage tasks efficiently.
            </p>
          </div>
        </div>

        {canManageTasks && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E8DFD8] hover:bg-[#DED4CB] text-[#161310] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 rounded-xl bg-[#14171A] border border-[#23272B] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title, description, or assignee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#181B1F] border border-[#262A2E] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#3E454E]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#181B1F] border border-[#282D33] text-xs text-slate-300 focus:outline-none focus:border-[#3E454E] cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#181B1F] border border-[#282D33] text-xs text-slate-300 focus:outline-none focus:border-[#3E454E] cursor-pointer"
          >
            <option value="All">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#181B1F] border border-[#282D33] text-xs text-slate-300 focus:outline-none focus:border-[#3E454E] cursor-pointer"
          >
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-xl bg-[#14171A] border border-[#23272B] overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-xs">No tasks found matching current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#23272B] text-slate-400 font-medium">
                  <th scope="col" className="py-3 px-4 font-medium">Task</th>
                  <th scope="col" className="py-3 px-3 font-medium">Project</th>
                  <th scope="col" className="py-3 px-3 font-medium">Assignee</th>
                  <th scope="col" className="py-3 px-3 font-medium">Priority</th>
                  <th scope="col" className="py-3 px-3 font-medium">Status</th>
                  <th scope="col" className="py-3 px-3 font-medium">Due Date</th>
                  <th scope="col" className="py-3 pr-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2024]">
                {filteredTasks.map((task) => {
                  const isCompleted = task.status === 'Completed';
                  const assigneeName = task.assignedTo?.name
                    ? task.assignedTo.name.split(' ')[0]
                    : 'Unassigned';
                  const projectName = task.projectId?.name || 'Unassigned';

                  return (
                    <tr
                      key={task._id}
                      className="hover:bg-[#181B1F] transition-colors group"
                    >
                      {/* Task Title */}
                      <td className="py-3 px-4 font-medium text-[#EAE6E1] max-w-[200px] truncate">
                        <span className={isCompleted ? 'line-through text-slate-500' : ''}>
                          {task.title}
                        </span>
                      </td>

                      {/* Project */}
                      <td className="py-3 px-3 text-slate-400 max-w-[140px] truncate whitespace-nowrap">
                        {projectName}
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {assigneeName}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getPriorityBadge(task.priority)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(task.status)}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {formatDate(task.dueDate)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(task)}
                            className="px-2 py-0.5 rounded text-[11px] font-medium transition-colors text-slate-300 hover:text-white bg-[#1E2227] hover:bg-[#252A30] cursor-pointer"
                          >
                            {isCompleted ? 'Reopen' : 'Done'}
                          </button>
                          {canManageTasks && (
                            <button
                              onClick={() => handleDeleteTask(task._id)}
                              title="Delete Task"
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-[#2A181B] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#14171A] w-full max-w-lg p-6 rounded-2xl border border-[#23272B] shadow-2xl">
            <h2 className="text-base font-bold text-[#F5EFEB] mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E]"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Assignee</label>
                  <select
                    required
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E] cursor-pointer"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Project</label>
                  <select
                    required
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E] cursor-pointer"
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E] cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1E2227] hover:bg-[#252A30] text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#E8DFD8] hover:bg-[#DED4CB] text-[#161310] font-semibold transition-colors cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
