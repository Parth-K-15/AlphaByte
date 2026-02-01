import express from 'express';
const router = express.Router();

import {
  getDashboardStats,
  getAssignedEvents,
  getEventDetails,
  updateEventInfo
} from '../controllers/organizerController.js';

import {
  generateQRCode,
  markAttendance,
  getAttendanceLogs,
  getLiveAttendanceCount,
  markManualAttendance
} from '../controllers/attendanceController.js';

import {
  generateCertificates,
  sendCertificates,
  getCertificateLogs,
  resendCertificate
} from '../controllers/certificateController.js';

import {
  getParticipants,
  addParticipant,
  removeParticipant,
  updateParticipant
} from '../controllers/participantController.js';

import {
  getEventUpdates,
  createEventUpdate,
  deleteEventUpdate,
  togglePinUpdate
} from '../controllers/eventUpdateController.js';

import {
  sendEmail,
  getCommunicationHistory,
  createAnnouncement,
  getEmailTemplates
} from '../controllers/communicationController.js';

import {
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberPermissions
} from '../controllers/teamAccessController.js';

// Dashboard
router.get('/dashboard', getDashboardStats);

// Events
router.get('/events', getAssignedEvents);
router.get('/events/:id', getEventDetails);
router.put('/events/:id', updateEventInfo);

// Participants
router.get('/participants/:eventId', getParticipants);
router.post('/participants/:eventId', addParticipant);
router.put('/participants/:eventId/:participantId', updateParticipant);
router.delete('/participants/:eventId/:participantId', removeParticipant);

// Attendance
router.post('/attendance/:eventId/generate-qr', generateQRCode);
router.post('/attendance/mark', markAttendance);
router.post('/attendance/:eventId/manual/:participantId', markManualAttendance);
router.get('/attendance/:eventId', getAttendanceLogs);
router.get('/attendance/:eventId/live', getLiveAttendanceCount);

// Certificates
router.post('/certificates/:eventId/generate', generateCertificates);
router.post('/certificates/:eventId/send', sendCertificates);
router.get('/certificates/:eventId', getCertificateLogs);
router.post('/certificates/:certificateId/resend', resendCertificate);

// Event Updates / Timeline
router.get('/updates/:eventId', getEventUpdates);
router.post('/updates', createEventUpdate);
router.delete('/updates/:updateId', deleteEventUpdate);
router.patch('/updates/:updateId/pin', togglePinUpdate);

// Communication
router.get('/communication/templates', getEmailTemplates);
router.get('/communication/:eventId', getCommunicationHistory);
router.post('/communication/email', sendEmail);
router.post('/communication/announcement', createAnnouncement);

// Team Access (Team Lead Only)
router.get('/team/:eventId', getTeamMembers);
router.post('/team/:eventId', addTeamMember);
router.delete('/team/:eventId/:memberId', removeTeamMember);
router.put('/team/:eventId/:memberId/permissions', updateTeamMemberPermissions);

export default router;
