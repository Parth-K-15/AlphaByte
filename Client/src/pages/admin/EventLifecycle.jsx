import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Circle,
  Clock,
  Play,
  XCircle,
  AlertCircle,
  Calendar,
  Users,
  MapPin,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { eventsApi } from '../../services/api';

const EventLifecycle = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const lifecycleStages = [
    {
      key: 'draft',
      label: 'Draft',
      icon: Circle,
      description: 'Event is in draft mode and not visible to participants',
      color: 'gray',
    },
    {
      key: 'upcoming',
      label: 'Upcoming',
      icon: Clock,
      description: 'Event is scheduled and accepting registrations',
      color: 'blue',
    },
    {
      key: 'ongoing',
      label: 'Ongoing',
      icon: Play,
      description: 'Event is currently active',
      color: 'green',
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: CheckCircle,
      description: 'Event has ended successfully',
      color: 'purple',
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      icon: XCircle,
      description: 'Event has been cancelled',
      color: 'red',
    },
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (id && events.length > 0) {
      fetchEventDetails(id);
    } else if (events.length > 0 && !id) {
      fetchEventDetails(events[0]._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, events.length]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsApi.getAll();
      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDetails = async (eventId) => {
    try {
      setLoading(true);
      const response = await eventsApi.getOne(eventId);
      if (response.success && response.data) {
        setEvent(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!event || newStatus === event.status) return;

    const confirmChange = window.confirm(
      `Are you sure you want to change the event status to "${newStatus}"? This will affect event visibility and registrations.`
    );

    if (!confirmChange) return;

    try {
      setUpdating(true);
      const response = await eventsApi.updateLifecycle(event._id, newStatus);
      if (response.success && response.data) {
        setEvent(response.data);
        alert('Event status updated successfully!');
      }
    } catch (err) {
      alert(err.message || 'Failed to update event status');
    } finally {
      setUpdating(false);
    }
  };

  const getCurrentStageIndex = () => {
    if (!event) return 0;
    const index = lifecycleStages.findIndex((stage) => stage.key === event.status);
    return index === -1 ? 0 : index;
  };

  const getStageColorClasses = (stage, isCurrent, isPast) => {
    if (isCurrent) {
      const colors = {
        gray: 'bg-gray-900 text-white shadow-md',
        blue: 'bg-blue-600 text-white shadow-md',
        green: 'bg-green-600 text-white shadow-md',
        purple: 'bg-purple-600 text-white shadow-md',
        red: 'bg-red-600 text-white shadow-md',
      };
      return colors[stage.color] || colors.gray;
    }
    if (isPast) {
      return 'bg-green-500 text-white';
    }
    return 'bg-gray-200 text-gray-400';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const currentStageIndex = getCurrentStageIndex();
  const currentStage = lifecycleStages[currentStageIndex];

  if (loading && !event) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Events</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event && events.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Found</h3>
          <p className="text-gray-500">Create an event first to manage its lifecycle.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Event Lifecycle</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Manage event status and progression</p>
        </div>
        <button
          onClick={() => navigate('/admin/events')}
          className="inline-flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Events</span>
          <span className="sm:hidden">Back</span>
        </button>
      </div>

      {/* Event Selector */}
      {events.length > 0 && (
        <div className="card">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Select Event
          </label>
          <select
            value={event?._id || ''}
            onChange={(e) => {
              const selectedId = e.target.value;
              if (selectedId) {
                fetchEventDetails(selectedId);
              }
            }}
            className="input-field max-w-2xl"
            disabled={loading}
          >
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.title} - {ev.status}
              </option>
            ))}
          </select>
        </div>
      )}

      {event && (
        <>
          {/* Event Info Card */}
          <div className="card">
            <div className="flex flex-col gap-6 mb-8">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 break-words">
                    {event.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="break-words">
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="break-words">{event.location}</span>
                      </div>
                    )}
                    {event.participantCount !== undefined && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{event.participantCount} participants</span>
                      </div>
                    )}
                  </div>
                  {event.teamLead && (
                    <div className="mt-3 text-xs md:text-sm">
                      <span className="text-gray-500">Team Lead:</span>{' '}
                      <span className="font-medium text-gray-900">{event.teamLead.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lifecycle Timeline */}
            <div className="relative py-8 px-4 md:px-8">
              {/* Progress Line */}
              <div className="absolute top-[calc(2rem+28px)] left-0 right-0 h-1 bg-gray-200 hidden sm:block" 
                   style={{ marginLeft: '10%', marginRight: '10%' }}>
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ 
                    width: `${(currentStageIndex / (lifecycleStages.length - 1)) * 100}%` 
                  }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 relative">
                {lifecycleStages.map((stage, index) => {
                  const isCurrent = stage.key === event.status;
                  const isPast = index < currentStageIndex;
                  return (
                    <div key={stage.key} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${getStageColorClasses(
                          stage,
                          isCurrent,
                          isPast
                        )}`}
                      >
                        <stage.icon className="w-6 h-6" />
                      </div>
                      <span
                        className={`mt-3 text-xs md:text-sm font-medium text-center ${
                          isCurrent || isPast ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Stage Info */}
            <div className="mt-6 p-4 md:p-5 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="p-2 md:p-2.5 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <currentStage.icon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                    Current Status: {currentStage.label}
                  </h3>
                  <p className="text-gray-600 text-xs md:text-sm mt-1">
                    {currentStage.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          <div className="card">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
              Change Event Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
              {lifecycleStages.map((stage) => {
                const isCurrent = stage.key === event.status;
                return (
                  <button
                    key={stage.key}
                    onClick={() => handleStatusChange(stage.key)}
                    disabled={isCurrent || updating}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      isCurrent
                        ? 'border-primary-600 bg-primary-50 shadow-sm'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    } ${
                      isCurrent || updating ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2 md:gap-2.5 mb-2">
                      <stage.icon
                        className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${
                          isCurrent ? 'text-primary-600' : 'text-gray-500'
                        }`}
                      />
                      <span
                        className={`font-medium text-sm md:text-base ${
                          isCurrent ? 'text-primary-700' : 'text-gray-700'
                        }`}
                      >
                        {stage.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {stage.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Warning */}
            <div className="mt-6 p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-semibold text-amber-900">
                  Important Note
                </p>
                <p className="text-xs md:text-sm text-amber-800 mt-1">
                  Changing the event status will affect visibility and participant registrations.
                  Cancelled events cannot be reverted.
                </p>
              </div>
            </div>

            {updating && (
              <div className="mt-4 flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Updating status...</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EventLifecycle;
