import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      fetchCalendarEvents();
    }
  }, [currentDate, user?.email]);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const params = new URLSearchParams({
        month: month.toString(),
        year: year.toString()
      });
      
      if (user?.email) {
        params.append('email', user.email);
      }

      const response = await fetch(`${API_BASE}/participant/calendar?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
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
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const getEventsForDate = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      
      // Check if date falls within event range
      return date >= new Date(eventStart.setHours(0,0,0,0)) && 
             date <= new Date(eventEnd.setHours(23,59,59,999));
    });
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Event Calendar 📅</h1>
        <p className="text-cyan-100">View all upcoming events and plan your participation</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={goToToday}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Today
                </button>
              </div>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                →
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDay }, (_, i) => (
                  <div key={`empty-${i}`} className="h-24 border-b border-r border-gray-100 bg-gray-50"></div>
                ))}
                
                {/* Days of the month */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDate(day);
                  const hasEvents = dayEvents.length > 0;
                  const hasRegistered = dayEvents.some(e => e.isRegistered);
                  
                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`h-24 border-b border-r border-gray-100 p-1 cursor-pointer transition-colors ${
                        selectedDate === day ? 'bg-indigo-50' :
                        isToday(day) ? 'bg-yellow-50' :
                        'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${
                          isToday(day) 
                            ? 'bg-indigo-600 text-white font-bold' 
                            : 'text-gray-700'
                        }`}>
                          {day}
                        </span>
                        {hasRegistered && (
                          <span className="text-xs text-green-600">✓</span>
                        )}
                      </div>
                      
                      {/* Event Indicators */}
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event._id}
                            className={`text-xs px-1 py-0.5 rounded truncate ${
                              event.status === 'ongoing' 
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 pl-1">
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
          <div className="bg-white rounded-xl shadow-sm sticky top-20">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">
                {selectedDate 
                  ? `${monthNames[currentDate.getMonth()]} ${selectedDate}, ${currentDate.getFullYear()}`
                  : 'Select a date'}
              </h3>
            </div>

            <div className="p-4">
              {!selectedDate ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📅</div>
                  <p>Click on a date to see events</p>
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📭</div>
                  <p>No events on this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map(event => (
                    <Link
                      key={event._id}
                      to={`/participant/event/${event._id}`}
                      className="block p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-gray-800 text-sm">
                          {event.title}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          event.status === 'ongoing' 
                            ? 'bg-green-100 text-green-700'
                            : event.status === 'upcoming'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        <div>🕐 {formatTime(event.startDate)}</div>
                        {(event.location || event.venue) && (
                          <div>📍 {event.venue || event.location}</div>
                        )}
                      </div>
                      
                      {event.isRegistered && (
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          ✓ Registered
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
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-100"></div>
            <span className="text-gray-600">Upcoming Event</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-100"></div>
            <span className="text-gray-600">Ongoing Event</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="text-gray-600">Registered</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
