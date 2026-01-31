import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle,
  Circle,
  Clock,
  Play,
  Archive,
  AlertCircle,
  Calendar,
  Users,
  MapPin,
} from 'lucide-react';

const EventLifecycle = () => {
  const { id } = useParams();

  // Sample event data
  const [event, setEvent] = useState({
    id: 1,
    name: 'Tech Summit 2026',
    status: 'live',
    teamLead: 'John Doe',
    location: 'Convention Center',
    participants: 245,
    startDate: '2026-02-15',
    endDate: '2026-02-17',
  });

  const lifecycleStages = [
    {
      key: 'created',
      label: 'Created',
      icon: Circle,
      description: 'Event has been created and is in draft mode',
    },
    {
      key: 'live',
      label: 'Live',
      icon: Play,
      description: 'Event is currently active and accepting registrations',
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: CheckCircle,
      description: 'Event has ended successfully',
    },
    {
      key: 'archived',
      label: 'Archived',
      icon: Archive,
      description: 'Event has been archived for records',
    },
  ];

  const getCurrentStageIndex = () => {
    return lifecycleStages.findIndex((stage) => stage.key === event.status);
  };

  const handleStatusChange = (newStatus) => {
    setEvent((prev) => ({ ...prev, status: newStatus }));
  };

  const getStageColor = (stageIndex, currentIndex) => {
    if (stageIndex < currentIndex) return 'bg-green-500 text-white';
    if (stageIndex === currentIndex) return 'bg-primary-600 text-white';
    return 'bg-gray-200 text-gray-500';
  };

  const getLineColor = (stageIndex, currentIndex) => {
    if (stageIndex < currentIndex) return 'bg-green-500';
    return 'bg-gray-200';
  };

  const currentIndex = getCurrentStageIndex();

  // Sample events list for selection
  const events = [
    { id: 1, name: 'Tech Summit 2026', status: 'live' },
    { id: 2, name: 'Hackathon Championship', status: 'created' },
    { id: 3, name: 'AI Workshop Series', status: 'completed' },
    { id: 4, name: 'Design Sprint Week', status: 'created' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Event Lifecycle Manager</h1>
        <p className="text-gray-500 mt-1">Manage event status and progression</p>
      </div>

      {/* Event Selector */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
        <select
          value={event.id}
          onChange={(e) => {
            const selected = events.find((ev) => ev.id === parseInt(e.target.value));
            if (selected) {
              setEvent((prev) => ({
                ...prev,
                id: selected.id,
                name: selected.name,
                status: selected.status,
              }));
            }
          }}
          className="input-field max-w-md"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      </div>

      {/* Event Info Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
              <Calendar size={28} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{event.name}</h2>
              <p className="text-gray-500">
                {new Date(event.startDate).toLocaleDateString()} -{' '}
                {new Date(event.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Users size={18} />
              <span>{event.participants} participants</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={18} />
              <span>{event.location}</span>
            </div>
          </div>
        </div>

        {/* Lifecycle Timeline */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {lifecycleStages.map((stage, index) => (
              <div key={stage.key} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${getStageColor(
                    index,
                    currentIndex
                  )}`}
                >
                  <stage.icon size={24} />
                </div>
                <span
                  className={`mt-3 text-sm font-medium ${
                    index <= currentIndex ? 'text-gray-800' : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Line */}
          <div className="absolute top-6 left-6 right-6 h-0.5 flex -z-0">
            {lifecycleStages.slice(0, -1).map((_, index) => (
              <div
                key={index}
                className={`flex-1 transition-all duration-300 ${getLineColor(
                  index,
                  currentIndex
                )}`}
              />
            ))}
          </div>
        </div>

        {/* Current Stage Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Clock size={20} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                Current Status: {lifecycleStages[currentIndex].label}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {lifecycleStages[currentIndex].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Event Status</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {lifecycleStages.map((stage, index) => (
            <button
              key={stage.key}
              onClick={() => handleStatusChange(stage.key)}
              disabled={stage.key === event.status}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                stage.key === event.status
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              } ${stage.key === event.status ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <stage.icon
                  size={20}
                  className={stage.key === event.status ? 'text-primary-600' : 'text-gray-500'}
                />
                <span
                  className={`font-medium ${
                    stage.key === event.status ? 'text-primary-600' : 'text-gray-700'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              <p className="text-xs text-gray-500">{stage.description}</p>
            </button>
          ))}
        </div>

        {/* Warning */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Important Note</p>
            <p className="text-sm text-yellow-700 mt-1">
              Changing the event status will immediately affect visibility and registrations.
              Archived events cannot receive new registrations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventLifecycle;
