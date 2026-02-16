import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import OrganizerLayout from "./layouts/OrganizerLayout";
import ParticipantLayout from "./layouts/ParticipantLayout";
import SpeakerLayout from "./layouts/SpeakerLayout";
import { SignIn, SignUp, Landing, AdminSignIn, SpeakerAuth } from "./pages/auth";
import {
  Dashboard,
  Events,
  CreateEvent,
  EventDetails as AdminEventDetails,
  EventLifecycle,
  TeamLeads,
  Members,
  Permissions,
  TeamManagement,
  EventTeamDetails,
  AccessControl,
  Reports,
  Settings,
  Logs,
} from "./pages/admin";
import {
  Dashboard as OrganizerDashboard,
  MyEvents,
  EventDetails,
  Participants,
  AttendanceQR,
  Communication,
  Certificates,
  TeamAccess,
  Logs as OrganizerLogs,
  Speakers as OrganizerSpeakers,
  SpeakerProfile as OrganizerSpeakerProfile,
  SessionAssignment,
  RoleHistory,
} from "./pages/organizer";
import {
  EventsHome,
  EventDetails as ParticipantEventDetails,
  MyRegistrations,
  QRScanner,
  Certificates as ParticipantCertificates,
  History,
  Profile,
  Calendar,
  Transcript,
} from "./pages/participant";
import AIParticipationTest from './pages/ai-intelligence-test/AIParticipationTest';
import ChatbotTest from './pages/chatbot-test/ChatbotTest';
import {
  Dashboard as SpeakerDashboard,
  Sessions as SpeakerSessions,
  SessionDetail as SpeakerSessionDetail,
  Profile as SpeakerProfile,
  Materials as SpeakerMaterials,
  Analytics as SpeakerAnalytics,
} from "./pages/speaker";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Landing Page */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              }
            />

            {/* Auth Routes - Public */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <SignIn />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              }
            />
            <Route
              path="/admin-auth"
              element={
                <PublicRoute>
                  <AdminSignIn />
                </PublicRoute>
              }
            />
            <Route
              path="/speaker-auth"
              element={
                <PublicRoute>
                  <SpeakerAuth />
                </PublicRoute>
              }
            />

            {/* Admin Routes - Protected */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Events Management */}
              <Route path="events" element={<Events />} />
              <Route path="events/create" element={<CreateEvent />} />
              <Route path="events/:id" element={<AdminEventDetails />} />
              <Route path="events/:id/edit" element={<CreateEvent />} />
              <Route path="events/lifecycle" element={<EventLifecycle />} />
              <Route path="events/:id/lifecycle" element={<EventLifecycle />} />

              {/* Team Management */}
              <Route path="team" element={<TeamManagement />} />
              <Route
                path="team/events/:eventId"
                element={<EventTeamDetails />}
              />
              <Route path="team/leads" element={<TeamLeads />} />
              <Route path="team/members" element={<Members />} />
              <Route path="team/permissions" element={<Permissions />} />

              {/* Access Control */}
              <Route path="access" element={<AccessControl />} />
              <Route path="access/restrict" element={<AccessControl />} />
              <Route path="access/suspended" element={<AccessControl />} />

              {/* Analytics & Reports */}
              <Route path="reports" element={<Reports />} />

              {/* AI Participation Intelligence (Test/Demo) */}
              <Route path="ai-test" element={<AIParticipationTest />} />

              {/* System Logs */}
              <Route path="logs" element={<Logs />} />

              {/* Settings */}
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Organizer Routes - Protected */}
            <Route
              path="/organizer"
              element={
                <ProtectedRoute allowedRoles={["TEAM_LEAD", "EVENT_STAFF"]}>
                  <OrganizerLayout />
                </ProtectedRoute>
              }
            >
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
              <Route
                path="communication/announcements"
                element={<Communication />}
              />

              {/* Certificates */}
              <Route path="certificates/generate" element={<Certificates />} />
              <Route
                path="certificates/distribution"
                element={<Certificates />}
              />

              {/* Logs & Audit Trail */}
              <Route path="logs" element={<OrganizerLogs />} />

              {/* Team Access (Team Lead Only) */}
              <Route path="team" element={<TeamAccess />} />

              {/* Speaker Management */}
              <Route path="speakers" element={<OrganizerSpeakers />} />
              <Route path="speakers/:id" element={<OrganizerSpeakerProfile />} />
              <Route path="sessions/assign" element={<SessionAssignment />} />

              {/* Role History */}
              <Route path="role-history" element={<RoleHistory />} />
            </Route>

            {/* Participant Routes - Protected */}
            <Route
              path="/participant"
              element={
                <ProtectedRoute allowedRoles={["PARTICIPANT"]}>
                  <ParticipantLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<EventsHome />} />

              {/* Event Discovery */}
              <Route
                path="event/:eventId"
                element={<ParticipantEventDetails />}
              />

              {/* Calendar */}
              <Route path="calendar" element={<Calendar />} />

              {/* My Registrations */}
              <Route path="registrations" element={<MyRegistrations />} />

              {/* QR Scanner for Attendance */}
              <Route path="scan" element={<QRScanner />} />

              {/* History */}
              <Route path="history" element={<History />} />

              {/* Certificates */}
              <Route
                path="certificates"
                element={<ParticipantCertificates />}
              />

              {/* Profile */}
              <Route path="profile" element={<Profile />} />

              {/* Transcript */}
              <Route path="transcript" element={<Transcript />} />

              {/* AI Chatbot Test */}
              <Route path="chatbot-test" element={<ChatbotTest />} />
            </Route>

            {/* Speaker Routes - Protected */}
            <Route
              path="/speaker"
              element={
                <ProtectedRoute allowedRoles={["SPEAKER"]}>
                  <SpeakerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SpeakerDashboard />} />
              <Route path="sessions" element={<SpeakerSessions />} />
              <Route path="sessions/:id" element={<SpeakerSessionDetail />} />
              <Route path="profile" element={<SpeakerProfile />} />
              <Route path="materials" element={<SpeakerMaterials />} />
              <Route path="analytics" element={<SpeakerAnalytics />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
