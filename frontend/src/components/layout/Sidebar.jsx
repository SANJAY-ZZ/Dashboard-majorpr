import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderGit2,
  Users,
  Search,
  LogOut,
  Layers,
} from 'lucide-react';
import authService from '../../services/authService';

export default function Sidebar({ isOpen, onClose }) {
  const user = authService.getUser();

  const getRoleLabel = (role) => {
    const r = (role || '').toUpperCase();
    if (r === 'ADMIN') return 'Administrator';
    if (r === 'PROJECT_MANAGER' || r === 'MANAGER') return 'Project Manager';
    if (r === 'EMPLOYEE') return 'Employee';
    return role || 'Guest';
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Projects', path: '/projects', icon: FolderGit2 },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Search & Filters', path: '/search', icon: Search },
  ];

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-[#0B0D0F] border-r border-[#23272B] flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo / Brand Header */}
          <div className="h-16 flex items-center px-5 border-b border-[#23272B]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#14171A] border border-[#262A2E] flex items-center justify-center text-slate-200">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-sm tracking-tight text-[#EAE6E1] block leading-tight">
                  Enterprise Task
                </span>
                <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400 block mt-0.5">
                  Management Hub
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#181B1F] text-[#F5EFEB] font-medium border border-[#282C31]'
                        : 'text-slate-400 hover:text-[#EAE6E1] hover:bg-[#14171A]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout Bottom Card */}
        <div className="p-3.5 border-t border-[#23272B]">
          <div className="p-2.5 rounded-lg bg-[#14171A] border border-[#23272B] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#D8CEBE] text-[#161310] font-bold flex items-center justify-center text-xs shrink-0 select-none">
                {user?.name ? user.name.charAt(0) : 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#EAE6E1] truncate">
                  {user?.name || 'Sanjay Kumar'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {getRoleLabel(user?.role)}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1E2227] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
