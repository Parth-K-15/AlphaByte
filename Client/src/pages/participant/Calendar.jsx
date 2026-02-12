import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const API_BASE = "http://localhost:5000/api";

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const email = localStorage.getItem("participantEmail") || "";

  useEffect(() => {
    fetchCalendarEvents();
  }, [currentDate]);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const params = new URLSearchParams({
        month: month.toString(),
        year: year.toString(),
      });

      if (email) {
        params.append("email", email);
      }

      const response = await fetch(
        `${API_BASE}/participant/calendar?${params}`,
      );
      const data = await response.json();

      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const getEventsForDate = (day) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;

      return (
        date >= new Date(eventStart.setHours(0, 0, 0, 0)) &&
        date <= new Date(eventEnd.setHours(23, 59, 59, 999))
      );
    });
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

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

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark rounded-3xl p-8 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Event Calendar</h1>
        <p className="text-dark-200">
          View all upcoming events and plan your participation
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-card overflow-hidden border border-light-400/50">
            {/* Calendar Header */}
            <div className="p-5 border-b border-light-400 flex items-center justify-between">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-light-300 rounded-xl transition-colors"
              >
                <ChevronLeft size={20} className="text-dark" />
              </button>
              <div className="text-center">
                <h2 className="text-lg font-bold text-dark">
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={goToToday}
                  className="text-xs font-bold text-lime-600 hover:text-dark transition-colors"
                >
                  Today
                </button>
              </div>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-light-300 rounded-xl transition-colors"
              >
                <ChevronRight size={20} className="text-dark" />
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 border-b border-light-400">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-xs font-bold text-dark-200 uppercase tracking-wide"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime"></div>
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {Array.from({ length: startingDay }, (_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="h-24 border-b border-r border-light-400/50 bg-light-300/50"
                  ></div>
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDate(day);
                  const hasEvents = dayEvents.length > 0;
                  const hasRegistered = dayEvents.some((e) => e.isRegistered);

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`h-24 border-b border-r border-light-400/50 p-1 cursor-pointer transition-all ${
                        selectedDate === day
                          ? "bg-lime/10"
                          : isToday(day)
                            ? "bg-lime/5"
                            : "hover:bg-light-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${
                            isToday(day)
                              ? "bg-lime text-dark font-bold"
                              : selectedDate === day
                                ? "bg-dark text-white font-bold"
                                : "text-dark"
                          }`}
                        >
                          {day}
                        </span>
                        {hasRegistered && (
                          <span className="text-xs text-lime-600 font-bold">
                            ✓
                          </span>
                        )}
                      </div>

                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event._id}
                            className={`text-[10px] px-1 py-0.5 rounded font-medium truncate ${
                              event.status === "ongoing"
                                ? "bg-lime/20 text-dark"
                                : "bg-dark/10 text-dark"
                            }`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-dark-200 pl-1 font-medium">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Date Events */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-card sticky top-20 border border-light-400/50 overflow-hidden">
            <div className="p-5 bg-dark text-white">
              <h3 className="font-bold text-sm">
                {selectedDate
                  ? `${monthNames[currentDate.getMonth()]} ${selectedDate}, ${currentDate.getFullYear()}`
                  : "Select a date"}
              </h3>
            </div>

            <div className="p-4">
              {!selectedDate ? (
                <div className="text-center py-8 text-dark-200">
                  <div className="w-12 h-12 bg-light-300 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📅</span>
                  </div>
                  <p className="text-sm font-medium">
                    Click on a date to see events
                  </p>
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="text-center py-8 text-dark-200">
                  <div className="w-12 h-12 bg-light-300 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📭</span>
                  </div>
                  <p className="text-sm font-medium">No events on this date</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((event) => (
                    <Link
                      key={event._id}
                      to={`/participant/event/${event._id}`}
                      className="block p-3 rounded-2xl bg-light-300 hover:bg-lime/10 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-dark text-sm">
                          {event.title}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            event.status === "ongoing"
                              ? "bg-lime text-dark"
                              : event.status === "upcoming"
                                ? "bg-dark text-white"
                                : "bg-light-400 text-dark-300"
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-dark-300 space-y-1">
                        <div>🕐 {formatTime(event.startDate)}</div>
                        {(event.location || event.venue) && (
                          <div>📍 {event.venue || event.location}</div>
                        )}
                      </div>

                      {event.isRegistered && (
                        <div className="mt-2 text-xs text-dark font-bold">
                          <span className="bg-lime/20 px-2 py-0.5 rounded-full">
                            ✓ Registered
                          </span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-3xl shadow-card p-4 border border-light-400/50">
        <div className="flex flex-wrap gap-5 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-lime"></div>
            <span className="text-dark-300 text-xs font-medium">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-dark/10"></div>
            <span className="text-dark-300 text-xs font-medium">Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-lime/20"></div>
            <span className="text-dark-300 text-xs font-medium">Ongoing</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lime-600 font-bold text-xs">✓</span>
            <span className="text-dark-300 text-xs font-medium">
              Registered
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
