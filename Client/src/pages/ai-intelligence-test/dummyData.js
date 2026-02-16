// Dummy data for AI Participation Intelligence testing
// This structure mirrors the real database schema for easy backend integration

export const eventTypes = {
  WORKSHOP: 'Workshop',
  SEMINAR: 'Seminar',
  HACKATHON: 'Hackathon',
  CONFERENCE: 'Conference',
  WEBINAR: 'Webinar',
  COMPETITION: 'Competition'
};

// Historical event-type specific no-show rates (calculated from past data)
export const eventTypeNoShowRates = {
  [eventTypes.WORKSHOP]: 0.15,      // 15% no-show
  [eventTypes.SEMINAR]: 0.25,       // 25% no-show
  [eventTypes.HACKATHON]: 0.10,     // 10% no-show (high engagement)
  [eventTypes.CONFERENCE]: 0.20,    // 20% no-show
  [eventTypes.WEBINAR]: 0.35,       // 35% no-show (easy to skip)
  [eventTypes.COMPETITION]: 0.08    // 8% no-show (very committed)
};

// Student participation records
export const students = [
  {
    id: 'STU001',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    department: 'Computer Science',
    year: 3,
    totalRegistrations: 24,
    totalAttended: 22,
    totalCertified: 20,
    avgAttendanceRate: 0.92,
    participationHistory: [
      { eventId: 'EVT001', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-09-15' },
      { eventId: 'EVT002', eventType: eventTypes.SEMINAR, registered: true, attended: true, certified: true, date: '2025-09-22' },
      { eventId: 'EVT005', eventType: eventTypes.HACKATHON, registered: true, attended: true, certified: true, date: '2025-10-10' },
      { eventId: 'EVT008', eventType: eventTypes.CONFERENCE, registered: true, attended: true, certified: true, date: '2025-10-25' },
      { eventId: 'EVT012', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-11-08' },
      { eventId: 'EVT015', eventType: eventTypes.COMPETITION, registered: true, attended: true, certified: true, date: '2025-11-20' },
      { eventId: 'EVT018', eventType: eventTypes.WEBINAR, registered: true, attended: true, certified: false, date: '2025-12-05' },
      { eventId: 'EVT022', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-12-18' },
      { eventId: 'EVT025', eventType: eventTypes.SEMINAR, registered: true, attended: false, certified: false, date: '2026-01-10' },
      { eventId: 'EVT028', eventType: eventTypes.HACKATHON, registered: true, attended: true, certified: true, date: '2026-01-25' },
    ]
  },
  {
    id: 'STU002',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    department: 'Information Technology',
    year: 2,
    totalRegistrations: 20,
    totalAttended: 19,
    totalCertified: 18,
    avgAttendanceRate: 0.95,
    participationHistory: [
      { eventId: 'EVT001', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-09-15' },
      { eventId: 'EVT003', eventType: eventTypes.COMPETITION, registered: true, attended: true, certified: true, date: '2025-09-28' },
      { eventId: 'EVT006', eventType: eventTypes.SEMINAR, registered: true, attended: true, certified: true, date: '2025-10-12' },
      { eventId: 'EVT009', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-10-28' },
      { eventId: 'EVT013', eventType: eventTypes.HACKATHON, registered: true, attended: true, certified: true, date: '2025-11-12' },
      { eventId: 'EVT016', eventType: eventTypes.CONFERENCE, registered: true, attended: true, certified: true, date: '2025-11-22' },
      { eventId: 'EVT019', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-12-08' },
      { eventId: 'EVT023', eventType: eventTypes.COMPETITION, registered: true, attended: true, certified: true, date: '2025-12-20' },
      { eventId: 'EVT026', eventType: eventTypes.SEMINAR, registered: true, attended: true, certified: true, date: '2026-01-15' },
      { eventId: 'EVT029', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2026-01-28' },
    ]
  },
  {
    id: 'STU003',
    name: 'Amit Kumar',
    email: 'amit.kumar@example.com',
    department: 'Electronics',
    year: 4,
    totalRegistrations: 18,
    totalAttended: 16,
    totalCertified: 15,
    avgAttendanceRate: 0.89,
    participationHistory: [
      { eventId: 'EVT002', eventType: eventTypes.SEMINAR, registered: true, attended: true, certified: true, date: '2025-09-22' },
      { eventId: 'EVT004', eventType: eventTypes.WEBINAR, registered: true, attended: true, certified: true, date: '2025-10-05' },
      { eventId: 'EVT007', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-10-18' },
      { eventId: 'EVT010', eventType: eventTypes.HACKATHON, registered: true, attended: true, certified: true, date: '2025-11-01' },
      { eventId: 'EVT014', eventType: eventTypes.SEMINAR, registered: true, attended: false, certified: false, date: '2025-11-15' },
      { eventId: 'EVT017', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-11-28' },
      { eventId: 'EVT020', eventType: eventTypes.COMPETITION, registered: true, attended: true, certified: true, date: '2025-12-10' },
      { eventId: 'EVT024', eventType: eventTypes.WEBINAR, registered: true, attended: false, certified: false, date: '2025-12-22' },
      { eventId: 'EVT027', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2026-01-18' },
    ]
  },
  {
    id: 'STU004',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    department: 'Computer Science',
    year: 3,
    totalRegistrations: 16,
    totalAttended: 15,
    totalCertified: 14,
    avgAttendanceRate: 0.94,
    participationHistory: [
      { eventId: 'EVT001', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-09-15' },
      { eventId: 'EVT005', eventType: eventTypes.HACKATHON, registered: true, attended: true, certified: true, date: '2025-10-10' },
      { eventId: 'EVT009', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-10-28' },
      { eventId: 'EVT012', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-11-08' },
      { eventId: 'EVT016', eventType: eventTypes.CONFERENCE, registered: true, attended: true, certified: true, date: '2025-11-22' },
      { eventId: 'EVT020', eventType: eventTypes.COMPETITION, registered: true, attended: true, certified: true, date: '2025-12-10' },
      { eventId: 'EVT023', eventType: eventTypes.COMPETITION, registered: true, attended: true, certified: true, date: '2025-12-20' },
      { eventId: 'EVT027', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2026-01-18' },
    ]
  },
  {
    id: 'STU005',
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    department: 'Mechanical Engineering',
    year: 2,
    totalRegistrations: 12,
    totalAttended: 8,
    totalCertified: 7,
    avgAttendanceRate: 0.67,
    participationHistory: [
      { eventId: 'EVT003', eventType: eventTypes.COMPETITION, registered: true, attended: true, certified: true, date: '2025-09-28' },
      { eventId: 'EVT007', eventType: eventTypes.WORKSHOP, registered: true, attended: false, certified: false, date: '2025-10-18' },
      { eventId: 'EVT011', eventType: eventTypes.WEBINAR, registered: true, attended: false, certified: false, date: '2025-11-05' },
      { eventId: 'EVT015', eventType: eventTypes.COMPETITION, registered: true, attended: true, certified: true, date: '2025-11-20' },
      { eventId: 'EVT018', eventType: eventTypes.WEBINAR, registered: true, attended: true, certified: false, date: '2025-12-05' },
      { eventId: 'EVT021', eventType: eventTypes.SEMINAR, registered: true, attended: false, certified: false, date: '2025-12-15' },
      { eventId: 'EVT025', eventType: eventTypes.SEMINAR, registered: true, attended: true, certified: true, date: '2026-01-10' },
      { eventId: 'EVT029', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2026-01-28' },
    ]
  },
  {
    id: 'STU006',
    name: 'Ananya Desai',
    email: 'ananya.desai@example.com',
    department: 'Information Technology',
    year: 3,
    totalRegistrations: 15,
    totalAttended: 14,
    totalCertified: 13,
    avgAttendanceRate: 0.93,
    participationHistory: [
      { eventId: 'EVT002', eventType: eventTypes.SEMINAR, registered: true, attended: true, certified: true, date: '2025-09-22' },
      { eventId: 'EVT006', eventType: eventTypes.SEMINAR, registered: true, attended: true, certified: true, date: '2025-10-12' },
      { eventId: 'EVT010', eventType: eventTypes.HACKATHON, registered: true, attended: true, certified: true, date: '2025-11-01' },
      { eventId: 'EVT013', eventType: eventTypes.HACKATHON, registered: true, attended: true, certified: true, date: '2025-11-12' },
      { eventId: 'EVT017', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-11-28' },
      { eventId: 'EVT021', eventType: eventTypes.SEMINAR, registered: true, attended: false, certified: false, date: '2025-12-15' },
      { eventId: 'EVT024', eventType: eventTypes.WEBINAR, registered: true, attended: true, certified: true, date: '2025-12-22' },
      { eventId: 'EVT028', eventType: eventTypes.HACKATHON, registered: true, attended: true, certified: true, date: '2026-01-25' },
    ]
  },
  {
    id: 'STU007',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@example.com',
    department: 'Computer Science',
    year: 1,
    totalRegistrations: 10,
    totalAttended: 9,
    totalCertified: 8,
    avgAttendanceRate: 0.90,
    participationHistory: [
      { eventId: 'EVT012', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-11-08' },
      { eventId: 'EVT015', eventType: eventTypes.COMPETITION, registered: true, attended: true, certified: true, date: '2025-11-20' },
      { eventId: 'EVT019', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-12-08' },
      { eventId: 'EVT022', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2025-12-18' },
      { eventId: 'EVT026', eventType: eventTypes.SEMINAR, registered: true, attended: false, certified: false, date: '2026-01-15' },
      { eventId: 'EVT029', eventType: eventTypes.WORKSHOP, registered: true, attended: true, certified: true, date: '2026-01-28' },
    ]
  },
  {
    id: 'STU008',
    name: 'Kavya Nair',
    email: 'kavya.nair@example.com',
    department: 'Electronics',
    year: 2,
    totalRegistrations: 14,
    totalAttended: 11,
    totalCertified: 10,
    avgAttendanceRate: 0.79,
    participationHistory: [
      { eventId: 'EVT004', eventType: eventTypes.WEBINAR, registered: true, attended: true, certified: true, date: '2025-10-05' },
      { eventId: 'EVT008', eventType: eventTypes.CONFERENCE, registered: true, attended: true, certified: true, date: '2025-10-25' },
      { eventId: 'EVT011', eventType: eventTypes.WEBINAR, registered: true, attended: false, certified: false, date: '2025-11-05' },
      { eventId: 'EVT014', eventType: eventTypes.SEMINAR, registered: true, attended: true, certified: true, date: '2025-11-15' },
      { eventId: 'EVT018', eventType: eventTypes.WEBINAR, registered: true, attended: false, certified: false, date: '2025-12-05' },
      { eventId: 'EVT021', eventType: eventTypes.SEMINAR, registered: true, attended: true, certified: true, date: '2025-12-15' },
      { eventId: 'EVT025', eventType: eventTypes.SEMINAR, registered: true, attended: false, certified: false, date: '2026-01-10' },
      { eventId: 'EVT028', eventType: eventTypes.HACKATHON, registered: true, attended: true, certified: true, date: '2026-01-25' },
    ]
  }
];

// Event data with participation metrics
export const events = [
  {
    id: 'EVT001',
    name: 'React Fundamentals Workshop',
    type: eventTypes.WORKSHOP,
    date: '2025-09-15',
    registered: 45,
    attended: 38,
    certified: 35,
    attendanceRate: 0.84
  },
  {
    id: 'EVT002',
    name: 'AI in Healthcare Seminar',
    type: eventTypes.SEMINAR,
    date: '2025-09-22',
    registered: 60,
    attended: 42,
    certified: 40,
    attendanceRate: 0.70
  },
  {
    id: 'EVT003',
    name: 'Code Sprint Competition',
    type: eventTypes.COMPETITION,
    date: '2025-09-28',
    registered: 32,
    attended: 30,
    certified: 28,
    attendanceRate: 0.94
  },
  {
    id: 'EVT004',
    name: 'Cloud Computing Webinar',
    type: eventTypes.WEBINAR,
    date: '2025-10-05',
    registered: 80,
    attended: 48,
    certified: 45,
    attendanceRate: 0.60
  },
  {
    id: 'EVT005',
    name: '24-Hour Hackathon',
    type: eventTypes.HACKATHON,
    date: '2025-10-10',
    registered: 50,
    attended: 46,
    certified: 42,
    attendanceRate: 0.92
  },
  {
    id: 'EVT006',
    name: 'Cybersecurity Basics Seminar',
    type: eventTypes.SEMINAR,
    date: '2025-10-12',
    registered: 55,
    attended: 40,
    certified: 38,
    attendanceRate: 0.73
  },
  {
    id: 'EVT007',
    name: 'Python for Data Science Workshop',
    type: eventTypes.WORKSHOP,
    date: '2025-10-18',
    registered: 48,
    attended: 42,
    certified: 40,
    attendanceRate: 0.88
  },
  {
    id: 'EVT008',
    name: 'Tech Leadership Conference',
    type: eventTypes.CONFERENCE,
    date: '2025-10-25',
    registered: 70,
    attended: 55,
    certified: 52,
    attendanceRate: 0.79
  },
  {
    id: 'EVT009',
    name: 'Mobile App Development Workshop',
    type: eventTypes.WORKSHOP,
    date: '2025-10-28',
    registered: 42,
    attended: 36,
    certified: 34,
    attendanceRate: 0.86
  },
  {
    id: 'EVT010',
    name: 'Innovation Hackathon',
    type: eventTypes.HACKATHON,
    date: '2025-11-01',
    registered: 55,
    attended: 50,
    certified: 48,
    attendanceRate: 0.91
  },
  {
    id: 'EVT011',
    name: 'DevOps Best Practices Webinar',
    type: eventTypes.WEBINAR,
    date: '2025-11-05',
    registered: 65,
    attended: 38,
    certified: 35,
    attendanceRate: 0.58
  },
  {
    id: 'EVT012',
    name: 'UI/UX Design Workshop',
    type: eventTypes.WORKSHOP,
    date: '2025-11-08',
    registered: 50,
    attended: 44,
    certified: 42,
    attendanceRate: 0.88
  },
  {
    id: 'EVT013',
    name: 'AI/ML Hackathon',
    type: eventTypes.HACKATHON,
    date: '2025-11-12',
    registered: 48,
    attended: 44,
    certified: 42,
    attendanceRate: 0.92
  },
  {
    id: 'EVT014',
    name: 'Blockchain Technology Seminar',
    type: eventTypes.SEMINAR,
    date: '2025-11-15',
    registered: 58,
    attended: 42,
    certified: 40,
    attendanceRate: 0.72
  },
  {
    id: 'EVT015',
    name: 'Coding Championship',
    type: eventTypes.COMPETITION,
    date: '2025-11-20',
    registered: 35,
    attended: 33,
    certified: 32,
    attendanceRate: 0.94
  },
  {
    id: 'EVT016',
    name: 'Future of Tech Conference',
    type: eventTypes.CONFERENCE,
    date: '2025-11-22',
    registered: 75,
    attended: 58,
    certified: 55,
    attendanceRate: 0.77
  },
  {
    id: 'EVT017',
    name: 'Full Stack Development Workshop',
    type: eventTypes.WORKSHOP,
    date: '2025-11-28',
    registered: 46,
    attended: 40,
    certified: 38,
    attendanceRate: 0.87
  },
  {
    id: 'EVT018',
    name: 'Microservices Architecture Webinar',
    type: eventTypes.WEBINAR,
    date: '2025-12-05',
    registered: 72,
    attended: 44,
    certified: 40,
    attendanceRate: 0.61
  },
  {
    id: 'EVT019',
    name: 'Git & GitHub Workshop',
    type: eventTypes.WORKSHOP,
    date: '2025-12-08',
    registered: 52,
    attended: 46,
    certified: 44,
    attendanceRate: 0.88
  },
  {
    id: 'EVT020',
    name: 'Algorithm Design Competition',
    type: eventTypes.COMPETITION,
    date: '2025-12-10',
    registered: 38,
    attended: 36,
    certified: 34,
    attendanceRate: 0.95
  },
  {
    id: 'EVT021',
    name: 'IoT Applications Seminar',
    type: eventTypes.SEMINAR,
    date: '2025-12-15',
    registered: 62,
    attended: 45,
    certified: 42,
    attendanceRate: 0.73
  },
  {
    id: 'EVT022',
    name: 'Docker & Kubernetes Workshop',
    type: eventTypes.WORKSHOP,
    date: '2025-12-18',
    registered: 44,
    attended: 38,
    certified: 36,
    attendanceRate: 0.86
  },
  {
    id: 'EVT023',
    name: 'Web Development Competition',
    type: eventTypes.COMPETITION,
    date: '2025-12-20',
    registered: 40,
    attended: 38,
    certified: 36,
    attendanceRate: 0.95
  },
  {
    id: 'EVT024',
    name: 'GraphQL & APIs Webinar',
    type: eventTypes.WEBINAR,
    date: '2025-12-22',
    registered: 68,
    attended: 42,
    certified: 38,
    attendanceRate: 0.62
  },
  {
    id: 'EVT025',
    name: 'Career Development Seminar',
    type: eventTypes.SEMINAR,
    date: '2026-01-10',
    registered: 64,
    attended: 48,
    certified: 45,
    attendanceRate: 0.75
  },
  {
    id: 'EVT026',
    name: 'System Design Seminar',
    type: eventTypes.SEMINAR,
    date: '2026-01-15',
    registered: 56,
    attended: 42,
    certified: 40,
    attendanceRate: 0.75
  },
  {
    id: 'EVT027',
    name: 'Testing & QA Workshop',
    type: eventTypes.WORKSHOP,
    date: '2026-01-18',
    registered: 48,
    attended: 42,
    certified: 40,
    attendanceRate: 0.88
  },
  {
    id: 'EVT028',
    name: 'Startup Hackathon',
    type: eventTypes.HACKATHON,
    date: '2026-01-25',
    registered: 52,
    attended: 48,
    certified: 46,
    attendanceRate: 0.92
  },
  {
    id: 'EVT029',
    name: 'Advanced JavaScript Workshop',
    type: eventTypes.WORKSHOP,
    date: '2026-01-28',
    registered: 50,
    attended: 44,
    certified: 42,
    attendanceRate: 0.88
  }
];

// Monthly aggregated stats (September 2025 - January 2026)
export const monthlyStats = [
  {
    month: 'Sep 2025',
    totalEvents: 3,
    totalRegistrations: 137,
    totalAttendance: 110,
    attendanceRate: 0.80,
    certified: 103
  },
  {
    month: 'Oct 2025',
    totalEvents: 7,
    totalRegistrations: 400,
    totalAttendance: 317,
    attendanceRate: 0.79,
    certified: 299
  },
  {
    month: 'Nov 2025',
    totalEvents: 8,
    totalRegistrations: 415,
    totalAttendance: 349,
    attendanceRate: 0.84,
    certified: 331
  },
  {
    month: 'Dec 2025',
    totalEvents: 7,
    totalRegistrations: 376,
    totalAttendance: 295,
    attendanceRate: 0.78,
    certified: 274
  },
  {
    month: 'Jan 2026',
    totalEvents: 4,
    totalRegistrations: 220,
    totalAttendance: 182,
    attendanceRate: 0.83,
    certified: 173
  }
];

// Calculate event type statistics
export const calculateEventTypeStats = () => {
  const stats = {};
  
  Object.values(eventTypes).forEach(type => {
    const typeEvents = events.filter(e => e.type === type);
    const totalRegistered = typeEvents.reduce((sum, e) => sum + e.registered, 0);
    const totalAttended = typeEvents.reduce((sum, e) => sum + e.attended, 0);
    
    stats[type] = {
      eventCount: typeEvents.length,
      totalRegistered,
      totalAttended,
      attendanceRate: totalRegistered > 0 ? (totalAttended / totalRegistered) : 0,
      noShowRate: totalRegistered > 0 ? (1 - (totalAttended / totalRegistered)) : 0
    };
  });
  
  return stats;
};

// Calculate top contributors
export const getTopContributors = (limit = 5) => {
  return [...students]
    .sort((a, b) => b.totalCertified - a.totalCertified)
    .slice(0, limit)
    .map((student, index) => ({
      rank: index + 1,
      ...student
    }));
};

// Get student by ID
export const getStudentById = (studentId) => {
  return students.find(s => s.id === studentId);
};

// Get upcoming events (dummy future events for prediction testing)
export const upcomingEvents = [
  {
    id: 'EVT030',
    name: 'React Workshop',
    type: eventTypes.WORKSHOP,
    date: '2026-02-20',
    daysUntilEvent: 5,
    registered: 45
  },
  {
    id: 'EVT031',
    name: 'AI Seminar',
    type: eventTypes.SEMINAR,
    date: '2026-02-28',
    daysUntilEvent: 13,
    registered: 60
  },
  {
    id: 'EVT032',
    name: 'Mega Hackathon',
    type: eventTypes.HACKATHON,
    date: '2026-03-15',
    daysUntilEvent: 28,
    registered: 80
  },
  {
    id: 'EVT033',
    name: 'Quick Webinar',
    type: eventTypes.WEBINAR,
    date: '2026-02-17',
    daysUntilEvent: 2,
    registered: 70
  }
];

export default {
  students,
  events,
  monthlyStats,
  eventTypes,
  eventTypeNoShowRates,
  calculateEventTypeStats,
  getTopContributors,
  getStudentById,
  upcomingEvents
};
