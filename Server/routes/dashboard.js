import express from 'express';
import { getDashboardStats, getRecentActivity } from '../controllers/dashboardController.js';

const router = express.Router();

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', getDashboardStats);

// GET /api/dashboard/activity - Get recent activity
router.get('/activity', getRecentActivity);

export default router;
