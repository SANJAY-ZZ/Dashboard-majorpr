const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Task = require('../models/Task');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Get all employees with optional search and department filter
 * @route   GET /api/employees
 */
const getEmployees = async (req, res, next) => {
  try {
    const { department, search, status } = req.query;
    const filter = {};

    if (department && department !== 'All') {
      filter.department = department;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { role: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const employees = await Employee.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get employee by ID with their assigned tasks
 * @route   GET /api/employees/:id
 */
const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid employee ID: ${id}`,
      });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    const tasks = await Task.find({ assignedTo: id }).populate('projectId', 'name code');

    res.status(200).json({
      success: true,
      data: {
        ...employee.toObject(),
        tasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new employee
 * @route   POST /api/employees
 */
const createEmployee = async (req, res, next) => {
  try {
    const { name, email, department, role, phone, avatar, status } = req.body;

    const existing = await Employee.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An employee with this email already exists.',
      });
    }

    const employee = await Employee.create({
      name,
      email: email.toLowerCase().trim(),
      department,
      role: role || 'Team Member',
      phone: phone || '',
      avatar: avatar || '',
      status: status || 'Active',
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 */
const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid employee ID: ${id}`,
      });
    }

    const employee = await Employee.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete employee
 * @route   DELETE /api/employees/:id
 */
const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid employee ID: ${id}`,
      });
    }

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully.',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get department statistics
 * @route   GET /api/employees/stats/departments
 */
const getDepartmentStats = async (req, res, next) => {
  try {
    const stats = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          department: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartmentStats,
};
