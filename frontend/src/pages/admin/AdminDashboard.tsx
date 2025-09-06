// pages/admin/AdminDashboard.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CogIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  KeyIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/auth/useAuth';

const AdminDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  // Mock data - in real app, these would come from API
  const { data: adminStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => ({
      totalUsers: 156,
      activeProjects: 23,
      pendingAudits: 8,
      totalOrganizations: 12,
      systemHealth: 'healthy',
      lastBackup: '2024-01-15T10:30:00Z'
    }),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => [
      { id: 1, name: 'John Doe', email: 'john@example.com', roles: ['Developer'], status: 'active', lastLogin: '2024-01-15T08:30:00Z' },
      { id: 2, name: 'Jane Smith', email: 'jane@audit.com', roles: ['Auditor'], status: 'active', lastLogin: '2024-01-14T16:45:00Z' },
      { id: 3, name: 'Bob Wilson', email: 'bob@nccr.org', roles: ['Admin'], status: 'inactive', lastLogin: '2024-01-10T12:15:00Z' }
    ],
  });

  const { data: organizations } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: async () => [
      { id: 1, name: 'NCCR India', type: 'Registry', status: 'active', projects: 15, members: 45 },
      { id: 2, name: 'Green Earth NGO', type: 'Developer', status: 'active', projects: 8, members: 12 },
      { id: 3, name: 'Carbon Auditors Ltd', type: 'Auditor', status: 'pending', projects: 0, members: 6 }
    ],
  });

  const { data: systemSettings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => ({
      platformName: 'Blue Carbon Registry',
      maintenanceMode: false,
      registrationOpen: true,
      maxFileSize: 50, // MB
      supportedFileTypes: ['pdf', 'jpg', 'png', 'docx'],
      emailNotifications: true,
      blockchainNetwork: 'ethereum-mainnet',
      apiRateLimit: 1000 // requests per hour
    }),
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'users', name: 'Users', icon: UserGroupIcon },
    { id: 'organizations', name: 'Organizations', icon: BuildingOfficeIcon },
    { id: 'settings', name: 'System Settings', icon: CogIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'logs', name: 'Audit Logs', icon: DocumentTextIcon }
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{adminStats?.totalUsers || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Organizations</dt>
                  <dd className="text-lg font-medium text-gray-900">{adminStats?.totalOrganizations || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                  <dd className="text-lg font-medium text-gray-900">{adminStats?.activeProjects || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Audits</dt>
                  <dd className="text-lg font-medium text-gray-900">{adminStats?.pendingAudits || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Overall Status</span>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-600">Healthy</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-sm text-gray-900">
                {adminStats?.lastBackup ? new Date(adminStats.lastBackup).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database Status</span>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">User Management</h3>
        <button
          onClick={() => setShowUserModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users?.map((user) => (
            <li key={user.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">
                      Roles: {user.roles.join(', ')} • Last login: {new Date(user.lastLogin).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-blue-600 hover:text-blue-500"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserModal(true);
                    }}
                    className="text-gray-600 hover:text-gray-500"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-500">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderOrganizations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Organization Management</h3>
        <button
          onClick={() => setShowOrgModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Organization
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {organizations?.map((org) => (
          <div key={org.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(org.status)}`}>
                      {org.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{org.type}</p>
                  <div className="mt-2 flex justify-between text-xs text-gray-400">
                    <span>{org.projects} projects</span>
                    <span>{org.members} members</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button className="text-blue-600 hover:text-blue-500">
                  <EyeIcon className="h-4 w-4" />
                </button>
                <button className="text-gray-600 hover:text-gray-500">
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
      
      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        <div className="p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">General Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Platform Name</p>
                <p className="text-sm text-gray-500">Display name for the platform</p>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-900 mr-2">{systemSettings?.platformName}</span>
                <button className="text-blue-600 hover:text-blue-500">
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-sm text-gray-500">Temporarily disable public access</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings?.maintenanceMode}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Registration Open</p>
                <p className="text-sm text-gray-500">Allow new user registrations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings?.registrationOpen}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">File Upload Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Max File Size</p>
                <p className="text-sm text-gray-500">Maximum file size for uploads</p>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-900 mr-2">{systemSettings?.maxFileSize} MB</span>
                <button className="text-blue-600 hover:text-blue-500">
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Supported File Types</p>
                <p className="text-sm text-gray-500">Allowed file extensions</p>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-900 mr-2">
                  {systemSettings?.supportedFileTypes?.join(', ')}
                </span>
                <button className="text-blue-600 hover:text-blue-500">
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">Blockchain Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Network</p>
                <p className="text-sm text-gray-500">Blockchain network for anchoring</p>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-900 mr-2">{systemSettings?.blockchainNetwork}</span>
                <button className="text-blue-600 hover:text-blue-500">
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
      
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">API Rate Limiting</p>
                <p className="text-sm text-gray-500">Requests per hour per user</p>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-900 mr-2">{systemSettings?.apiRateLimit}</span>
                <button className="text-blue-600 hover:text-blue-500">
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-base font-medium text-gray-900 mb-4">API Keys</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <KeyIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Blockchain API Key</p>
                      <p className="text-xs text-gray-500">Last used: 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    <button className="text-gray-600 hover:text-gray-500">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {[
            { id: 1, action: 'User Login', user: 'john@example.com', timestamp: '2024-01-15T10:30:00Z', status: 'success' },
            { id: 2, action: 'Project Created', user: 'jane@audit.com', timestamp: '2024-01-15T09:15:00Z', status: 'success' },
            { id: 3, action: 'Failed Login Attempt', user: 'unknown@email.com', timestamp: '2024-01-15T08:45:00Z', status: 'failed' },
            { id: 4, action: 'Settings Updated', user: 'admin@nccr.org', timestamp: '2024-01-14T16:20:00Z', status: 'success' }
          ].map((log) => (
            <li key={log.id}>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-2 w-2 rounded-full ${log.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      <p className="text-sm text-gray-500">{log.user}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUsers();
      case 'organizations':
        return renderOrganizations();
      case 'settings':
        return renderSettings();
      case 'security':
        return renderSecurity();
      case 'logs':
        return renderAuditLogs();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage users, organizations, and system settings
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                System Healthy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;