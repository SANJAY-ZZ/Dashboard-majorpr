const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartmentStats,
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getEmployees)
  .post(protect, authorize('admin'), createEmployee);

router.get('/stats/departments', protect, getDepartmentStats);

router.route('/:id')
  .get(protect, getEmployeeById)
  .put(protect, authorize('admin'), updateEmployee)
  .delete(protect, authorize('admin'), deleteEmployee);

module.exports = router;

