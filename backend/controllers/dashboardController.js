const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Project = require('../models/Project');
const Task = require('../models/Task');

/**
 * @desc    Get comprehensive dashboard analytics & statistics (Role-Aware)
 * @route   GET /api/dashboard/stats
 * @access  Public / Optional Auth / Role-Aware
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const isEmployee = req.userRole === 'employee';
    const employeeId = req.employee?._id;

    // Scoped filters based on RBAC
    let taskFilter = {};
    let projectFilter = {};

    if (isEmployee) {
      if (employeeId) {
        taskFilter = { assignedTo: employeeId };
        projectFilter = { assignedEmployees: employeeId };
      } else {
        taskFilter = { _id: new mongoose.Types.ObjectId() };
        projectFilter = { _id: new mongoose.Types.ObjectId() };
      }
    }

    // 1. KPI Aggregations
    const [
      totalEmployees,
      activeProjects,
      completedProjects,
      pendingProjects,
      totalProjects,
      pendingTasks,
      completedTasks,
      inProgressTasks,
      totalTasks,
    ] = await Promise.all([
      isEmployee ? (employeeId ? 1 : 0) : Employee.countDocuments(),
      Project.countDocuments({ ...projectFilter, status: 'Active' }),
      Project.countDocuments({ ...projectFilter, status: 'Completed' }),
      Project.countDocuments({ ...projectFilter, status: 'Pending' }),
      Project.countDocuments(projectFilter),
      Task.countDocuments({ ...taskFilter, status: 'Pending' }),
      Task.countDocuments({ ...taskFilter, status: 'Completed' }),
      Task.countDocuments({ ...taskFilter, status: 'In Progress' }),
      Task.countDocuments(taskFilter),
    ]);

    // Overdue tasks calculation
    const allTaskDocs = await Task.find(
      taskFilter,
      'dueDate status completionPercentage projectId assignedTo'
    );
    const overdueTasks = allTaskDocs.filter(
      (t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now
    ).length;

    // Overall team or personal completion rate
    const overallCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. Real Project Progress Calculations
    const projects = await Project.find(projectFilter)
      .populate('assignedEmployees', 'name email role department avatar')
      .sort({ createdAt: -1 });

    const allTasksForRelations = await Task.find(
      {},
      'projectId status completionPercentage assignedTo'
    );

    const projectProgress = projects.map((proj) => {
      const projIdStr = proj._id.toString();
      const projTasks = allTasksForRelations.filter(
        (t) => t.projectId && t.projectId.toString() === projIdStr
      );
      const pTotal = projTasks.length;
      const pCompleted = projTasks.filter((t) => t.status === 'Completed').length;
      const pInProgress = projTasks.filter((t) => t.status === 'In Progress').length;
      const pPending = projTasks.filter((t) => t.status === 'Pending').length;

      // Real calculated progress: completed tasks / total tasks * 100
      const calculatedProgress =
        pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : proj.progress || 0;

      return {
        _id: proj._id,
        name: proj.name,
        code: proj.code || '',
        description: proj.description || '',
        status: proj.status,
        startDate: proj.startDate,
        endDate: proj.endDate,
        assignedEmployeesCount: proj.assignedEmployees ? proj.assignedEmployees.length : 0,
        assignedEmployees: proj.assignedEmployees || [],
        totalTasks: pTotal,
        completedTasks: pCompleted,
        inProgressTasks: pInProgress,
        pendingTasks: pPending,
        progress: calculatedProgress,
      };
    });

    // 3. Real Employee Task Statistics
    let allEmployees;
    if (isEmployee) {
      allEmployees = employeeId
        ? await Employee.find({ _id: employeeId }, 'name email department role avatar status')
        : [];
    } else {
      allEmployees = await Employee.find({}, 'name email department role avatar status');
    }

    const employeeTaskStats = allEmployees.map((emp) => {
      const empIdStr = emp._id.toString();
      const empTasks = allTasksForRelations.filter(
        (t) => t.assignedTo && t.assignedTo.toString() === empIdStr
      );
      const eTotal = empTasks.length;
      const eCompleted = empTasks.filter((t) => t.status === 'Completed').length;
      const eInProgress = empTasks.filter((t) => t.status === 'In Progress').length;
      const ePending = empTasks.filter((t) => t.status === 'Pending').length;

      const completionRate = eTotal > 0 ? Math.round((eCompleted / eTotal) * 100) : 0;

      return {
        employeeId: emp._id,
        name: emp.name,
        email: emp.email,
        department: emp.department || 'General',
        role: emp.role || 'Team Member',
        avatar: emp.avatar || '',
        status: emp.status || 'Active',
        totalTasks: eTotal,
        completedTasks: eCompleted,
        inProgressTasks: eInProgress,
        pendingTasks: ePending,
        completionRate,
      };
    });

    // Sort employee stats by workload/totalTasks descending
    employeeTaskStats.sort((a, b) => b.totalTasks - a.totalTasks);

    // 4. Recent / Priority Tasks Overview (scoped to role)
    const recentTasks = await Task.find(taskFilter)
      .populate('assignedTo', 'name email role department avatar')
      .populate('projectId', 'name code status')
      .sort({ createdAt: -1 })
      .limit(8);


    const formattedRecentTasks = recentTasks.map((t) => {
      const isOverdue =
        t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now;
      return {
        _id: t._id,
        title: t.title,
        description: t.description,
        assignedTo: t.assignedTo,
        projectId: t.projectId,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        completionPercentage: t.completionPercentage,
        isOverdue,
        createdAt: t.createdAt,
      };
    });

    // 5. 3D Project Core Graph Network Data
    // Constructs the relational topology: EMPLOYEES -> PROJECTS -> TASKS
    const graphNodes = [];
    const graphLinks = [];

    // Project Nodes (Central)
    projects.forEach((p) => {
      const pTasks = allTaskDocs.filter(
        (t) => t.projectId && t.projectId.toString() === p._id.toString()
      );
      const pCompleted = pTasks.filter((t) => t.status === 'Completed').length;
      const pProgress = pTasks.length > 0 ? Math.round((pCompleted / pTasks.length) * 100) : p.progress || 0;

      graphNodes.push({
        id: `proj-${p._id}`,
        dbId: p._id.toString(),
        name: p.name,
        code: p.code,
        type: 'PROJECT',
        status: p.status,
        progress: pProgress,
        taskCount: pTasks.length,
      });

      // Links: Project -> Assigned Employees
      if (p.assignedEmployees && p.assignedEmployees.length > 0) {
        p.assignedEmployees.forEach((emp) => {
          graphLinks.push({
            source: `proj-${p._id}`,
            target: `emp-${emp._id}`,
            type: 'PROJECT_EMPLOYEE',
          });
        });
      }
    });

    // Employee Nodes
    allEmployees.forEach((emp) => {
      graphNodes.push({
        id: `emp-${emp._id}`,
        dbId: emp._id.toString(),
        name: emp.name,
        department: emp.department,
        role: emp.role,
        type: 'EMPLOYEE',
      });
    });

    // Task Nodes (Top recent tasks for 3D clarity)
    recentTasks.forEach((t) => {
      if (t.projectId && t.assignedTo) {
        const taskId = `task-${t._id}`;
        graphNodes.push({
          id: taskId,
          dbId: t._id.toString(),
          name: t.title,
          type: 'TASK',
          priority: t.priority,
          status: t.status,
          completionPercentage: t.completionPercentage,
        });

        // Link Project -> Task
        graphLinks.push({
          source: `proj-${t.projectId._id}`,
          target: taskId,
          type: 'PROJECT_TASK',
        });

        // Link Employee -> Task
        graphLinks.push({
          source: `emp-${t.assignedTo._id}`,
          target: taskId,
          type: 'EMPLOYEE_TASK',
        });
      }
    });

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        role: req.userRole || 'admin',
        kpis: {
          totalEmployees,
          activeProjects,
          completedProjects,
          pendingProjects,
          totalProjects,
          pendingTasks,
          completedTasks,
          inProgressTasks,
          totalTasks,
          overdueTasks,
          overallCompletionRate,
        },
        projectProgress,
        employeeTaskStats,
        recentTasks: formattedRecentTasks,
        graphData: {
          nodes: graphNodes,
          links: graphLinks,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
