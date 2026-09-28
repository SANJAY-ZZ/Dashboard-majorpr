const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Get all projects with real calculated task metrics
 * @route   GET /api/projects
 */
const getProjects = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { code: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Role-based scoping for EMPLOYEE role
    if (req.userRole === 'employee') {
      if (req.employee) {
        filter.assignedEmployees = req.employee._id;
      } else {
        filter._id = new mongoose.Types.ObjectId();
      }
    }

    const projects = await Project.find(filter)
      .populate('assignedEmployees', 'name email role department avatar')
      .sort({ createdAt: -1 });

    // Calculate real progress for each project based on tasks
    const allTasks = await Task.find({}, 'projectId status completionPercentage');

    const projectsWithProgress = projects.map((proj) => {
      const projObj = proj.toObject();
      const projTasks = allTasks.filter(
        (t) => t.projectId && t.projectId.toString() === proj._id.toString()
      );
      const totalTasks = projTasks.length;
      const completedTasks = projTasks.filter((t) => t.status === 'Completed').length;
      const inProgressTasks = projTasks.filter((t) => t.status === 'In Progress').length;
      const pendingTasks = projTasks.filter((t) => t.status === 'Pending').length;

      // Real calculated progress: completed tasks / total tasks * 100
      const calculatedProgress =
        totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : proj.progress || 0;

      return {
        ...projObj,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        calculatedProgress,
      };
    });

    res.status(200).json({
      success: true,
      count: projectsWithProgress.length,
      data: projectsWithProgress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get project by ID with assigned tasks and employees
 * @route   GET /api/projects/:id
 */
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid project ID: ${id}`,
      });
    }

    const project = await Project.findById(id).populate(
      'assignedEmployees',
      'name email role department avatar'
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Role check: If EMPLOYEE role, ensure project is assigned to them
    if (req.userRole === 'employee') {
      const isAssigned =
        req.employee &&
        project.assignedEmployees.some(
          (emp) => emp._id.toString() === req.employee._id.toString()
        );
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden. You are not assigned to this project.',
        });
      }
    }

    const tasks = await Task.find({ projectId: id }).populate(
      'assignedTo',
      'name email role department avatar'
    );

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const calculatedProgress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress || 0;

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        tasks,
        totalTasks,
        completedTasks,
        calculatedProgress,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a project
 * @route   POST /api/projects
 */
const createProject = async (req, res, next) => {
  try {
    const { name, code, description, status, startDate, endDate, assignedEmployees } = req.body;

    const project = await Project.create({
      name,
      code: code || `PROJ-${Date.now().toString().slice(-4)}`,
      description: description || '',
      status: status || 'Active',
      startDate: startDate || new Date(),
      endDate: endDate || null,
      assignedEmployees: assignedEmployees || [],
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 */
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid project ID: ${id}`,
      });
    }

    const project = await Project.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 */
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid project ID: ${id}`,
      });
    }

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully.',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
