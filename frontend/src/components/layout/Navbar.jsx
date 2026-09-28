import React from 'react';
import { Menu, Search } from 'lucide-react';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
  const user = authService.getUser();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-[#0E1114] border-b border-[#23272B] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Mobile Toggle & Search Link */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#181B1F] lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => navigate('/search')}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#14171A] border border-[#23272B] text-xs text-slate-400 hover:border-[#343A40] transition-colors w-full sm:w-80 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">Search tasks, projects, employees...</span>
        </div>
      </div>

      {/* Right User Profile */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#D8CEBE] text-[#161310] font-bold flex items-center justify-center text-xs shrink-0 select-none">
            {user?.name ? user.name.charAt(0) : 'S'}
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-[#EAE6E1] block leading-tight">
              {user?.name || 'Sanjay Kumar'}
            </span>
            <span className="text-[11px] text-slate-400 font-normal block leading-tight">
              {user?.role === 'admin' ? 'Admin' : (user?.role || 'Admin')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
