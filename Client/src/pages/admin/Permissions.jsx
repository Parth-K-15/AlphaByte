import { useState } from 'react';
import { Shield, Check, X, Info } from 'lucide-react';

const Permissions = () => {
  const [permissions, setPermissions] = useState({
    lead: {
      editEvent: true,
      deleteEvent: true,
      sendCertificates: true,
      addParticipants: true,
      viewReports: true,
      manageMembers: true,
      archiveEvent: true,
    },
    member: {
      editEvent: false,
      deleteEvent: false,
      sendCertificates: true,
      addParticipants: false,
      viewReports: true,
      manageMembers: false,
      archiveEvent: false,
    },
  });

  const permissionsList = [
    {
      key: 'editEvent',
      label: 'Edit Event',
      description: 'Can modify event details and settings',
    },
    {
      key: 'deleteEvent',
      label: 'Delete Event',
      description: 'Can permanently delete events',
    },
    {
      key: 'sendCertificates',
      label: 'Send Certificates',
      description: 'Can generate and send certificates to participants',
    },
    {
      key: 'addParticipants',
      label: 'Add Participants',
      description: 'Can manually add participants to events',
    },
    {
      key: 'viewReports',
      label: 'View Reports',
      description: 'Can access analytics and reports',
    },
    {
      key: 'manageMembers',
      label: 'Manage Members',
      description: 'Can add or remove team members',
    },
    {
      key: 'archiveEvent',
      label: 'Archive Event',
      description: 'Can move events to archived status',
    },
  ];

  const togglePermission = (role, permission) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: !prev[role][permission],
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Role Permissions</h1>
        <p className="text-gray-500 mt-1">Configure access levels for different roles</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">Permission Matrix</p>
          <p className="text-sm text-blue-700 mt-1">
            Define what actions each role can perform. Team Leads have higher privileges than
            Members. Changes are applied immediately.
          </p>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 min-w-[250px]">
                  Permission
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600 w-32">
                  <div className="flex items-center justify-center gap-2">
                    <Shield size={16} className="text-purple-600" />
                    Team Lead
                  </div>
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600 w-32">
                  <div className="flex items-center justify-center gap-2">
                    <Shield size={16} className="text-blue-600" />
                    Member
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {permissionsList.map((perm) => (
                <tr key={perm.key} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-800">{perm.label}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{perm.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => togglePermission('lead', perm.key)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          permissions.lead[perm.key]
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        {permissions.lead[perm.key] ? <Check size={20} /> : <X size={20} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => togglePermission('member', perm.key)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          permissions.member[perm.key]
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        {permissions.member[perm.key] ? <Check size={20} /> : <X size={20} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Legend</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Check size={16} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Permission Granted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <X size={16} className="text-red-600" />
            </div>
            <span className="text-sm text-gray-600">Permission Denied</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="btn-primary">Save Changes</button>
      </div>
    </div>
  );
};

export default Permissions;
