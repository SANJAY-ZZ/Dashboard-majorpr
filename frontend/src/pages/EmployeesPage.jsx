import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit2,
} from 'lucide-react';
import api from '../services/api';
import authService from '../services/authService';

export default function EmployeesPage() {
  const user = authService.getUser();
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  // Employee Modal (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    role: 'Software Engineer',
    phone: '',
    status: 'Active',
  });

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees');
      if (res.success) {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const startAddEmployee = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      department: 'Engineering',
      role: 'Team Member',
      phone: '',
      status: 'Active',
    });
    setShowModal(true);
  };

  const startEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      department: emp.department || 'Engineering',
      role: emp.role || 'Team Member',
      phone: emp.phone || '',
      status: emp.status || 'Active',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee._id}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      setShowModal(false);
      setEditingEmployee(null);
      loadEmployees();
    } catch (err) {
      alert(err.message || 'Failed to save employee');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/employees/${id}`);
      loadEmployees();
    } catch (err) {
      alert(err.message || 'Failed to delete employee');
    }
  };

  const departments = ['All', ...new Set(employees.map((emp) => emp.department).filter(Boolean))];

  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const avatarColors = [
    'bg-[#2A3B4C] text-[#60A5FA]',
    'bg-[#3B2D45] text-[#C084FC]',
    'bg-[#3D3528] text-[#FBBF24]',
    'bg-[#263D31] text-[#4ADE80]',
    'bg-[#3E282B] text-[#F87171]',
    'bg-[#253940] text-[#38BDF8]',
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#14171A] border border-[#23272B]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#181B1F] border border-[#262A2E] flex items-center justify-center text-slate-300">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#F5EFEB]">Employees</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage employee profiles and department information.
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={startAddEmployee}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E8DFD8] hover:bg-[#DED4CB] text-[#161310] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="p-3.5 rounded-xl bg-[#14171A] border border-[#23272B] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#181B1F] border border-[#262A2E] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#3E454E]"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-[#181B1F] border border-[#282D33] text-xs text-slate-300 focus:outline-none focus:border-[#3E454E] cursor-pointer"
        >
          {departments.map((d) => (
            <option key={d} value={d}>
              {d === 'All' ? 'All Departments' : d}
            </option>
          ))}
        </select>
      </div>

      {/* Employees Table matching reference mockup */}
      <div className="rounded-xl bg-[#14171A] border border-[#23272B] overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">Loading employees...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-xs">No employees found matching current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#23272B] text-slate-400 font-medium">
                  <th scope="col" className="py-3 px-4 font-medium">Name</th>
                  <th scope="col" className="py-3 px-3 font-medium">Role</th>
                  <th scope="col" className="py-3 px-3 font-medium">Department</th>
                  <th scope="col" className="py-3 px-3 font-medium hidden md:table-cell">Email</th>
                  <th scope="col" className="py-3 px-3 font-medium">Status</th>
                  {isAdmin && <th scope="col" className="py-3 pr-4 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2024]">
                {filteredEmployees.map((emp, index) => {
                  const avatarColor = avatarColors[index % avatarColors.length];

                  return (
                    <tr
                      key={emp._id}
                      className="hover:bg-[#181B1F] transition-colors group"
                    >
                      {/* Name + Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full ${avatarColor} font-semibold flex items-center justify-center text-xs shrink-0`}>
                            {emp.name.charAt(0)}
                          </div>
                          <span className="font-medium text-[#EAE6E1] group-hover:text-white truncate">
                            {emp.name}
                          </span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-3 text-slate-300 whitespace-nowrap">
                        {emp.role}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap">
                        {emp.department}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap hidden md:table-cell">
                        {emp.email}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#142E23] text-[#4ADE80] border border-[#1B4332]">
                          {emp.status || 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="py-3.5 pr-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => startEditEmployee(emp)}
                              title="Edit Employee"
                              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1E2328] transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(emp._id)}
                              title="Delete Employee"
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-[#2A181B] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#14171A] w-full max-w-md p-6 rounded-2xl border border-[#23272B] shadow-2xl">
            <h2 className="text-base font-bold text-[#F5EFEB] mb-4">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E]"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Department</label>
                  <input
                    type="text"
                    required
                    list="department-options"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. IT, HR, Engineering"
                    className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E]"
                  />
                  <datalist id="department-options">
                    <option value="IT" />
                    <option value="HR" />
                    <option value="Finance" />
                    <option value="Engineering" />
                    <option value="Design" />
                    <option value="Quality Assurance" />
                    <option value="Marketing" />
                  </datalist>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Role / Title</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-[#262A2E] text-white focus:outline-none focus:border-[#3E454E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEmployee(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1E2227] hover:bg-[#252A30] text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#E8DFD8] hover:bg-[#DED4CB] text-[#161310] font-semibold transition-colors cursor-pointer"
                >
                  {editingEmployee ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
