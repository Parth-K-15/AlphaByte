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
  const [userProfile, setUserProfile] = useState(null);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [eventDates, setEventDates] = useState([]);
  const [userStats, setUserStats] = useState({
    eventsAttended: 0,
    certificatesEarned: 0,
    learningGoal: 30,
    attendanceScore: 0,
    currentMonthEvents: 0,
    learningStreak: 0,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [search, statusFilter, typeFilter]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Fetch user profile
      const profileResponse = await fetch(`${API_BASE}/participant/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const profileData = await profileResponse.json();

      if (profileData.success) {
        setUserProfile(profileData.data);

        // Fetch user's registered events
        if (profileData.data.email) {
          const registrationsResponse = await fetch(
            `${API_BASE}/participant/my-events?email=${encodeURIComponent(profileData.data.email)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );
          const registrationsData = await registrationsResponse.json();

          if (registrationsData.success) {
            setMyRegistrations(registrationsData.data);

            // Calculate stats from registrations
            const confirmedRegistrations = registrationsData.data.filter(
              (reg) => reg.registrationStatus === "CONFIRMED",
            );

            const certificatesCount = registrationsData.data.filter(
              (reg) =>
                reg.certificate &&
                (reg.certificate.status === "ISSUED" ||
                  reg.certificate.status === "SENT" ||
                  reg.certificate.status === "GENERATED"),
            ).length;

            const currentDate = new Date();
            const currentMonthRegs = registrationsData.data.filter((reg) => {
              if (!reg.event?.startDate) return false;
              const eventDate = new Date(reg.event.startDate);
              return (
                eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear()
              );
            }).length;

            // Calculate attendance score
            const attendedCount = registrationsData.data.filter(
              (reg) => reg.attendanceStatus === "ATTENDED",
            ).length;
            const attendanceScore =
              registrationsData.data.length > 0
                ? Math.round(
                    (attendedCount / registrationsData.data.length) * 100,
                  )
                : 0;

            // Extract event dates for calendar (current month)
            const dates = registrationsData.data
              .filter((reg) => {
                if (!reg.event?.startDate) return false;
                const d = new Date(reg.event.startDate);
                return (
                  d.getMonth() === currentMonth.getMonth() &&
                  d.getFullYear() === currentMonth.getFullYear()
                );
              })
              .map((reg) => new Date(reg.event.startDate).getDate());
            setEventDates(dates);

            // Calculate learning streak (events in past 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentEvents = registrationsData.data.filter((reg) => {
              if (!reg.event?.startDate) return false;
              const eventDate = new Date(reg.event.startDate);
              return eventDate >= thirtyDaysAgo && eventDate <= currentDate;
            });
            const learningStreak = recentEvents.length;

            setUserStats({
              eventsAttended: attendedCount,
              certificatesEarned: certificatesCount,
              learningGoal: 30,
              attendanceScore,
              currentMonthEvents: currentMonthRegs,
              learningStreak,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

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
          <h1 className="text-2xl md:text-3xl font-bold text-dark dark:text-white mb-1">
            Hi, {userProfile?.name || "there"}! 👋
          </h1>
          <p className="text-dark-300 dark:text-zinc-400 text-sm md:text-base">
            Let's take a look at your learning journey today
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-200 dark:text-zinc-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search for events"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-light-400 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-lime w-full md:w-64 text-dark dark:text-white placeholder:text-dark-200 dark:placeholder:text-zinc-500"
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
            className={`group relative rounded-3xl p-6 transition-all duration-500 hover:scale-[1.03] overflow-hidden ${
              stat.variant === "dark"
                ? "bg-gradient-to-br from-dark via-dark to-dark-500 text-white shadow-2xl hover:shadow-lime/20"
                : stat.variant === "lime"
                  ? "bg-gradient-to-br from-lime via-lime to-lime/90 text-dark shadow-xl hover:shadow-lime/40"
                  : "bg-gradient-to-br from-white via-white to-light-200 dark:from-white/10 dark:via-white/5 dark:to-white/5 text-dark dark:text-white border border-light-400/50 dark:border-white/10 shadow-lg hover:shadow-xl dark:shadow-white/5"
            }`}
          >
            {/* Animated Background Gradient */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
              stat.variant === "dark" 
                ? "bg-gradient-to-tr from-lime/10 to-transparent"
                : stat.variant === "lime"
                  ? "bg-gradient-to-tr from-dark/10 to-transparent"
                  : "bg-gradient-to-tr from-lime/10 to-transparent"
            }`}></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                    stat.variant === "dark"
                      ? "bg-gradient-to-br from-lime/20 to-lime/10 backdrop-blur-sm"
                      : stat.variant === "lime"
                        ? "bg-gradient-to-br from-dark/15 to-dark/5 backdrop-blur-sm"
                        : "bg-gradient-to-br from-light-400 to-light-300 dark:from-white/15 dark:to-white/5"
                  }`}
                >
                  <stat.icon
                    size={20}
                    className={
                      stat.variant === "dark"
                        ? "text-lime"
                        : stat.variant === "lime"
                          ? "text-dark"
                          : "text-dark dark:text-lime"
                    }
                  />
                </div>
                <ArrowUpRight
                  size={18}
                  className={`opacity-40 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 ${
                    stat.variant === "dark"
                      ? "text-lime"
                      : stat.variant === "lime"
                        ? "text-dark"
                        : "text-dark dark:text-lime"
                  }`}
                />
              </div>
              <div className="text-3xl lg:text-4xl font-black mb-2 group-hover:scale-105 transition-transform duration-300">{stat.value}</div>
              <div
                className={`text-xs font-bold uppercase tracking-wide ${
                  stat.variant === "dark"
                    ? "text-dark-200"
                    : stat.variant === "lime"
                      ? "text-dark/60"
                      : "text-dark-300 dark:text-zinc-400"
                }`}
              >
                {stat.label}
              </div>
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
                <div className="text-lg font-bold text-white">
                  {userStats.currentMonthEvents}
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-lime/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-lime/5 rounded-full blur-2xl"></div>
        </div>

        {/* Calendar Widget */}
        <div className="bg-white dark:bg-white/[0.03] rounded-3xl p-6 shadow-card dark:shadow-none border border-light-400/50 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-dark dark:text-white font-bold">
              Your Event Days
            </h3>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={previousMonth}
                className="p-1.5 hover:bg-light-300 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronLeft size={16} className="text-dark dark:text-white" />
              </button>
              <h4 className="font-bold text-dark dark:text-white text-sm">
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </h4>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-light-300 rounded-lg transition-colors"
              >
                <ChevronRight size={16} className="text-dark dark:text-white" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day, i) => (
                <div
                  key={i}
                  className="text-center text-xs text-dark-200 dark:text-zinc-500 p-1.5 font-medium"
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
                const hasEvent = eventDates.includes(day);

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
                          : "text-dark-300 dark:text-zinc-400 hover:bg-light-300 dark:hover:bg-white/5"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-light-400 dark:border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-dark-300 dark:text-zinc-500">
                Current day
              </span>
              <span className="w-3 h-3 bg-lime rounded-full"></span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-dark-300 dark:text-zinc-500">
                Event days
              </span>
              <span className="w-3 h-3 bg-dark dark:bg-white rounded-full"></span>
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
        <div className="lg:col-span-2 bg-white dark:bg-white/[0.03] rounded-3xl p-6 shadow-card dark:shadow-none border border-light-400/50 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-dark dark:text-white">
              My Learning Activity
            </h3>
            <Link
              to="/participant/registrations"
              className="text-sm font-bold text-dark dark:text-white bg-light-300 dark:bg-white/5 hover:bg-light-400 dark:hover:bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
            >
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {myRegistrations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-dark-200 dark:text-zinc-600 mb-2">
                  <BookOpen className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-dark-300 dark:text-zinc-400 text-sm">
                  No registered events yet
                </p>
                <p className="text-dark-200 dark:text-zinc-500 text-xs mt-1">
                  Browse events and start your learning journey!
                </p>
              </div>
            ) : (
              myRegistrations.slice(0, 4).map((registration, index) => {
                const icons = ["💻", "📊", "🎨", "🤖", "🎯", "📚", "🚀", "⚡"];
                const variant = index % 2 === 0 ? "dark" : "lime";

                // Calculate progress based on event/registration status
                const event = registration.event;
                const completion =
                  event?.status === "completed"
                    ? 100
                    : event?.status === "ongoing"
                      ? 50
                      : registration.attendanceStatus === "ATTENDED"
                        ? 75
                        : registration.registrationStatus === "CONFIRMED"
                          ? 25
                          : 10;

                const progressLabel = registration.certificate
                  ? "Certificate Issued"
                  : registration.attendanceStatus === "ATTENDED"
                    ? "Attended"
                    : event?.status === "ongoing"
                      ? "In Progress"
                      : registration.registrationStatus === "CONFIRMED"
                        ? "Registered"
                        : "Pending";

                return (
                  <Link
                    key={registration._id}
                    to={`/participant/event/${registration.event?._id}`}
                    className={`group relative flex items-center justify-between p-5 rounded-2xl transition-all duration-500 hover:scale-[1.02] overflow-hidden ${
                      variant === "dark"
                        ? "bg-gradient-to-br from-dark via-dark to-dark-500 text-white shadow-lg hover:shadow-lime/10"
                        : "bg-gradient-to-br from-lime/20 via-lime/15 to-lime/10 text-dark hover:shadow-lg"
                    }`}
                  >
                    {/* Hover Glow Effect */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      variant === "dark" ? "bg-gradient-to-r from-lime/5 to-transparent" : "bg-gradient-to-r from-dark/5 to-transparent"
                    }`}></div>
                    
                    <div className="relative z-10 flex items-center gap-4 flex-1">
                      <div
                        className={`text-2xl w-12 h-12 flex items-center justify-center rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 ${
                          variant === "dark" ? "bg-gradient-to-br from-lime/20 to-lime/10 backdrop-blur-sm" : "bg-gradient-to-br from-dark/15 to-dark/5 backdrop-blur-sm"
                        }`}
                      >
                        {icons[index % icons.length]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm mb-1 truncate group-hover:translate-x-1 transition-transform duration-300">
                          {registration.event?.title || "Event"}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${variant === "dark" ? "bg-lime/15 text-lime" : "bg-dark/15 text-dark"}`}
                          >
                            {registration.registrationStatus}
                          </span>
                          {registration.certificate && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-600 dark:text-yellow-400">
                              <Award size={10} />
                              Certified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10 text-right ml-2">
                      <div
                        className={`text-xs mb-2 font-medium ${variant === "dark" ? "text-dark-200" : "text-dark/60"}`}
                      >
                        {progressLabel}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-20 h-2 rounded-full overflow-hidden shadow-inner ${
                            variant === "dark" ? "bg-white/10" : "bg-dark/10"
                          }`}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              variant === "dark" ? "bg-gradient-to-r from-lime to-lime/80" : "bg-gradient-to-r from-dark to-dark/80"
                            }`}
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white dark:bg-white/[0.03] rounded-3xl p-6 shadow-card dark:shadow-none border border-light-400/50 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-dark dark:text-white">
              Upcoming Events
            </h3>
            <Link
              to="/participant/calendar"
              className="text-sm font-bold text-dark bg-lime hover:bg-lime-400 px-3 py-1.5 rounded-xl transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-dark-200 dark:text-zinc-600 mb-2">
                  <Calendar className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-dark-300 dark:text-zinc-400 text-sm font-medium">
                  No upcoming events
                </p>
                <p className="text-dark-200 dark:text-zinc-500 text-xs mt-1">
                  Check back soon for new events!
                </p>
              </div>
            ) : (
              events.slice(0, 3).map((event, index) => {
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
                      className={`relative rounded-3xl p-6 transition-all duration-500 hover:scale-[1.02] overflow-hidden ${
                        variant === "dark"
                          ? "bg-gradient-to-br from-dark via-dark to-dark-500 text-white shadow-2xl hover:shadow-lime/20"
                          : variant === "lime"
                            ? "bg-gradient-to-br from-lime via-lime to-lime/90 text-dark shadow-xl hover:shadow-lime/40"
                            : "bg-gradient-to-br from-white via-white to-light-200 dark:from-white/10 dark:via-white/5 dark:to-white/5 text-dark dark:text-white shadow-lg hover:shadow-xl dark:shadow-white/5 border border-light-400/50 dark:border-white/10"
                      }`}
                    >
                      {/* Banner Image */}
                      {event.bannerImage && (
                        <div className="w-full h-36 overflow-hidden rounded-2xl mb-4">
                          <img
                            src={event.bannerImage}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

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
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm ${
                              variant === "dark"
                                ? "bg-white/10 text-lime"
                                : variant === "lime"
                                  ? "bg-dark/10 text-dark"
                                  : "bg-light-400 dark:bg-white/10 text-dark-300 dark:text-zinc-300"
                            }`}
                          >
                            <Clock size={12} />
                            {daysLeft}d left
                          </div>
                        )}
                      </div>

                      <h3 className="font-black text-xl mb-3 leading-tight group-hover:translate-x-1 transition-transform duration-300">
                        {event.title}
                      </h3>

                      {/* Details Grid */}
                      <div className="space-y-2.5 mb-4">
                        <div
                          className={`flex items-center gap-2 text-sm font-medium ${
                            variant === "dark"
                              ? "text-dark-200"
                              : variant === "lime"
                                ? "text-dark/70"
                                : "text-dark-300 dark:text-zinc-400"
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg ${
                              variant === "dark"
                                ? "bg-lime/10"
                                : variant === "lime"
                                  ? "bg-dark/10"
                                  : "bg-light-400 dark:bg-white/10"
                            }`}
                          >
                            <MapPin size={14} />
                          </div>
                          <span>{event.type || "Online"}</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 text-sm font-medium ${
                            variant === "dark"
                              ? "text-dark-200"
                              : variant === "lime"
                                ? "text-dark/70"
                                : "text-dark-300 dark:text-zinc-400"
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg ${
                              variant === "dark"
                                ? "bg-lime/10"
                                : variant === "lime"
                                  ? "bg-dark/10"
                                  : "bg-light-400 dark:bg-white/10"
                            }`}
                          >
                            <Calendar size={14} />
                          </div>
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-current/10">
                        <div
                          className={`flex items-center gap-2 font-black text-lg ${
                            variant === "dark"
                              ? "text-lime"
                              : variant === "lime"
                                ? "text-dark"
                                : "text-dark dark:text-lime"
                          }`}
                        >
                          {event.registrationFee > 0 ? (
                            <>
                              <span className="text-xs font-medium opacity-60">₹</span>
                              {event.registrationFee}
                            </>
                          ) : (
                            <span className="text-base">FREE</span>
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-1.5 text-sm font-bold group-hover:gap-2.5 transition-all ${
                            variant === "dark"
                              ? "text-lime"
                              : variant === "lime"
                                ? "text-dark"
                                : "text-dark dark:text-lime"
                          }`}
                        >
                          <span>View Details</span>
                          <ArrowUpRight
                            size={18}
                            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative bg-gradient-to-br from-dark via-dark to-dark-500 rounded-3xl p-6 lg:p-8 overflow-hidden shadow-2xl">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-lime/5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <h3 className="font-black text-xl text-white mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  name: "Scan QR",
                  icon: CheckCircle,
                  variant: "lime",
                  path: "/participant/scan",
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
                  className={`group/action relative flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-500 hover:scale-110 overflow-hidden ${
                    action.variant === "lime"
                      ? "bg-gradient-to-br from-lime to-lime/90 text-dark shadow-lg hover:shadow-lime/40"
                      : "bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/10"
                  }`}
                >
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/action:translate-x-[100%] transition-transform duration-700"></div>
                  
                  <action.icon size={24} className="relative z-10 group-hover/action:scale-110 transition-transform duration-300" />
                  <span className="relative z-10 text-xs font-bold">{action.name}</span>
                </Link>
              ))}
            </div>

            <div className="mt-6 relative p-5 bg-gradient-to-br from-lime/15 to-lime/5 rounded-2xl border-2 border-lime/30 overflow-hidden backdrop-blur-sm">
              {/* Animated Background */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-lime/10 rounded-full blur-xl"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-lime" />
                    Learning Streak
                  </h4>
                  <p className="text-xs text-dark-200 mt-1 font-medium">
                    {userStats.learningStreak > 0
                      ? "Keep up the great work!"
                      : "Start your journey!"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-lime">
                    {userStats.learningStreak}
                  </div>
                  <div className="text-xs text-dark-200 font-bold uppercase">events</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating QR Scanner Button */}
      <Link
        to="/participant/scan"
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-lime to-lime/90 text-dark p-5 rounded-full shadow-2xl hover:shadow-lime/60 hover:scale-110 transition-all duration-300 group"
        title="Scan QR Code"
      >
        <Zap size={24} className="group-hover:animate-pulse" />
      </Link>
    </div>
  );
};

export default EventsHome;
