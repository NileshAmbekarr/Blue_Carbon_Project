// pages/projects/PlotEditor.tsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  MapIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/auth/useAuth';
import { projectsAPI } from '../../services/api/projects';
import PlotEditorComponent from '../../components/maps/PlotEditor';

const PlotEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlots, setCurrentPlots] = useState<any[]>([]);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.getProject(id!),
    enabled: !!id,
  });

  const { data: plots } = useQuery({
    queryKey: ['project-plots', id],
    queryFn: () => projectsAPI.getProjectPlots(id!),
    enabled: !!id,
  });

  React.useEffect(() => {
    if (plots) {
      setCurrentPlots(plots || []);
    }
  }, [plots]);

  const updatePlotsMutation = useMutation({
    mutationFn: (plotsData: any) => projectsAPI.updateProjectPlots(id!, plotsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-plots', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setIsEditing(false);
      navigate(`/projects/${id}`);
    },
  });

  const handlePlotsChange = (updatedPlots: any[]) => {
    setCurrentPlots([...updatedPlots]);
  };

  const handleSave = (plotsData: any[]) => {
    updatePlotsMutation.mutate(plotsData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    navigate(`/projects/${id}`);
  };

  const startEditing = () => {
    setIsEditing(true);
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

  // Check permissions
  const canEdit = user?.roles.includes('Admin') || 
                 user?.roles.includes('Developer') || 
                 project.ownerId === user?.id;

  if (!canEdit) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="text-sm text-yellow-700">
          You don't have permission to edit plots for this project.
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
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
              <h1 className="text-lg font-medium text-gray-900">
                Plot Editor - {project.name}
              </h1>
              <p className="text-sm text-gray-600">
                Define and manage project plot boundaries
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={startEditing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add/Edit Plots
            </button>
          )}
        </div>
      </div>

      {/* Plot Statistics */}
      {!isEditing && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <dt className="text-sm font-medium text-gray-500">Total Plots</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">
                {currentPlots.length}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <dt className="text-sm font-medium text-gray-500">Total Area</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">
                {currentPlots.reduce((sum, plot) => sum + (plot.area || 0), 0).toFixed(2)} ha
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <dt className="text-sm font-medium text-gray-500">Mangrove Plots</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">
                {currentPlots.filter(plot => plot.habitat === 'mangrove').length}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <dt className="text-sm font-medium text-gray-500">Other Habitats</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">
                {currentPlots.filter(plot => plot.habitat !== 'mangrove').length}
              </dd>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative">
        {isEditing ? (
          <PlotEditorComponent
            projectBounds={project.bounds}
            existingPlots={currentPlots}
            onPlotsChange={handlePlotsChange}
            onSave={handleSave}
            onCancel={handleCancel}
            isEditing={isEditing}
          />
        ) : (
          <div className="h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Plot Editor</h3>
              <p className="mt-1 text-sm text-gray-500">
                Click "Add/Edit Plots" to start defining plot boundaries
              </p>
              {currentPlots.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    Current plots: {currentPlots.length} ({currentPlots.reduce((sum, plot) => sum + (plot.area || 0), 0).toFixed(2)} ha total)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Plot List (when not editing) */}
      {!isEditing && currentPlots.length > 0 && (
        <div className="bg-white border-t border-gray-200 px-4 py-3 max-h-48 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Current Plots</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {currentPlots.map((plot, index) => (
              <div key={plot.id || index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {plot.name || `Plot ${index + 1}`}
                    </h4>
                    <p className="text-xs text-gray-500 capitalize">
                      {plot.habitat} • {plot.area?.toFixed(2)} ha
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    plot.habitat === 'mangrove' ? 'bg-green-500' :
                    plot.habitat === 'seagrass' ? 'bg-blue-500' :
                    plot.habitat === 'saltmarsh' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                </div>
                {plot.description && (
                  <p className="mt-1 text-xs text-gray-600 truncate">
                    {plot.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {updatePlotsMutation.isPending && (
        <div className="absolute inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium text-gray-900">Saving plots...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotEditor;
