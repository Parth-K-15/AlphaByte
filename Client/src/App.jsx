import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
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
      </Routes>
    </Router>
  );
}

export default App;
