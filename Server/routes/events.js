import express from 'express';
import {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  assignTeamLead,
  updateEventLifecycle
} from '../controllers/eventController.js';

const router = express.Router();

// GET /api/events - Get all events
router.get('/', getAllEvents);

// GET /api/events/:id - Get single event
router.get('/:id', getEvent);

// POST /api/events - Create new event
router.post('/', createEvent);

// PUT /api/events/:id - Update event
router.put('/:id', updateEvent);

// DELETE /api/events/:id - Delete event
router.delete('/:id', deleteEvent);

// PUT /api/events/:id/assign-lead - Assign team lead to event
router.put('/:id/assign-lead', assignTeamLead);

// PUT /api/events/:id/lifecycle - Update event lifecycle
router.put('/:id/lifecycle', updateEventLifecycle);

export default router;
