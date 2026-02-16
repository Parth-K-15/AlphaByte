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
import { SignIn, SignUp, Landing, AdminSignIn } from "./pages/auth";
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
  FinanceDashboard as AdminFinanceDashboard,
  BudgetApproval,
  ExpenseDetail,
  FinancialReports,
  AmendmentReview,
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
  FinanceDashboard as OrganizerFinanceDashboard,
  BudgetRequest,
  ExpenseLog,
  BudgetAmendment,
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
} from "./pages/participant";

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

              {/* Finance */}
              <Route path="finance/budgets" element={<AdminFinanceDashboard />} />
              <Route
                path="finance/budgets/:eventId"
                element={<BudgetApproval />}
              />
              <Route
                path="finance/expenses/:expenseId"
                element={<ExpenseDetail />}
              />
              <Route
                path="finance/reports"
                element={<FinancialReports />}
              />
              <Route
                path="finance/amendments/:eventId/:amendmentId"
                element={<AmendmentReview />}
              />

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

              {/* Team Access (Team Lead Only) */}
              <Route path="team" element={<TeamAccess />} />

              {/* Finance Routes */}
              <Route
                path="events/:eventId/finance"
                element={<OrganizerFinanceDashboard />}
              />
              <Route
                path="events/:eventId/finance/request"
                element={<BudgetRequest />}
              />
              <Route
                path="events/:eventId/finance/expense"
                element={<ExpenseLog />}
              />
              <Route
                path="events/:eventId/finance/amendment"
                element={<BudgetAmendment />}
              />
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
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
