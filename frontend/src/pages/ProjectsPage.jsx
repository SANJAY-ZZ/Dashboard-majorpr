import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderGit2,
  Plus,
  Search,
  Calendar,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import api from '../services/api';
import authService from '../services/authService';

export default function ProjectsPage() {
  const user = authService.getUser();
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager' || userRole === 'project_manager';
  const canManageProjects = isAdmin || isManager;
  const canDeleteProjects = isAdmin;

  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active',
    startDate: '',
    endDate: '',
    assignedEmployees: [],
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, empRes] = await Promise.all([
        api.get('/projects'),
        api.get('/employees'),
      ]);
      if (projRes.success) setProjects(projRes.data);
      if (empRes.success) setEmployees(empRes.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startAddProject = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      assignedEmployees: [],
    });
    setShowModal(true);
  };

  const startEditProject = (p) => {
    setEditingProject(p);
    const assignedIds = Array.isArray(p.assignedEmployees)
      ? p.assignedEmployees.map((e) => (typeof e === 'object' && e ? e._id : e))
      : [];
    setFormData({
      name: p.name || '',
      code: p.code || '',
      description: p.description || '',
      status: p.status || 'Active',
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
      assignedEmployees: assignedIds,
    });
    setShowModal(true);
  };

  const toggleAssignedEmployee = (empId) => {
    setFormData((prev) => {
      const exists = prev.assignedEmployees.includes(empId);
      return {
        ...prev,
        assignedEmployees: exists
          ? prev.assignedEmployees.filter((id) => id !== empId)
          : [...prev.assignedEmployees, empId],
      };
    });
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      alert('End date cannot be earlier than start date');
      return;
    }
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject._id}`, formData);
      } else {
        await api.post('/projects', formData);
      }
      setShowModal(false);
      setEditingProject(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save project');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(search.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#142E23] text-[#4ADE80] border border-[#1B4332]">
          Completed
        </span>
      );
    }
    if (status === 'Active' || status === 'In Progress') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#132A3D] text-[#60A5FA] border border-[#1E3A5F]">
          {status}
        </span>
      );
    }
    if (status === 'Pending') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#332514] text-[#FBBF24] border border-[#4D361B]">
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#23272B] text-slate-400 border border-[#323840]">
        {status || 'On Hold'}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#14171A] border border-[#23272B]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#181B1F] border border-[#262A2E] flex items-center justify-center text-slate-300">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#F5EFEB]">Projects</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              View and manage all projects and their progress.
            </p>
          </div>
        </div>

        {canManageProjects && (
          <button
            onClick={startAddProject}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E8DFD8] hover:bg-[#DED4CB] text-[#161310] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="p-3.5 rounded-xl bg-[#14171A] border border-[#23272B] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by name, code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#181B1F] border border-[#262A2E] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#3E454E]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-[#181B1F] border border-[#282D33] text-xs text-slate-300 focus:outline-none focus:border-[#3E454E] cursor-pointer"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="In Progress">In Progress</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#14171A] border border-[#23272B] text-slate-400">
          <FolderGit2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p className="text-xs">No projects found matching current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((p) => {
            const progress = p.calculatedProgress !== undefined ? p.calculatedProgress : p.progress || 0;
            const assignedList = Array.isArray(p.assignedEmployees) ? p.assignedEmployees : [];
            const memberCount = assignedList.length;

            return (
              <div
                key={p._id}
                className="p-5 rounded-xl bg-[#14171A] border border-[#23272B] hover:border-[#323840] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-[#F5EFEB] truncate">
                      {p.name}
                    </h3>
                    {getStatusBadge(p.status)}
                  </div>

                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                    {p.description || 'Enterprise project deliverable.'}
                  </p>

                  {/* Progress info */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Progress</span>
                      <span className="font-semibold text-slate-200">{progress}%</span>
                    </div>
                    <div className="w-full bg-[#23272B] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-[#E8DFD8] rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Dates & Members Footer */}
                <div className="pt-3 border-t border-[#1D2024] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDate(p.startDate)} - {formatDate(p.endDate)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Real Assigned Member Badges */}
                    {memberCount === 0 ? (
                      <span className="text-[11px] text-slate-500">0 members</span>
                    ) : (
                      <div className="flex items-center -space-x-1.5">
                        {assignedList.slice(0, 2).map((emp, i) => (
                          <div
                            key={emp._id || i}
                            title={emp.name || 'Member'}
                            className={`w-6 h-6 rounded-full border-2 border-[#14171A] text-[10px] font-bold flex items-center justify-center ${
                              i === 0
                                ? 'bg-[#2A3037] text-slate-200'
                                : 'bg-[#3D352E] text-[#E8DFD8]'
                            }`}
                          >
                            {(emp.name || 'M').charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {memberCount > 2 && (
                          <div className="w-6 h-6 rounded-full bg-[#1F2328] border-2 border-[#14171A] text-[9px] font-medium text-slate-400 flex items-center justify-center">
                            +{memberCount - 2}
                          </div>
                        )}
                      </div>
                    )}

                    {(canManageProjects || canDeleteProjects) && (
                      <div className="flex items-center gap-1 ml-2">
                        {canManageProjects && (
                          <button
                            onClick={() => startEditProject(p)}
                            title="Edit Project"
                            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1E2328] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeleteProjects && (
                          <button
                            onClick={() => handleDelete(p._id)}
                            title="Delete Project"
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-[#2A181B] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#14171A] w-full max-w-lg p-6 rounded-2xl border border-[#23272B] shadow-2xl">
            <h2 className="text-base font-bold text-[#F5EFEB] mb-4">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h2>
            <form onSubmit={handleSaveProject} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile App Redesign"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E]"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Project Code</label>
                <input
                  type="text"
                  placeholder="e.g. PROJ-001 (auto-generated if empty)"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E]"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief summary of project deliverables and goals..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E] cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E]"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1.5 font-medium">
                  Assign Team Members ({formData.assignedEmployees.length} selected)
                </label>
                {employees.length === 0 ? (
                  <p className="text-slate-500 py-2">No employees available to assign.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-[#181B1F] border border-[#262A2E] rounded-lg">
                    {employees.map((emp) => {
                      const isSelected = formData.assignedEmployees.includes(emp._id);
                      return (
                        <button
                          key={emp._id}
                          type="button"
                          onClick={() => toggleAssignedEmployee(emp._id)}
                          className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors cursor-pointer border ${
                            isSelected
                              ? 'bg-[#23272B] border-[#E8DFD8] text-[#F5EFEB]'
                              : 'bg-[#14171A] border-[#262A2E] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                              isSelected
                                ? 'bg-[#E8DFD8] border-[#E8DFD8] text-[#14171A]'
                                : 'border-[#3E454E]'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="text-[11px] truncate font-medium">{emp.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProject(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1E2227] hover:bg-[#252A30] text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#E8DFD8] hover:bg-[#DED4CB] text-[#161310] font-semibold transition-colors cursor-pointer"
                >
                  {editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
