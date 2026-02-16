import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  Shield,
  Filter
} from 'lucide-react';

const RoleHistory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roleHistory, setRoleHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [filter, setFilter] = useState({
    includeActive: true,
    includeCompleted: true,
    includeRemoved: false
  });

  useEffect(() => {
    fetchRoleHistory();
  }, [filter]);

  const fetchRoleHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        includeActive: filter.includeActive,
        includeCompleted: filter.includeCompleted,
        includeRemoved: filter.includeRemoved
      });
      
      const response = await api.get(`/events/user/${user.id}/role-history?${params}`);
      
      if (response.data.success) {
        setRoleHistory(response.data.data.roleHistory);
        setFilteredHistory(response.data.data.roleHistory);
      }
    } catch (error) {
      console.error('Error fetching role history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (role) => {
    const { status, isTimeActive } = role;
    
    if (status === 'removed') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          <XCircle className="w-4 h-4" />
          Removed
        </span>
      );
    }
    
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Completed
        </span>
      );
    }
    
    if (isTimeActive) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Active Now
        </span>
      );
    }
    
    // Active but outside time bounds
    const now = new Date();
    const startTime = role.startTime ? new Date(role.startTime) : null;
    
    if (startTime && startTime > now) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          <Clock className="w-4 h-4" />
          Scheduled
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
        <AlertCircle className="w-4 h-4" />
        Pending
      </span>
    );
  };

  const getRoleBadge = (roleName) => {
    const colors = {
      'TEAM_LEAD': 'bg-purple-100 text-purple-700',
      'TEAM_MEMBER': 'bg-blue-100 text-blue-700'
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${colors[roleName] || 'bg-gray-100 text-gray-700'}`}>
        <Shield className="w-4 h-4" />
        {roleName === 'TEAM_LEAD' ? 'Team Lead' : 'Team Member'}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPermissionsList = (permissions) => {
    const permList = [];
    if (permissions.canViewParticipants) permList.push('View Participants');
    if (permissions.canManageAttendance) permList.push('Manage Attendance');
    if (permissions.canSendEmails) permList.push('Send Emails');
    if (permissions.canGenerateCertificates) permList.push('Generate Certificates');
    if (permissions.canEditEvent) permList.push('Edit Event');
    return permList;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Role History</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Track all your event roles and contributions
                </p>
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filter.includeActive}
                    onChange={(e) => setFilter({ ...filter, includeActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filter.includeCompleted}
                    onChange={(e) => setFilter({ ...filter, includeCompleted: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  <span className="text-gray-700">Completed</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filter.includeRemoved}
                    onChange={(e) => setFilter({ ...filter, includeRemoved: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-gray-700">Removed</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{roleHistory.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Roles</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {roleHistory.filter(r => r.status === 'active' && r.isTimeActive).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">
                  {roleHistory.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Events</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {new Set(roleHistory.map(r => r.eventId)).size}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Role History Timeline */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading role history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Role History</h3>
            <p className="text-gray-600">
              You haven't been assigned to any events yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((role, index) => (
              <div
                key={`${role.eventId}-${role.addedAt}-${index}`}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {role.eventTitle}
                      </h3>
                      {getStatusBadge(role)}
                      {getRoleBadge(role.role)}
                    </div>
                    
                    {role.teamLead && (
                      <p className="text-sm text-gray-600">
                        Team Lead: {role.teamLead.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Time Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Added</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(role.addedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-blue-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Start Time</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(role.startTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-orange-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">End Time</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(role.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-purple-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Event Dates</p>
                      <p className="text-sm font-medium text-gray-900">
                        {role.eventStartDate ? new Date(role.eventStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                        {role.eventEndDate && ` - ${new Date(role.eventEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Granted Permissions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getPermissionsList(role.permissions).map((perm, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Removal Reason */}
                {role.status === 'removed' && role.removalReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-semibold text-red-700 mb-1">Removal Reason</p>
                    <p className="text-sm text-red-600">{role.removalReason}</p>
                    <p className="text-xs text-red-500 mt-1">
                      Removed on {formatDate(role.removedAt)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleHistory;
