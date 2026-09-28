const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskMetrics,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Metrics endpoint
router.get('/metrics/summary', protect, getTaskMetrics);

// Root CRUD
router.route('/')
  .get(protect, getTasks)
  .post(protect, authorize('admin', 'manager'), createTask);

// By ID
router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, authorize('admin', 'manager'), deleteTask);

module.exports = router;

