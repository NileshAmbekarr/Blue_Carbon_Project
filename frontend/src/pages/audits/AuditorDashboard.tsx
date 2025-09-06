// pages/audits/AuditorDashboard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DocumentCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/auth/useAuth';
import { auditsAPI } from '../../services/api/audits';

const AuditorDashboard = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const { data: mrvQueue, isLoading, error } = useQuery({
    queryKey: ['mrv-queue', user?.id, statusFilter, priorityFilter],
    queryFn: () => auditsAPI.getMRVQueue(user?.id),
  });

  const statusOptions = [
    { value: 'pending', label: 'Pending Review', count: mrvQueue?.filter(item => item.status === 'pending').length || 0 },
    { value: 'in_review', label: 'In Review', count: mrvQueue?.filter(item => item.status === 'in_review').length || 0 },
    { value: 'approved', label: 'Approved', count: mrvQueue?.filter(item => item.status === 'approved').length || 0 },
    { value: 'rejected', label: 'Rejected', count: mrvQueue?.filter(item => item.status === 'rejected').length || 0 },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  const MRVCard = ({ mrv }) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-medium text-gray-900">
                {mrv.project?.name || `MRV Report ${mrv.id}`}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(mrv.status)}`}>
                {mrv.status}
              </span>
            </div>
            
            <p className="mt-1 text-sm text-gray-600">
              {mrv.project?.ownerOrg?.name || 'Unknown Organization'}
            </p>
            
            <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>Submitted {new Date(mrv.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center">
                <DocumentCheckIcon className="h-4 w-4 mr-1" />
                <span>{mrv.tCO2e} tCO₂e</span>
              </div>
              
              {mrv.priority && (
                <div className={`flex items-center ${getPriorityColor(mrv.priority)}`}>
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  <span className="capitalize">{mrv.priority} Priority</span>
                </div>
              )}
            </div>

            {mrv.uncertainty && (
              <div className="mt-2 text-sm text-gray-600">
                Uncertainty: ±{(mrv.uncertainty * 100).toFixed(1)}%
              </div>
            )}
          </div>
          
          <div className="flex flex-col space-y-2 ml-4">
            <Link
              to={`/audits/mrv/${mrv.id}`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Review
            </Link>
            
            {mrv.status === 'pending' && (
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Assign to Me
              </button>
            )}
          </div>
        </div>

        {mrv.monitoringEventIds && mrv.monitoringEventIds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Based on {mrv.monitoringEventIds.length} monitoring event(s)
              </span>
              <div className="flex space-x-1">
                {mrv.evidenceTypes?.map((type, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">
          Error loading MRV queue: {error?.message || 'Something went wrong'}
        </div>
      </div>
    );
  }

  const filteredMRV = mrvQueue?.filter(mrv => {
    if (statusFilter !== 'all' && mrv.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && mrv.priority !== priorityFilter) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MRV Review Queue</h1>
              <p className="mt-1 text-sm text-gray-600">
                Review and approve monitoring, reporting, and verification reports
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {mrvQueue?.filter(mrv => mrv.auditor === user?.id && mrv.status === 'approved').length || 0}
                </div>
                <div className="text-sm text-gray-500">Approved This Month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {statusOptions.map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`${
                  statusFilter === status.value
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                {status.label}
                {status.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    statusFilter === status.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'
                  }`}>
                    {status.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* MRV Queue */}
      {filteredMRV.length > 0 ? (
        <div className="space-y-4">
          {filteredMRV.map((mrv) => (
            <MRVCard key={mrv.id} mrv={mrv} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <DocumentCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No MRV reports found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter === 'pending' 
              ? 'No reports are currently pending review.'
              : `No reports match the selected filters.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default AuditorDashboard;