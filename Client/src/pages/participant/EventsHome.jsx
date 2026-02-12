import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  Clock,
  MapPin,
  Star,
  Search,
  Plus,
  Target,
  Award,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  BookOpen,
  Zap,
  CheckCircle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api";

const EventsHome = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userStats, setUserStats] = useState({
    eventsAttended: 24,
    certificatesEarned: 18,
    learningGoal: 30,
    attendanceScore: 92,
  });

  useEffect(() => {
    fetchEvents();
  }, [search, statusFilter, typeFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (typeFilter) params.append("type", typeFilter);

      const response = await fetch(`${API_BASE}/participant/events?${params}`);
      const data = await response.json();

      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([
        {
          _id: "1",
          title: "Tech Conference 2024",
          status: "upcoming",
          type: "Online",
          startDate: "2024-03-15",
          registrationFee: 0,
          spotsLeft: 50,
        },
        {
          _id: "2",
          title: "Professional Development Workshop",
          status: "ongoing",
          type: "Offline",
          startDate: "2024-03-10",
          registrationFee: 500,
          spotsLeft: 15,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["M", "T", "W", "T", "F", "S", "S"];

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBA";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: "bg-lime text-dark",
      ongoing: "bg-dark text-white",
      completed: "bg-light-400 text-dark-300",
    };
    return badges[status] || "bg-light-400 text-dark-300";
  };

  return (
    <div className="min-h-screen p-2 md:p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark mb-1">
            Hi, Amanda! 👋
          </h1>
          <p className="text-dark-300 text-sm md:text-base">
            Let's take a look at your learning journey today
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-200"
              size={16}
            />
            <input
              type="text"
              placeholder="Search for events"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-light-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-lime w-full md:w-64 text-dark placeholder:text-dark-200"
            />
          </div>
          <button className="bg-dark text-lime px-4 py-2.5 rounded-xl text-sm font-bold hover:shadow-card-hover transition-all duration-300 flex items-center gap-2">
            <Plus size={16} />
            Join Event
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Events Attended",
            value: userStats.eventsAttended,
            icon: CheckCircle,
            variant: "dark",
          },
          {
            label: "Certificates",
            value: userStats.certificatesEarned,
            icon: Award,
            variant: "lime",
          },
          {
            label: "Learning Goal",
            value: `${userStats.eventsAttended}/${userStats.learningGoal}`,
            icon: Target,
            variant: "white",
          },
          {
            label: "Attendance Score",
            value: `${userStats.attendanceScore}%`,
            icon: TrendingUp,
            variant: "dark",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`rounded-3xl p-5 transition-all duration-300 hover:scale-[1.02] ${
              stat.variant === "dark"
                ? "bg-dark text-white"
                : stat.variant === "lime"
                  ? "bg-lime text-dark"
                  : "bg-white text-dark border border-light-400/50 shadow-card"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`p-2 rounded-xl ${
                  stat.variant === "dark"
                    ? "bg-lime/15"
                    : stat.variant === "lime"
                      ? "bg-dark/10"
                      : "bg-light-300"
                }`}
              >
                <stat.icon
                  size={18}
                  className={
                    stat.variant === "dark"
                      ? "text-lime"
                      : stat.variant === "lime"
                        ? "text-dark"
                        : "text-dark-300"
                  }
                />
              </div>
              <ArrowUpRight
                size={16}
                className={
                  stat.variant === "dark"
                    ? "text-dark-200"
                    : stat.variant === "lime"
                      ? "text-dark/40"
                      : "text-dark-200"
                }
              />
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div
              className={`text-xs font-medium ${
                stat.variant === "dark"
                  ? "text-dark-200"
                  : stat.variant === "lime"
                    ? "text-dark/60"
                    : "text-dark-200"
              }`}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Learning Progress Card */}
        <div className="lg:col-span-2 bg-dark rounded-3xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white text-base font-bold mb-1">
                  Your Learning Progress
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-lime rounded-full"></div>
                  <span className="text-xs text-dark-200 font-medium">
                    Current attendance
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {userStats.eventsAttended}
                </div>
                <div className="text-xs text-dark-200">Events</div>
              </div>
            </div>

            {/* Circular Progress */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg
                  className="w-32 h-32 transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#B9FF66"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${userStats.attendanceScore * 2.83} 283`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-white">
                    {userStats.attendanceScore}%
                  </div>
                  <div className="text-xs text-dark-200">Score</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-1 bg-lime rounded-full"></div>
                  <span className="text-xs text-dark-200">Events joined</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {userStats.eventsAttended}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-1 bg-lime/60 rounded-full"></div>
                  <span className="text-xs text-dark-200">Certificates</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {userStats.certificatesEarned}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-1 bg-lime/30 rounded-full"></div>
                  <span className="text-xs text-dark-200">This month</span>
                </div>
                <div className="text-lg font-bold text-white">8</div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-lime/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-lime/5 rounded-full blur-2xl"></div>
        </div>

        {/* Calendar Widget */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-light-400/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-dark font-bold">Your Event Days</h3>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={previousMonth}
                className="p-1.5 hover:bg-light-300 rounded-lg transition-colors"
              >
                <ChevronLeft size={16} className="text-dark" />
              </button>
              <h4 className="font-bold text-dark text-sm">
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </h4>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-light-300 rounded-lg transition-colors"
              >
                <ChevronRight size={16} className="text-dark" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day, i) => (
                <div
                  key={i}
                  className="text-center text-xs text-dark-200 p-1.5 font-medium"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <div key={`empty-${i}`} className="p-1.5"></div>
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday =
                  today.getDate() === day &&
                  today.getMonth() === currentMonth.getMonth() &&
                  today.getFullYear() === currentMonth.getFullYear();
                const hasEvent = [8, 15, 22, 28].includes(day);

                return (
                  <button
                    key={day}
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth(),
                          day,
                        ),
                      )
                    }
                    className={`p-1.5 text-xs rounded-lg transition-all font-medium ${
                      isToday
                        ? "bg-lime text-dark font-bold"
                        : hasEvent
                          ? "bg-dark text-white"
                          : "text-dark-300 hover:bg-light-300"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-light-400">
            <div className="flex items-center justify-between text-xs">
              <span className="text-dark-300">Current day</span>
              <span className="w-3 h-3 bg-lime rounded-full"></span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-dark-300">Event days</span>
              <span className="w-3 h-3 bg-dark rounded-full"></span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Learning Goal */}
        <div className="bg-lime rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-dark">Learning Goal</h3>
            <div className="text-xs text-dark/60 font-medium">
              Goal: {userStats.learningGoal}
            </div>
          </div>
          <div className="text-center py-4">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg
                className="w-24 h-24 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="rgba(25,26,35,0.1)"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#191A23"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${(userStats.eventsAttended / userStats.learningGoal) * 283} 283`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xl font-bold text-dark">
                  {userStats.eventsAttended}
                </div>
                <div className="text-xs text-dark/60">
                  of {userStats.learningGoal}
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 text-sm font-bold text-dark hover:text-dark/70 transition-colors mx-auto">
              Change Goal <Target size={14} />
            </button>
          </div>
        </div>

        {/* Recent Learning */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-card border border-light-400/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-dark">My Learning Activity</h3>
            <button className="text-sm font-bold text-dark bg-light-300 hover:bg-light-400 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors">
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {[
              {
                name: "Web Development Bootcamp",
                instructor: "Sarah Wilson",
                progress: "8/10",
                completion: 80,
                avatar: "💻",
                variant: "dark",
              },
              {
                name: "Data Science Workshop",
                instructor: "Michael Chen",
                progress: "6/8",
                completion: 75,
                avatar: "📊",
                variant: "lime",
              },
              {
                name: "UI/UX Design Masterclass",
                instructor: "Lisa Anderson",
                progress: "4/6",
                completion: 67,
                avatar: "🎨",
                variant: "dark",
              },
              {
                name: "Machine Learning Basics",
                instructor: "David Kumar",
                progress: "3/5",
                completion: 60,
                avatar: "🤖",
                variant: "lime",
              },
            ].map((course, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01] ${
                  course.variant === "dark"
                    ? "bg-dark text-white"
                    : "bg-lime/20 text-dark"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`text-lg w-10 h-10 flex items-center justify-center rounded-xl ${
                      course.variant === "dark" ? "bg-lime/15" : "bg-dark/10"
                    }`}
                  >
                    {course.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{course.name}</div>
                    <div
                      className={`text-xs ${course.variant === "dark" ? "text-dark-200" : "text-dark/60"}`}
                    >
                      Instructor: {course.instructor}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xs mb-2 ${course.variant === "dark" ? "text-dark-200" : "text-dark/60"}`}
                  >
                    Completed: {course.progress}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-20 h-1.5 rounded-full overflow-hidden ${
                        course.variant === "dark" ? "bg-white/10" : "bg-dark/10"
                      }`}
                    >
                      <div
                        className={`h-full rounded-full ${
                          course.variant === "dark" ? "bg-lime" : "bg-dark"
                        }`}
                        style={{ width: `${course.completion}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-light-400/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-dark">Upcoming Events</h3>
            <Link
              to="/participant/calendar"
              className="text-sm font-bold text-dark bg-lime hover:bg-lime-400 px-3 py-1.5 rounded-xl transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {events.slice(0, 3).map((event, index) => {
              const variants = ["dark", "lime", "white"];
              const variant = variants[index % 3];

              const eventDate = event.startDate
                ? new Date(event.startDate)
                : null;
              const daysLeft = eventDate
                ? Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <Link
                  key={event._id}
                  to={`/participant/event/${event._id}`}
                  className="block group"
                >
                  <div
                    className={`rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] ${
                      variant === "dark"
                        ? "bg-dark text-white"
                        : variant === "lime"
                          ? "bg-lime text-dark"
                          : "bg-light-300 text-dark"
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          variant === "dark"
                            ? "bg-lime text-dark"
                            : variant === "lime"
                              ? "bg-dark text-white"
                              : "bg-dark text-white"
                        }`}
                      >
                        {event.status}
                      </span>
                      {daysLeft && daysLeft > 0 && (
                        <span
                          className={`text-xs font-bold ${
                            variant === "dark"
                              ? "text-dark-200"
                              : variant === "lime"
                                ? "text-dark/60"
                                : "text-dark-300"
                          }`}
                        >
                          {daysLeft} days left
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-lg mb-2 leading-tight">
                      {event.title}
                    </h3>

                    {/* Details */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} />
                          <span>{event.type || "Online"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-1 font-bold text-sm ${
                          variant === "dark"
                            ? "text-lime"
                            : variant === "lime"
                              ? "text-dark"
                              : "text-dark"
                        }`}
                      >
                        {event.registrationFee > 0
                          ? `₹${event.registrationFee}`
                          : "FREE"}
                        <ArrowUpRight
                          size={16}
                          className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-dark rounded-3xl p-6">
          <h3 className="font-bold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                name: "Scan QR",
                icon: CheckCircle,
                variant: "lime",
                path: "/participant/qr-scanner",
              },
              {
                name: "My Events",
                icon: Calendar,
                variant: "white",
                path: "/participant/registrations",
              },
              {
                name: "Certificates",
                icon: Award,
                variant: "white",
                path: "/participant/certificates",
              },
              {
                name: "Profile",
                icon: Users,
                variant: "lime",
                path: "/participant/profile",
              },
            ].map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-300 hover:scale-105 group ${
                  action.variant === "lime"
                    ? "bg-lime text-dark hover:shadow-lime"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <action.icon size={24} />
                <span className="text-xs font-bold">{action.name}</span>
              </Link>
            ))}
          </div>

          <div className="mt-5 p-4 bg-lime/10 rounded-2xl border border-lime/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Learning Streak
                </h4>
                <p className="text-xs text-dark-200 mt-1">
                  Keep up the great work!
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-lime">12</div>
                <div className="text-xs text-dark-200">days</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsHome;
