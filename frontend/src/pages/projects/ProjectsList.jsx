// pages/projects/ProjectsList.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  MapIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/auth/useAuth';
import { projectsAPI } from '../../services/api/projects';
import { useMockProjects } from '../../hooks/queries/useMockQueries';

const ProjectsListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [habitatFilter, setHabitatFilter] = useState('all');
  const { isDeveloper, isAdmin } = useAuth();

  const { data: projectss, isLoading, isError, error } = useQuery({
    queryKey: ['projects', { search: searchTerm, status: statusFilter, habitat: habitatFilter }],
    queryFn: () => projectsAPI.getProjects({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      habitat: habitatFilter !== 'all' ? habitatFilter : undefined,
    }),
  });

  const { data: projects } = useMockProjects();

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'completed', label: 'Completed' },
  ];

  const habitatOptions = [
    { value: 'all', label: 'All Habitats' },
    { value: 'mangrove', label: 'Mangrove' },
    { value: 'seagrass', label: 'Seagrass' },
    { value: 'saltmarsh', label: 'Salt Marsh' },
    { value: 'coastal_wetland', label: 'Coastal Wetland' },
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

  const ProjectCard = ({ project }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {project.name}
              </h3>
              <p className="text-sm text-gray-500">
                {project.ownerOrg?.name || 'Unknown Organization'}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <MapIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
            <span>{project.totalArea || 0} hectares</span>
            <span className="mx-2">•</span>
            <span>{project.habitat || 'Mixed'}</span>
          </div>
          
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
            <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
          
          {project.description && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        
        <div className="mt-5 flex justify-between items-center">
          <div className="flex space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
              {project.plotsCount || 0} plots
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
              {project.creditsIssued || 0} credits
            </span>
          </div>
          
          <Link
            to={`/projects/${project.id}`}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Details
          </Link>
        </div>
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

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">
          Error loading projects: {error?.message || 'Something went wrong'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and monitor your blue carbon restoration projects
          </p>
        </div>
        
        {(isDeveloper || isAdmin) && (
          <Link
            to="/projects/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Create Project
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Habitat Filter */}
            <div>
              <select
                value={habitatFilter}
                onChange={(e) => setHabitatFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {habitatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || habitatFilter !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by creating your first project.'}
          </p>
          {(isDeveloper || isAdmin) && (
            <div className="mt-6">
              <Link
                to="/projects/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Create Project
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsListPage;