import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import OrganizerLayout from './layouts/OrganizerLayout';
import {
  Dashboard,
  Events,
  CreateEvent,
  EventLifecycle,
  TeamLeads,
  Members,
  Permissions,
  AccessControl,
  Reports,
  Settings,
} from './pages/admin';
import {
  Dashboard as OrganizerDashboard,
  MyEvents,
  EventDetails,
  Participants,
  AttendanceQR,
  Communication,
  Certificates,
  TeamAccess,
} from './pages/organizer';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to admin dashboard */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Events Management */}
          <Route path="events" element={<Events />} />
          <Route path="events/create" element={<CreateEvent />} />
          <Route path="events/lifecycle" element={<EventLifecycle />} />
          <Route path="events/:id/lifecycle" element={<EventLifecycle />} />
          
          {/* Team Management */}
          <Route path="team/leads" element={<TeamLeads />} />
          <Route path="team/members" element={<Members />} />
          <Route path="team/permissions" element={<Permissions />} />
          
          {/* Access Control */}
          <Route path="access" element={<AccessControl />} />
          <Route path="access/restrict" element={<AccessControl />} />
          <Route path="access/suspended" element={<AccessControl />} />
          
          {/* Analytics & Reports */}
          <Route path="reports" element={<Reports />} />
          
          {/* Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Organizer Routes */}
        <Route path="/organizer" element={<OrganizerLayout />}>
          <Route index element={<OrganizerDashboard />} />
          
          {/* My Events */}
          <Route path="events" element={<MyEvents />} />
          <Route path="events/:eventId" element={<EventDetails />} />
          <Route path="events/details" element={<EventDetails />} />
          <Route path="events/updates" element={<EventDetails />} />
          
          {/* Participants */}
          <Route path="participants" element={<Participants />} />
          
          {/* Attendance */}
          <Route path="attendance/qr" element={<AttendanceQR />} />
          <Route path="attendance/log" element={<AttendanceQR />} />
          
          {/* Communication */}
          <Route path="communication/email" element={<Communication />} />
          <Route path="communication/announcements" element={<Communication />} />
          
          {/* Certificates */}
          <Route path="certificates/generate" element={<Certificates />} />
          <Route path="certificates/distribution" element={<Certificates />} />
          
          {/* Team Access (Team Lead Only) */}
          <Route path="team" element={<TeamAccess />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
