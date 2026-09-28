const mongoose = require('mongoose');
const Task = require('../models/Task');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      assignedTo,
      employeeId,
      projectId,
      priority,
      status,
      dueDate,
      completionPercentage,
    } = req.body;

    const resolvedAssignedTo = assignedTo || employeeId;

    if (resolvedAssignedTo && !isValidObjectId(resolvedAssignedTo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignedTo/employeeId Employee ID format. Must be a 24-character hexadecimal ObjectId.',
      });
    }

    if (projectId && !isValidObjectId(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid projectId Project ID format. Must be a 24-character hexadecimal ObjectId.',
      });
    }

    let parsedCompletion = completionPercentage !== undefined ? Number(completionPercentage) : 0;
    let finalStatus = status || 'Pending';

    if (finalStatus === 'Completed') {
      parsedCompletion = 100;
    } else if (parsedCompletion === 100) {
      finalStatus = 'Completed';
    }

    const task = new Task({
      title,
      description,
      assignedTo: resolvedAssignedTo,
      projectId,
      priority: priority || 'Medium',
      status: finalStatus,
      dueDate,
      completionPercentage: parsedCompletion,
    });

    const savedTask = await task.save();
    const populated = await Task.findById(savedTask._id)
      .populate('assignedTo', 'name email role department avatar')
      .populate('projectId', 'name code status');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: populated || savedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all tasks with optional filters
 * @route   GET /api/tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      projectId,
      department,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (priority && priority !== 'All') {
      filter.priority = priority;
    }

    if (assignedTo && assignedTo !== 'All') {
      if (!isValidObjectId(assignedTo)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assignedTo query parameter format.',
        });
      }
      filter.assignedTo = assignedTo;
    }

    if (projectId && projectId !== 'All') {
      if (!isValidObjectId(projectId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid projectId query parameter format.',
        });
      }
      filter.projectId = projectId;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Role-based scoping for EMPLOYEE role
    if (req.userRole === 'employee') {
      if (req.employee) {
        filter.assignedTo = req.employee._id;
      } else {
        filter._id = new mongoose.Types.ObjectId();
      }
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    let tasks = await Task.find(filter)
      .populate('assignedTo', 'name email role department avatar')
      .populate('projectId', 'name code status')
      .sort(sortOptions);

    if (department && department !== 'All') {
      tasks = tasks.filter((t) => t.assignedTo && t.assignedTo.department === department);
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid task ID format: "${id}". Must be a 24-character hexadecimal ObjectId.`,
      });
    }

    const task = await Task.findById(id)
      .populate('assignedTo', 'name email role department avatar')
      .populate('projectId', 'name code status');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${id} not found.`,
      });
    }

    // Role check: If EMPLOYEE role, ensure task is assigned to them
    if (req.userRole === 'employee') {
      const isAssigned =
        req.employee &&
        task.assignedTo &&
        task.assignedTo._id.toString() === req.employee._id.toString();
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden. You are not assigned to this task.',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task by ID
 * @route   PUT /api/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid task ID format: "${id}".`,
      });
    }

    const {
      title,
      description,
      assignedTo,
      employeeId,
      projectId,
      priority,
      status,
      dueDate,
      completionPercentage,
    } = req.body;

    const resolvedAssignedTo = assignedTo !== undefined ? assignedTo : employeeId;

    if (resolvedAssignedTo && !isValidObjectId(resolvedAssignedTo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignedTo/employeeId Employee ID format.',
      });
    }

    if (projectId && !isValidObjectId(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid projectId Project ID format.',
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${id} not found.`,
      });
    }

    // Role check: If EMPLOYEE role, restrict updates
    if (req.userRole === 'employee') {
      const taskAssigneeId = task.assignedTo && (task.assignedTo._id ? task.assignedTo._id.toString() : task.assignedTo.toString());
      const employeeId = req.employee ? req.employee._id.toString() : null;

      if (!employeeId || taskAssigneeId !== employeeId) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden. Employees can only update their own assigned tasks.',
        });
      }

      // Disallow structural and administrative field changes
      if (
        resolvedAssignedTo !== undefined ||
        projectId !== undefined ||
        title !== undefined ||
        description !== undefined ||
        priority !== undefined ||
        dueDate !== undefined
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden. Employees may only update task status and completion progress.',
        });
      }
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (resolvedAssignedTo !== undefined) task.assignedTo = resolvedAssignedTo;
    if (projectId !== undefined) task.projectId = projectId;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;

    if (status !== undefined) {
      task.status = status;
      if (status === 'Completed') {
        task.completionPercentage = 100;
      }
    }

    if (completionPercentage !== undefined) {
      const pct = Number(completionPercentage);
      task.completionPercentage = pct;
      if (pct === 100) {
        task.status = 'Completed';
      } else if (pct < 100 && task.status === 'Completed' && status === undefined) {
        task.status = 'In Progress';
      }
    }

    const updatedTask = await task.save();
    const populated = await Task.findById(updatedTask._id)
      .populate('assignedTo', 'name email role department avatar')
      .populate('projectId', 'name code status');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: populated || updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task by ID
 * @route   DELETE /api/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid task ID format: "${id}".`,
      });
    }

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${id} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get summary metrics for dashboard cards
 * @route   GET /api/tasks/metrics/summary
 */
const getTaskMetrics = async (req, res, next) => {
  try {
    const filter = {};
    if (req.userRole === 'employee') {
      filter.assignedTo = req.employee?._id || new mongoose.Types.ObjectId();
    }

    const total = await Task.countDocuments(filter);
    const pending = await Task.countDocuments({ ...filter, status: 'Pending' });
    const inProgress = await Task.countDocuments({ ...filter, status: 'In Progress' });
    const completed = await Task.countDocuments({ ...filter, status: 'Completed' });
    const highPriority = await Task.countDocuments({ ...filter, priority: 'High' });

    const allTasks = await Task.find(filter, 'completionPercentage dueDate status');
    const now = new Date();
    const overdue = allTasks.filter(
      (t) => t.status !== 'Completed' && new Date(t.dueDate) < now
    ).length;

    const avgCompletion =
      total > 0
        ? Math.round(
            allTasks.reduce((acc, curr) => acc + (curr.completionPercentage || 0), 0) / total
          )
        : 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        completed,
        highPriority,
        overdue,
        avgCompletion,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskMetrics,
};
