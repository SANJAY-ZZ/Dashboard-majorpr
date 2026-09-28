const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getProjects)
  .post(protect, authorize('admin', 'manager'), createProject);

router.route('/:id')
  .get(protect, getProjectById)
  .put(protect, authorize('admin', 'manager'), updateProject)
  .delete(protect, authorize('admin'), deleteProject);

module.exports = router;

