import express from 'express';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Participant from '../models/Participant.js';

const router = express.Router();

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const totalParticipants = await Participant.countDocuments();
    const totalOrganizers = await User.countDocuments({
      role: { $in: ['TEAM_LEAD', 'EVENT_STAFF'] }
    });
    
    const now = new Date();
    const activeEvents = await Event.countDocuments({
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('teamLead', 'name email');

    const eventRegistrations = await Event.aggregate([
      {
        $project: {
          name: '$title',
          registrations: { $size: { $ifNull: ['$participants', []] } }
        }
      },
      { $limit: 6 }
    ]);

    // Registration trends over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const registrationTrends = await Participant.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          registrations: '$count',
          _id: 0
        }
      }
    ]);

    // Registration status breakdown
    const registrationsByStatus = await Participant.aggregate([
      {
        $group: {
          _id: '$registrationStatus',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Top events by registration
    const topEvents = await Participant.aggregate([
      {
        $group: {
          _id: '$event',
          registrations: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'eventDetails'
        }
      },
      {
        $unwind: '$eventDetails'
      },
      {
        $project: {
          name: '$eventDetails.title',
          registrations: 1,
          _id: 0
        }
      },
      {
        $sort: { registrations: -1 }
      },
      { $limit: 6 }
    ]);

    // Recent registrations
    const recentRegistrations = await Participant.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('event', 'title')
      .select('name email event registrationStatus createdAt');

    res.json({
      success: true,
      data: {
        stats: {
          totalEvents,
          totalParticipants,
          totalOrganizers,
          totalSiteViews: 12500,
          activeEvents,
        },
        eventRegistrations,
        recentEvents,
        registrationTrends,
        registrationsByStatus,
        topEvents,
        recentRegistrations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
});

// @desc    Get recent activity
// @route   GET /api/dashboard/activity
router.get('/activity', async (req, res) => {
  try {
    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name')
      .populate('teamLead', 'name');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name role createdAt');

    const activities = [];

    recentEvents.forEach(event => {
      activities.push({
        action: 'New event created',
        detail: event.title,
        time: event.createdAt,
        type: 'event',
        status: 'success'
      });

      if (event.teamLead) {
        activities.push({
          action: 'Team lead assigned',
          detail: `${event.teamLead.name} → ${event.title}`,
          time: event.updatedAt,
          type: 'assignment',
          status: 'info'
        });
      }
    });

    recentUsers.forEach(user => {
      activities.push({
        action: `New ${user.role.toLowerCase().replace('_', ' ')} added`,
        detail: user.name,
        time: user.createdAt,
        type: 'user',
        status: 'info'
      });
    });

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({
      success: true,
      data: activities.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activity',
      error: error.message
    });
  }
});

export default router;
