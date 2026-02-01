import EventUpdate from '../models/EventUpdate.js';
import Event from '../models/Event.js';

// @desc    Get all updates for an event
// @route   GET /api/organizer/updates/:eventId
export const getEventUpdates = async (req, res) => {
  try {
    const { eventId } = req.params;

    const updates = await EventUpdate.find({ event: eventId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: updates.length, data: updates });
  } catch (error) {
    console.error('Error fetching event updates:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new event update
// @route   POST /api/organizer/updates/:eventId
export const createEventUpdate = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message, type = 'INFO', isPinned = false, organizerId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const update = await EventUpdate.create({ event: eventId, message, type, isPinned, createdBy: organizerId });

    const populatedUpdate = await EventUpdate.findById(update._id).populate('createdBy', 'name email');

    res.status(201).json({ success: true, message: 'Update posted successfully', data: populatedUpdate });
  } catch (error) {
    console.error('Error creating event update:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete an event update
// @route   DELETE /api/organizer/updates/:updateId
export const deleteEventUpdate = async (req, res) => {
  try {
    const { updateId } = req.params;

    const update = await EventUpdate.findByIdAndDelete(updateId);
    if (!update) {
      return res.status(404).json({ success: false, message: 'Update not found' });
    }

    res.json({ success: true, message: 'Update deleted successfully' });
  } catch (error) {
    console.error('Error deleting event update:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Toggle pin status of an update
// @route   PUT /api/organizer/updates/:updateId/pin
export const togglePinUpdate = async (req, res) => {
  try {
    const { updateId } = req.params;

    const update = await EventUpdate.findById(updateId);
    if (!update) {
      return res.status(404).json({ success: false, message: 'Update not found' });
    }

    update.isPinned = !update.isPinned;
    await update.save();

    res.json({ success: true, message: update.isPinned ? 'Update pinned' : 'Update unpinned', data: update });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
