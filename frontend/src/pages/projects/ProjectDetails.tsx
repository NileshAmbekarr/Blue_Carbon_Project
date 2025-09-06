// pages/projects/ProjectDetails.tsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapIcon,
  DocumentTextIcon,
  PhotoIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  ClockIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/auth/useAuth';
import { projectsAPI } from '../../services/api/projects';
import { ProjectMap } from '../../components/maps/ProjectMap';
import MonitoringEventCard from '../../components/monitoring/MonitoringEventCard';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user, isDeveloper, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.getProject(id),
  });

  const { data: plots } = useQuery({
    queryKey: ['project-plots', id],
    queryFn: () => projectsAPI.getProjectPlots(id),
    enabled: !!id,
  });

  const { data: monitoringEvents } = useQuery({
    queryKey: ['monitoring-events', id],
    queryFn: () => projectsAPI.getMonitoringEvents(id),
    enabled: !!id,
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: DocumentTextIcon },
    { id: 'plots', name: 'Plots', icon: MapIcon },
    { id: 'monitoring', name: 'Monitoring', icon: PhotoIcon },
  ];

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      monitoring: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">
          Error loading project: {error?.message || 'Project not found'}
        </div>
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
                to="/projects"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Projects
              </Link>
            </div>
            
            {(isDeveloper || isAdmin) && (
              <div className="flex space-x-3">
                <Link
                  to={`/projects/${id}/edit`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Project
                </Link>
                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  Upload Evidence
                </button>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {project.ownerOrg?.name || 'Unknown Organization'}
                </p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Total Area</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {project.totalArea || 0} ha
                </dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Plots</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {plots?.length || 0}
                </dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Credits Issued</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {project.creditsIssued || 0}
                </dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">
                  {new Date(project.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Project Location</h3>
          <div className="h-96 rounded-lg overflow-hidden">
            <ProjectMap 
              project={project} 
              plots={plots || []} 
              height="100%" 
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Description</h4>
                <p className="mt-2 text-gray-600">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900">Habitat Type</h4>
                <p className="mt-2 text-gray-600">
                  {project.habitat || 'Not specified'}
                </p>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900">Baseline Documentation</h4>
                {project.baselineDocHash ? (
                  <div className="mt-2 flex items-center space-x-2">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    <a
                      href={`/api/files/${project.baselineDocHash}`}
                      className="text-blue-600 hover:text-blue-500"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Baseline Document
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500">No baseline document uploaded.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'plots' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium text-gray-900">Project Plots</h4>
                {(isDeveloper || isAdmin) && (
                  <Link
                    to={`/projects/${id}/plots/create`}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Plot
                  </Link>
                )}
              </div>

              {plots && plots.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {plots.map((plot) => (
                    <div key={plot.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-gray-900">
                          Plot {plot.id}
                        </h5>
                        <span className="text-xs text-gray-500">
                          {plot.areaHectares} ha
                        </span>
                      </div>
                      <div className="mt-2 flex justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-500 text-sm">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {(isDeveloper || isAdmin) && (
                          <button className="text-gray-600 hover:text-gray-500 text-sm">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No plots defined</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first plot.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium text-gray-900">Monitoring Events</h4>
                {(user?.roles.includes('Admin') || user?.roles.includes('Developer') || project.ownerId === user?.id) && (
                  <div className="flex space-x-2">
                    <Link
                      to={`/projects/${project.id}/monitoring`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View All Events
                    </Link>
                    <Link
                      to={`/projects/${project.id}/plots`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <MapIcon className="h-4 w-4 mr-2" />
                      Edit Plots
                    </Link>
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit Project
                    </button>
                  </div>
                )}
              </div>

              {monitoringEvents && monitoringEvents.length > 0 ? (
                <div className="space-y-4">
                  {monitoringEvents.slice(0, 3).map((event) => (
                    <MonitoringEventCard key={event.id} event={event} />
                  ))}
                  {monitoringEvents.length > 3 && (
                    <div className="text-center pt-4">
                      <Link
                        to={`/projects/${project.id}/monitoring`}
                        className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                      >
                        View all {monitoringEvents.length} monitoring events →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No monitoring events</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start monitoring by uploading evidence and data.
                  </p>
                  {(user?.roles.includes('Admin') || user?.roles.includes('Developer') || project.ownerId === user?.id) && (
                    <div className="mt-4">
                      <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add First Event
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;