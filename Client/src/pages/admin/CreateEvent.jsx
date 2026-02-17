import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Award,
  ChevronDown,
  Save,
  X,
  Loader2,
  BookOpen,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import { eventsApi, teamsApi } from '../../services/api';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [fetchingEvent, setFetchingEvent] = useState(isEditMode);
  const [teamLeads, setTeamLeads] = useState([]);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationStart: '',
    registrationEnd: '',
    location: '',
    maxParticipants: '',
    teamLead: '',
    enableCertificates: false,
    certificateTemplate: '',
    category: '',
    tags: '',
    rulebook: '',
    // Team Event Fields
    participationType: 'INDIVIDUAL',
    teamMinSize: 2,
    teamMaxSize: 5,
    requireTeamName: true,
    allowMixedGender: true,
    minMembersForCertificate: '',
  });

  const categories = ['Conference', 'Workshop', 'Hackathon', 'Seminar', 'Webinar', 'Competition'];

  // Fetch event data for editing
  useEffect(() => {
    if (isEditMode && id) {
      const fetchEventData = async () => {
        setFetchingEvent(true);
        try {
          const response = await eventsApi.getOne(id);
          if (response.success) {
            const event = response.data;
            setFormData({
              title: event.title || '',
              description: event.description || '',
              startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
              endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
              registrationStart: event.registrationStartDate ? new Date(event.registrationStartDate).toISOString().slice(0, 16) : '',
              registrationEnd: event.registrationEndDate ? new Date(event.registrationEndDate).toISOString().slice(0, 16) : '',
              location: event.location || '',
              maxParticipants: event.maxParticipants || '',
              teamLead: event.teamLead?._id || event.teamLead || '',
              enableCertificates: event.enableCertificates || false,
              certificateTemplate: event.certificateTemplate || '',
              category: event.category || '',
              tags: event.tags ? event.tags.join(', ') : '',
              rulebook: event.rulebook || '',
              // Team Event Fields
              participationType: event.participationType || 'INDIVIDUAL',
              teamMinSize: event.teamConfig?.minSize || 2,
              teamMaxSize: event.teamConfig?.maxSize || 5,
              requireTeamName: event.teamConfig?.requireTeamName !== false,
              allowMixedGender: event.teamConfig?.allowMixedGender !== false,
              minMembersForCertificate: event.teamConfig?.minMembersForCertificate || '',
            });
            if (event.bannerImage) {
              setBannerPreview(event.bannerImage);
            }
          }
        } catch (error) {
          console.error('Error fetching event:', error);
          alert('Failed to load event data');
        } finally {
          setFetchingEvent(false);
        }
      };
      fetchEventData();
    }
  }, [id, isEditMode]);

  // Fetch team leads on mount
  useEffect(() => {
    const fetchTeamLeads = async () => {
      try {
        const response = await teamsApi.getTeamLeads();
        setTeamLeads(response.data || []);
      } catch (error) {
        console.error('Error fetching team leads:', error);
      }
    };
    fetchTeamLeads();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Banner image must be under 5MB');
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        registrationStartDate: formData.registrationStart,
        registrationEndDate: formData.registrationEnd,
        location: formData.location,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        teamLead: formData.teamLead || null,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        enableCertificates: formData.enableCertificates,
        certificateTemplate: formData.certificateTemplate,
        rulebook: formData.rulebook,
        // Team Event Fields
        participationType: formData.participationType,
        teamConfig: formData.participationType === 'TEAM' ? {
          minSize: parseInt(formData.teamMinSize) || 2,
          maxSize: parseInt(formData.teamMaxSize) || 5,
          requireTeamName: formData.requireTeamName,
          allowMixedGender: formData.allowMixedGender,
          minMembersForCertificate: formData.minMembersForCertificate ? parseInt(formData.minMembersForCertificate) : null,
        } : undefined,
      };
      
      let eventId = id;
      if (isEditMode) {
        await eventsApi.update(id, eventData);
      } else {
        const result = await eventsApi.create(eventData);
        eventId = result.data?._id;
      }

      // Upload banner if a file was selected
      if (bannerFile && eventId) {
        await eventsApi.uploadBanner(eventId, bannerFile);
      }

      alert(isEditMode ? 'Event updated successfully!' : 'Event created successfully!');
      navigate('/admin/events');
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditMode ? 'Update the event details below' : 'Fill in the details to create a new event'}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/events')}
          className="btn-secondary flex items-center gap-2"
        >
          <X size={20} />
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Image */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <ImagePlus size={20} className="text-primary-600" />
            Event Banner
          </h2>

          {bannerPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              <img
                src={bannerPreview}
                alt="Banner preview"
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={removeBanner}
                className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <ImagePlus size={32} className="text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Click to upload banner image</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB &bull; Recommended: 1200x630</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Event Info Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <FileText size={20} className="text-primary-600" />
            Event Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Name *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter event name"
                className="input-field"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter event description"
                rows={4}
                className="input-field resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Event location or 'Virtual'"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="tech, ai, workshop (comma separated)"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Participants
              </label>
              <div className="relative">
                <Users
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  placeholder="Leave empty for unlimited"
                  className="input-field pl-10"
                  min={1}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.participationType === 'TEAM' 
                  ? 'Max number of teams allowed' 
                  : 'Max number of individual participants'}
              </p>
            </div>
          </div>
        </div>

        {/* Participation Type Configuration */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Users size={20} className="text-primary-600" />
            Participation Type
          </h2>

          <div className="space-y-6">
            {/* Participation Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Registration Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.participationType === 'INDIVIDUAL'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="participationType"
                    value="INDIVIDUAL"
                    checked={formData.participationType === 'INDIVIDUAL'}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Individual Registration</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Each participant registers alone with their own details
                    </p>
                  </div>
                </label>

                <label className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.participationType === 'TEAM'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="participationType"
                    value="TEAM"
                    checked={formData.participationType === 'TEAM'}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Team Registration</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Captain registers entire team with all member details
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Team Configuration (shown only when TEAM is selected) */}
            {formData.participationType === 'TEAM' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  Team Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Team Size *
                    </label>
                    <input
                      type="number"
                      name="teamMinSize"
                      value={formData.teamMinSize}
                      onChange={handleChange}
                      min={1}
                      max={formData.teamMaxSize || 100}
                      className="input-field"
                      required={formData.participationType === 'TEAM'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum number of members required per team
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Team Size *
                    </label>
                    <input
                      type="number"
                      name="teamMaxSize"
                      value={formData.teamMaxSize}
                      onChange={handleChange}
                      min={formData.teamMinSize || 1}
                      className="input-field"
                      required={formData.participationType === 'TEAM'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum number of members allowed per team
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Members for Certificate
                    </label>
                    <input
                      type="number"
                      name="minMembersForCertificate"
                      value={formData.minMembersForCertificate}
                      onChange={handleChange}
                      min={1}
                      max={formData.teamMaxSize || 100}
                      placeholder="Leave empty for all"
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum team members who must attend to be eligible for certificates (leave empty to require all)
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="requireTeamName"
                        checked={formData.requireTeamName}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Require Team Name
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="allowMixedGender"
                        checked={formData.allowMixedGender}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Allow Mixed Gender Teams
                      </span>
                    </label>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <strong>Team Registration Process:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                    <li>Team captain fills out registration form</li>
                    <li>Captain enters details for all team members ({formData.teamMinSize}-{formData.teamMaxSize} members)</li>
                    <li>All members get linked to the same team</li>
                    <li>Attendance can be tracked for individual members</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Event Rulebook */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <BookOpen size={20} className="text-primary-600" />
            Event Rulebook
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rulebook / Guidelines
            </label>
            <textarea
              name="rulebook"
              value={formData.rulebook}
              onChange={handleChange}
              placeholder={"Enter event rules and guidelines point-wise, e.g.:\n1. All participants must register before the deadline.\n2. Attendance is mandatory for certificate eligibility.\n3. No plagiarism allowed in submissions.\n\nYou can also copy-paste rules here."}
              rows={10}
              className="input-field resize-y font-mono text-sm"
            />
            <p className="text-sm text-gray-500 mt-2">
              Add rules point-wise (numbered or bulleted). You can also copy-paste from another document.
            </p>
          </div>
        </div>

        {/* Date Configuration */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-primary-600" />
            Event Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Opens
              </label>
              <div className="relative">
                <Clock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="datetime-local"
                  name="registrationStart"
                  value={formData.registrationStart}
                  onChange={handleChange}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Closes
              </label>
              <div className="relative">
                <Clock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="datetime-local"
                  name="registrationEnd"
                  value={formData.registrationEnd}
                  onChange={handleChange}
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team Lead Assignment */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Users size={20} className="text-primary-600" />
            Team Assignment
          </h2>

          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign Team Lead</label>
            <div className="relative">
              <select
                name="teamLead"
                value={formData.teamLead}
                onChange={handleChange}
                className="input-field appearance-none cursor-pointer"
              >
                <option value="">Select team lead</option>
                {teamLeads.map((lead) => (
                  <option key={lead._id} value={lead._id}>
                    {lead.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={20}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Team lead will be responsible for managing this event
            </p>
          </div>
        </div>

        {/* Certificate Configuration */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Award size={20} className="text-primary-600" />
            Certificate Settings
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="enableCertificates"
                checked={formData.enableCertificates}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="font-medium text-gray-800">Enable Certificates</span>
                <p className="text-sm text-gray-500">
                  Participants will receive certificates upon completion
                </p>
              </div>
            </label>

            {formData.enableCertificates && (
              <div className="ml-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Template
                </label>
                <select
                  name="certificateTemplate"
                  value={formData.certificateTemplate}
                  onChange={handleChange}
                  className="input-field max-w-md"
                >
                  <option value="">Select template</option>
                  <option value="default">Default Template</option>
                  <option value="modern">Modern Template</option>
                  <option value="classic">Classic Template</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Event' : 'Create Event')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;
