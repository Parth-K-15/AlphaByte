import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMyPermissions } from '../services/organizerApi';

const PermissionContext = createContext(null);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    // Return safe defaults when used outside provider (e.g. non-organizer pages)
    return {
      permissions: null,
      selectedEventId: null,
      setSelectedEventId: () => {},
      loading: false,
      isTeamLead: false,
      canManageTeam: false,
      canManageSpeakers: false,
      canViewLogs: true,
      hasPermission: () => true,
    };
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const [selectedEventId, setSelectedEventId] = useState(() => {
    return localStorage.getItem('selectedEventId') || null;
  });
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPermissions = useCallback(async (eventId) => {
    if (!eventId) {
      setPermissions(null);
      return;
    }

    setLoading(true);
    try {
      const response = await getMyPermissions(eventId);
      if (response.data.success) {
        setPermissions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // On error (e.g. not assigned), set restrictive permissions
      setPermissions({
        isTeamLead: false,
        permissions: {
          canViewParticipants: false,
          canManageAttendance: false,
          canSendEmails: false,
          canGenerateCertificates: false,
          canEditEvent: false,
        },
        canManageTeam: false,
        canManageSpeakers: false,
        canViewLogs: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // When selectedEventId changes, persist and fetch permissions
  useEffect(() => {
    if (selectedEventId) {
      localStorage.setItem('selectedEventId', selectedEventId);
      fetchPermissions(selectedEventId);
    } else {
      localStorage.removeItem('selectedEventId');
      setPermissions(null);
    }
  }, [selectedEventId, fetchPermissions]);

  const hasPermission = useCallback((permKey) => {
    if (!permissions) return true; // No event selected, show all nav items
    if (permissions.isTeamLead) return true;
    return permissions.permissions?.[permKey] || false;
  }, [permissions]);

  const value = {
    permissions,
    selectedEventId,
    setSelectedEventId,
    loading,
    isTeamLead: permissions?.isTeamLead || false,
    canManageTeam: permissions?.canManageTeam || false,
    canManageSpeakers: permissions?.canManageSpeakers || false,
    canViewLogs: permissions?.canViewLogs ?? true,
    hasPermission,
    refreshPermissions: () => fetchPermissions(selectedEventId),
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export default PermissionContext;
