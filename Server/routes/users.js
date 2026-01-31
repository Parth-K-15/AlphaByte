import express from 'express';
import {
  getAllUsers,
  getUser,
  toggleUserStatus
} from '../controllers/userController.js';

const router = express.Router();

// GET /api/users - Get all users
router.get('/', getAllUsers);

// GET /api/users/:id - Get single user
router.get('/:id', getUser);

// PUT /api/users/:id/toggle-status - Toggle user active status
router.put('/:id/toggle-status', toggleUserStatus);

export default router;
