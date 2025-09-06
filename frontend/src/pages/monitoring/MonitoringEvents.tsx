// pages/monitoring/MonitoringEvents.tsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  FunnelIcon,
  CalendarIcon,
  MapIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/auth/useAuth';
import { projectsAPI } from '../../services/api/projects';
import MonitoringEventCard from '../../components/monitoring/MonitoringEventCard';

const MonitoringEvents = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.getProject(id!),
    enabled: !!id,
  });

  const { data: monitoringEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['monitoring-events', id],
    queryFn: () => projectsAPI.getMonitoringEvents(id!),
    enabled: !!id,
  });

  const eventTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'field_survey', label: 'Field Survey' },
    { value: 'drone_survey', label: 'Drone Survey' },
    { value: 'satellite_analysis', label: 'Satellite Analysis' },
    { value: 'water_quality', label: 'Water Quality' },
    { value: 'biodiversity', label: 'Biodiversity Assessment' },
    { value: 'restoration', label: 'Restoration Activity' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' }
  ];

  const filteredEvents = monitoringEvents?.filter(event => {
    // Search filter
    if (searchTerm && !event.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !event.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Type filter
    if (typeFilter !== 'all' && event.type !== typeFilter) {
      return false;
    }

    // Date filter
    if (dateFilter !== 'all') {
      const eventDate = new Date(event.timestamp || event.createdAt);
      const now = new Date();
      const daysDiff = (now.getTime() - eventDate.getTime()) / (1000 * 3600 * 24);
      
      switch (dateFilter) {
        case 'week':
          if (daysDiff > 7) return false;
          break;
        case 'month':
          if (daysDiff > 30) return false;
          break;
        case 'quarter':
          if (daysDiff > 90) return false;
          break;
        case 'year':
          if (daysDiff > 365) return false;
          break;
      }
    }

    return true;
  }) || [];

  const handleViewEventDetails = (event: any) => {
    setSelectedEvent(event);
  };

  const canAddEvents = user?.roles.includes('Admin') || 
                      user?.roles.includes('Developer') || 
                      project?.ownerId === user?.id;

  if (projectLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to={`/projects/${id}`}
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Project
              </Link>
              
              <div className="h-4 w-px bg-gray-300" />
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Monitoring Events
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {project?.name} - {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {canAddEvents && (
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Event
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Total Events</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {monitoringEvents?.length || 0}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">With Evidence</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {monitoringEvents?.filter(e => e.evidence?.length > 0).length || 0}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">This Month</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {monitoringEvents?.filter(e => {
                  const eventDate = new Date(e.timestamp || e.createdAt);
                  const now = new Date();
                  return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
                }).length || 0}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Field Surveys</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {monitoringEvents?.filter(e => e.type === 'field_survey').length || 0}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search events..."
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {dateFilters.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <MonitoringEventCard
              key={event.id}
              event={event}
              onViewDetails={handleViewEventDetails}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No monitoring events found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || typeFilter !== 'all' || dateFilter !== 'all'
              ? 'Try adjusting your filters to see more events.'
              : 'Get started by adding your first monitoring event.'}
          </p>
          {canAddEvents && (!searchTerm && typeFilter === 'all' && dateFilter === 'all') && (
            <div className="mt-6">
              <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Event
              </button>
            </div>
          )}
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Event Details
                </h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>
              
              <MonitoringEventCard
                event={selectedEvent}
                onViewDetails={null}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringEvents;
