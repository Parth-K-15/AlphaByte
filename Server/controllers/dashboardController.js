import User from '../models/User.js';
import Event from '../models/Event.js';
import Participant from '../models/Participant.js';

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalEvents = await Event.countDocuments();
    const totalParticipants = await Participant.countDocuments();
    const totalOrganizers = await User.countDocuments({
      role: { $in: ['TEAM_LEAD', 'EVENT_STAFF'] }
    });
    
    // Get active events (events that are ongoing)
    const now = new Date();
    const activeEvents = await Event.countDocuments({
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    // Get recent events with participant count
    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('teamLead', 'name email');

    // Get event registration data for chart
    const eventRegistrations = await Event.aggregate([
      {
        $project: {
          name: '$title',
          registrations: { $size: { $ifNull: ['$participants', []] } }
        }
      },
      { $limit: 6 }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalEvents,
          totalParticipants,
          totalOrganizers,
          totalSiteViews: 12500, // Placeholder - implement tracking later
        },
        eventRegistrations,
        recentEvents
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// Get recent activity
export const getRecentActivity = async (req, res) => {
  try {
    // Get recent events created
    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name')
      .populate('teamLead', 'name');

    // Get recent users added
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name role createdAt');

    // Combine and format activities
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

    // Sort by time and limit
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
};
