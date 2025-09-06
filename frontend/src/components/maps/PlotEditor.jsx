// components/maps/PlotEditor.jsx
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const PlotEditor = ({ 
  projectBounds, 
  existingPlots = [], 
  onPlotsChange, 
  onSave, 
  onCancel,
  isEditing = false 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [currentPlots, setCurrentPlots] = useState(existingPlots);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/satellite/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
      center: projectBounds ? [
        (projectBounds[0] + projectBounds[2]) / 2,
        (projectBounds[1] + projectBounds[3]) / 2
      ] : [0, 0],
      zoom: 15,
    });

    // Add project boundary if provided
    if (projectBounds) {
      const [minLng, minLat, maxLng, maxLat] = projectBounds;
      const boundaryPolygon = [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat]
      ];

      map.current.on('load', () => {
        map.current.addSource('project-boundary', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [boundaryPolygon]
            }
          }
        });

        map.current.addLayer({
          id: 'project-boundary',
          type: 'line',
          source: 'project-boundary',
          layout: {},
          paint: {
            'line-color': '#ef4444',
            'line-width': 3,
            'line-dasharray': [2, 2]
          }
        });

        // Fit map to project bounds
        map.current.fitBounds([
          [minLng, minLat],
          [maxLng, maxLat]
        ], { padding: 50 });
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [projectBounds]);

  const handleSave = () => {
    // For now, just save the existing plots
    onSave?.(currentPlots);
  };

  return (
    <div className="relative h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Info Panel */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center mb-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Plot Editor</h3>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Advanced polygon drawing coming soon</p>
          <p>• Currently showing project boundary</p>
          <p className="text-xs text-red-600 mt-2">
            Red dashed line shows project boundary
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Total Plots: {currentPlots.length}
          </div>
          <div className="text-xs text-gray-500">
            Total Area: {currentPlots.reduce((sum, plot) => sum + (plot.area || 0), 0).toFixed(2)} ha
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button
          onClick={onCancel}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <XMarkIcon className="h-4 w-4 mr-2" />
          Cancel
        </button>
        
        <button
          onClick={handleSave}
          className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          <CheckIcon className="h-4 w-4 mr-2" />
          Save Plots
        </button>
      </div>
    </div>
  );
};

export default PlotEditor;
