import express from 'express';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';

const router = express.Router();

// @desc    Get comprehensive analytics and reports
// @route   GET /api/reports/analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'monthly', eventId } = req.query;

    // Build event filter
    const eventFilter = eventId && eventId !== 'all' ? { _id: eventId } : {};

    // --- Summary Stats ---
    const totalRegistrations = await Participant.countDocuments();
    const totalAttendance = await Attendance.countDocuments();
    const totalCertificates = await Certificate.countDocuments();
    const activeEvents = await Event.countDocuments({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    const attendanceRate = totalRegistrations > 0 
      ? ((totalAttendance / totalRegistrations) * 100).toFixed(1)
      : 0;

    // --- Event Lifecycle Distribution ---
    const now = new Date();
    const upcomingEvents = await Event.countDocuments({
      ...eventFilter,
      startDate: { $gt: now }
    });
    const activeEventsFiltered = await Event.countDocuments({
      ...eventFilter,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    const completedEvents = await Event.countDocuments({
      ...eventFilter,
      endDate: { $lt: now }
    });
    const cancelledEvents = await Event.countDocuments({
      ...eventFilter,
      status: 'CANCELLED'
    });

    const eventLifecycle = [
      { name: 'Upcoming', value: upcomingEvents, color: '#3b82f6' },
      { name: 'Active', value: activeEventsFiltered, color: '#22c55e' },
      { name: 'Completed', value: completedEvents, color: '#8b5cf6' },
      { name: 'Cancelled', value: cancelledEvents, color: '#ef4444' }
    ];

    // --- Event-wise Registrations (for all events chart) ---
    const eventRegistrations = await Event.aggregate([
      { $match: eventFilter },
      {
        $lookup: {
          from: 'participants',
          localField: '_id',
          foreignField: 'event',
          as: 'participants'
        }
      },
      {
        $project: {
          name: '$title',
          registrations: { $size: '$participants' }
        }
      },
      { $match: { registrations: { $gt: 0 } } },
      { $sort: { registrations: -1 } },
      { $limit: 10 }
    ]);

    // --- Top 5 Events by Attendance Rate ---
    const topEventsByAttendance = await Event.aggregate([
      { $match: eventFilter },
      {
        $lookup: {
          from: 'participants',
          localField: '_id',
          foreignField: 'event',
          as: 'participants'
        }
      },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'event',
          as: 'attendance'
        }
      },
      {
        $project: {
          name: '$title',
          registrations: { $size: '$participants' },
          attendance: { $size: '$attendance' },
          attendanceRate: {
            $cond: [
              { $gt: [{ $size: '$participants' }, 0] },
              {
                $multiply: [
                  { $divide: [{ $size: '$attendance' }, { $size: '$participants' }] },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $match: { registrations: { $gt: 0 } } },
      { $sort: { attendanceRate: -1 } },
      { $limit: 5 }
    ]);

    // This section has been replaced by topEventsByAttendance above

    // --- Certificates Issued Over Time ---
    let certificateTimeData;
    
    if (period === 'daily') {
      // Last 30 days
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      certificateTimeData = await Certificate.aggregate([
        { $match: { issuedAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$issuedAt' }
            },
            issued: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } },
        {
          $project: {
            month: {
              $dateToString: {
                format: '%b %d',
                date: { $dateFromString: { dateString: '$_id' } }
              }
            },
            issued: 1,
            _id: 0
          }
        }
      ]);
    } else if (period === 'weekly') {
      // Last 4 weeks
      const fourWeeksAgo = new Date(now);
      fourWeeksAgo.setDate(now.getDate() - 28);
      
      certificateTimeData = await Certificate.aggregate([
        { $match: { issuedAt: { $gte: fourWeeksAgo } } },
        {
          $group: {
            _id: {
              week: { $week: '$issuedAt' },
              year: { $year: '$issuedAt' }
            },
            issued: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
        {
          $project: {
            month: { $concat: ['Week ', { $toString: '$_id.week' }] },
            issued: 1,
            _id: 0
          }
        }
      ]);
    } else if (period === 'quarterly') {
      // Last 4 quarters
      certificateTimeData = await Certificate.aggregate([
        {
          $group: {
            _id: {
              quarter: { $ceil: { $divide: [{ $month: '$issuedAt' }, 3] } },
              year: { $year: '$issuedAt' }
            },
            issued: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.quarter': 1 } },
        { $limit: 4 },
        {
          $project: {
            month: { $concat: ['Q', { $toString: '$_id.quarter' }, ' ', { $toString: '$_id.year' }] },
            issued: 1,
            _id: 0
          }
        }
      ]);
    } else {
      // Default: Last 6 months
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      
      certificateTimeData = await Certificate.aggregate([
        { $match: { issuedAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              month: { $month: '$issuedAt' },
              year: { $year: '$issuedAt' }
            },
            issued: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            month: {
              $let: {
                vars: {
                  monthsInString: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                },
                in: { $arrayElemAt: ['$$monthsInString', '$_id.month'] }
              }
            },
            issued: 1,
            _id: 0
          }
        }
      ]);
    }

    // --- Weekly Registration Trend (last 4 weeks) ---
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(now.getDate() - 28);
    
    const weeklyRegistrations = await Participant.aggregate([
      { $match: { createdAt: { $gte: fourWeeksAgo } } },
      {
        $group: {
          _id: {
            week: { $week: '$createdAt' }
          },
          registrations: { $sum: 1 }
        }
      },
      { $sort: { '_id.week': 1 } },
      {
        $project: {
          week: { $concat: ['Week ', { $toString: '$_id.week' }] },
          registrations: 1,
          _id: 0
        }
      },
      { $limit: 4 }
    ]);

    // --- Calculate trends (compare with previous period) ---
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const recentRegistrations = await Participant.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const previousRegistrations = await Participant.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });
    const registrationTrend = previousRegistrations > 0
      ? Math.round(((recentRegistrations - previousRegistrations) / previousRegistrations) * 100)
      : 100;

    const recentCertificates = await Certificate.countDocuments({
      issuedAt: { $gte: thirtyDaysAgo }
    });
    const previousCertificates = await Certificate.countDocuments({
      issuedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });
    const certificateTrend = previousCertificates > 0
      ? Math.round(((recentCertificates - previousCertificates) / previousCertificates) * 100)
      : 100;

    res.json({
      success: true,
      data: {
        stats: {
          totalRegistrations,
          attendanceRate,
          totalCertificates,
          activeEvents,
          trends: {
            registrations: registrationTrend,
            attendance: 5,
            certificates: certificateTrend,
            events: 2
          }
        },
        eventLifecycle,
        topEventsByAttendance,
        eventRegistrations,
        certificateTimeData,
        weeklyRegistrations
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
});

// @desc    Get events list for filter dropdown
// @route   GET /api/reports/events
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find()
      .select('_id title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
});

export default router;
