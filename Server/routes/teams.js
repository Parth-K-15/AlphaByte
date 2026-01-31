import express from 'express';
import {
  getTeamLeads,
  getEventStaff,
  createTeamLead,
  createEventStaff,
  updateUser,
  deleteUser,
  resetPassword,
  getPermissions,
  updatePermissions
} from '../controllers/teamController.js';

const router = express.Router();

// Team Leads
// GET /api/teams/leads - Get all team leads
router.get('/leads', getTeamLeads);

// POST /api/teams/leads - Create new team lead
router.post('/leads', createTeamLead);

// Event Staff / Members
// GET /api/teams/members - Get all event staff
router.get('/members', getEventStaff);

// POST /api/teams/members - Create new event staff
router.post('/members', createEventStaff);

// User operations
// PUT /api/teams/users/:id - Update user
router.put('/users/:id', updateUser);

// DELETE /api/teams/users/:id - Delete user
router.delete('/users/:id', deleteUser);

// PUT /api/teams/users/:id/reset-password - Reset user password
router.put('/users/:id/reset-password', resetPassword);

// Permissions
// GET /api/teams/permissions - Get role permissions
router.get('/permissions', getPermissions);

// PUT /api/teams/permissions - Update role permissions
router.put('/permissions', updatePermissions);

export default router;
