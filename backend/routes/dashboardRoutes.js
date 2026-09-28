const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { optionalProtect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get aggregated dashboard stats (KPIs, Project Progress, Employee Task Stats, Recent Tasks, 3D Graph)
 * @access  Public / Optional Auth
 */
router.get('/stats', optionalProtect, getDashboardStats);

module.exports = router;
