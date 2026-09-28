import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  FolderGit2,
  CheckCircle2,
  Clock,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatCard from '../components/dashboard/StatCard';
import ProjectProgress from '../components/dashboard/ProjectProgress';
import RecentTasks from '../components/dashboard/RecentTasks';
import EmployeeTaskStats from '../components/dashboard/EmployeeTaskStats';
import DashboardSkeletons from '../components/dashboard/DashboardSkeletons';
import { getDashboardStats } from '../services/dashboardService';
import authService from '../services/authService';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(authService.getUser());
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardStats();

      if (res.success && res.data) {
        setData(res.data);
      } else {
        throw new Error(res.message || 'Invalid response format');
      }
    } catch (err) {
      console.error('Dashboard data load failed:', err);
      setError(err.message || 'Unable to connect to dashboard API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading && !data) {
    return <DashboardSkeletons />;
  }

  if (error && !data) {
    return (
      <div className="rounded-xl bg-[#14171A] border border-[#23272B] p-8 text-center max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-lg bg-[#3C191E] text-[#F87171] border border-[#5C242B] flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#F5EFEB] mb-1">Failed to Load Workspace</h3>
        <p className="text-xs text-slate-400 mb-5">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 rounded-lg bg-[#E8DFD8] hover:bg-[#DED4CB] text-[#161310] text-xs font-semibold transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { kpis, projectProgress = [], employeeTaskStats = [], recentTasks = [], role: serverRole } = data || {};
  const currentRole = (serverRole || user?.role || '').toLowerCase();
  const isEmployee = currentRole === 'employee';

  return (
    <div className="space-y-5">
      {/* 1. Hero Section */}
      <DashboardHeader user={user} />

      {/* 2. Five Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {isEmployee ? (
          <>
            <StatCard
              title="Assigned Tasks"
              value={kpis?.totalTasks}
              description="Assigned to you"
              icon={CheckSquare}
              isAccent={true}
              route="/tasks"
            />
            <StatCard
              title="Active Projects"
              value={kpis?.activeProjects}
              description="In progress"
              icon={FolderGit2}
              route="/projects"
            />
            <StatCard
              title="Completion Rate"
              value={`${kpis?.overallCompletionRate || 0}%`}
              description="Personal resolution"
              icon={CheckCircle2}
              route="/tasks"
            />
            <StatCard
              title="Pending Tasks"
              value={kpis?.pendingTasks}
              description="Awaiting action"
              icon={Clock}
              route="/tasks"
            />
            <StatCard
              title="Completed Tasks"
              value={kpis?.completedTasks}
              description="Resolved deliverables"
              icon={CheckSquare}
              route="/tasks"
              className="col-span-2 lg:col-span-1"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Employees"
              value={kpis?.totalEmployees}
              description="Active workforce"
              icon={Users}
              isAccent={true}
              route="/employees"
            />
            <StatCard
              title="Active Projects"
              value={kpis?.activeProjects}
              description="In progress"
              icon={FolderGit2}
              route="/projects"
            />
            <StatCard
              title="Completed Projects"
              value={kpis?.completedProjects}
              description="Delivered successfully"
              icon={CheckCircle2}
              route="/projects"
            />
            <StatCard
              title="Pending Tasks"
              value={kpis?.pendingTasks}
              description="Awaiting action"
              icon={Clock}
              route="/tasks"
            />
            <StatCard
              title="Completed Tasks"
              value={kpis?.completedTasks}
              description="Resolved deliverables"
              icon={CheckSquare}
              route="/tasks"
              className="col-span-2 lg:col-span-1"
            />
          </>
        )}
      </div>

      {/* 3. Main 2-Column Section: Project Progress (Left) + Recent Tasks (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ProjectProgress projects={projectProgress} />
        <RecentTasks tasks={recentTasks} />
      </div>

      {/* 4. Bottom Section: Team Workload */}
      <EmployeeTaskStats employeeStats={employeeTaskStats} />
    </div>
  );
}
