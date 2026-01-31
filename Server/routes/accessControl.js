import express from 'express';
import {
  getRestrictedUsers,
  restrictUser,
  unrestrictUser,
  suspendUser,
  getSuspendedUsers,
  unsuspendUser,
  deleteUserPermanently
} from '../controllers/accessControlController.js';

const router = express.Router();

// Restricted Users
// GET /api/access-control/restricted - Get all restricted users
router.get('/restricted', getRestrictedUsers);

// POST /api/access-control/restrict - Restrict a user
router.post('/restrict', restrictUser);

// PUT /api/access-control/unrestrict/:id - Unrestrict a user
router.put('/unrestrict/:id', unrestrictUser);

// Suspended Users
// GET /api/access-control/suspended - Get all suspended users
router.get('/suspended', getSuspendedUsers);

// POST /api/access-control/suspend - Suspend a user
router.post('/suspend', suspendUser);

// PUT /api/access-control/unsuspend/:id - Unsuspend a user
router.put('/unsuspend/:id', unsuspendUser);

// DELETE /api/access-control/users/:id - Delete user permanently
router.delete('/users/:id', deleteUserPermanently);

export default router;
