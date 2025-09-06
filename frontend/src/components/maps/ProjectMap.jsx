// components/maps/ProjectMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export const ProjectMap = ({ project, plots = [], height = '500px', isEditable = false }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(78.9629); // Default center of India
  const [lat, setLat] = useState(20.5937);
  const [zoom, setZoom] = useState(4);

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://api.maptiler.com/maps/streets/style.json?key=demo', // Use demo key or env var
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      // Add project boundary if available
      if (project?.polygons && project.polygons.length > 0) {
        const projectGeoJson = {
          type: 'FeatureCollection',
          features: project.polygons.map((polygon, index) => ({
            type: 'Feature',
            properties: {
              id: `project-${project.id}-${index}`,
              name: project.name,
              type: 'project'
            },
            geometry: polygon.geometry
          }))
        };

        map.current.addSource('project-boundary', {
          type: 'geojson',
          data: projectGeoJson,
        });

        map.current.addLayer({
          id: 'project-boundary-fill',
          type: 'fill',
          source: 'project-boundary',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.3,
          },
        });

        map.current.addLayer({
          id: 'project-boundary-line',
          type: 'line',
          source: 'project-boundary',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2,
          },
        });

        // Fit map to project boundary
        const bounds = new maplibregl.LngLatBounds();
        projectGeoJson.features.forEach(feature => {
          if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach(coord => {
              bounds.extend(coord);
            });
          }
        });
        
        if (!bounds.isEmpty()) {
          map.current.fitBounds(bounds, { padding: 50 });
        }
      }

      // Add plots if available
      if (plots && plots.length > 0) {
        const plotsGeoJson = {
          type: 'FeatureCollection',
          features: plots.map(plot => ({
            type: 'Feature',
            properties: {
              id: plot.id,
              area: plot.areaHectares,
              type: 'plot'
            },
            geometry: plot.polygonGeoJSON.geometry
          }))
        };

        map.current.addSource('plots', {
          type: 'geojson',
          data: plotsGeoJson,
        });

        map.current.addLayer({
          id: 'plots-fill',
          type: 'fill',
          source: 'plots',
          paint: {
            'fill-color': '#10b981',
            'fill-opacity': 0.4,
          },
        });

        map.current.addLayer({
          id: 'plots-line',
          type: 'line',
          source: 'plots',
          paint: {
            'line-color': '#10b981',
            'line-width': 2,
          },
        });

        // Add plot labels
        map.current.addLayer({
          id: 'plots-labels',
          type: 'symbol',
          source: 'plots',
          layout: {
            'text-field': ['concat', 'Plot ', ['get', 'id']],
            'text-font': ['Open Sans Regular'],
            'text-size': 12,
            'text-anchor': 'center',
          },
          paint: {
            'text-color': '#374151',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1,
          },
        });

        // Add click handlers for plots
        map.current.on('click', 'plots-fill', (e) => {
          const plot = e.features[0];
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">Plot ${plot.properties.id}</h3>
                <p class="text-sm text-gray-600">Area: ${plot.properties.area} hectares</p>
              </div>
            `)
            .addTo(map.current);
        });

        // Change cursor on hover
        map.current.on('mouseenter', 'plots-fill', () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', 'plots-fill', () => {
          map.current.getCanvas().style.cursor = '';
        });
      }
    });

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [project, plots, lat, lng, zoom]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full rounded-lg"
      style={{ height }}
    />
  );
};