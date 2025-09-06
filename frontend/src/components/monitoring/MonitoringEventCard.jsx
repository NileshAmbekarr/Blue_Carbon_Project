// components/monitoring/MonitoringEventCard.jsx
import React, { useState } from 'react';
import {
  CalendarIcon,
  MapPinIcon,
  PhotoIcon,
  DocumentTextIcon,
  UserIcon,
  EyeIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import EvidenceViewer from '../evidence/EvidenceViewer';

const MonitoringEventCard = ({ event, onViewDetails = null }) => {
  const [showEvidenceViewer, setShowEvidenceViewer] = useState(false);
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0);

  const handleViewEvidence = (index = 0) => {
    setSelectedEvidenceIndex(index);
    setShowEvidenceViewer(true);
  };

  const getEventTypeColor = (type) => {
    const colors = {
      'field_survey': 'bg-green-100 text-green-800',
      'drone_survey': 'bg-blue-100 text-blue-800',
      'satellite_analysis': 'bg-purple-100 text-purple-800',
      'water_quality': 'bg-cyan-100 text-cyan-800',
      'biodiversity': 'bg-yellow-100 text-yellow-800',
      'restoration': 'bg-orange-100 text-orange-800',
      'maintenance': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getEventTypeLabel = (type) => {
    const labels = {
      'field_survey': 'Field Survey',
      'drone_survey': 'Drone Survey',
      'satellite_analysis': 'Satellite Analysis',
      'water_quality': 'Water Quality',
      'biodiversity': 'Biodiversity Assessment',
      'restoration': 'Restoration Activity',
      'maintenance': 'Maintenance'
    };
    return labels[type] || type;
  };

  const evidenceCount = event.evidence?.length || 0;
  const photoCount = event.evidence?.filter(e => e.fileType?.startsWith('image/')).length || 0;
  const documentCount = evidenceCount - photoCount;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {event.title || `Monitoring Event ${event.id}`}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                  {getEventTypeLabel(event.type)}
                </span>
              </div>
              
              {event.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {event.description}
                </p>
              )}
            </div>
            
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(event)}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>{new Date(event.timestamp || event.createdAt).toLocaleDateString()}</span>
            </div>
            
            {(event.latitude && event.longitude) && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4 mr-2" />
                <span>{event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</span>
              </div>
            )}
            
            {event.collectedBy && (
              <div className="flex items-center text-sm text-gray-600">
                <UserIcon className="h-4 w-4 mr-2" />
                <span>{event.collectedBy.name || event.collectedBy}</span>
              </div>
            )}
            
            {event.plotId && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Plot:</span>
                <span className="ml-1">{event.plotName || event.plotId}</span>
              </div>
            )}
          </div>

          {/* Evidence Summary */}
          {evidenceCount > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {photoCount > 0 && (
                    <div className="flex items-center">
                      <PhotoIcon className="h-4 w-4 mr-1" />
                      <span>{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {documentCount > 0 && (
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      <span>{documentCount} document{documentCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleViewEvidence(0)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View Evidence
                </button>
              </div>

              {/* Evidence Thumbnails */}
              {event.evidence && event.evidence.length > 0 && (
                <div className="mt-3 flex space-x-2 overflow-x-auto">
                  {event.evidence.slice(0, 4).map((evidence, index) => (
                    <button
                      key={evidence.id || index}
                      onClick={() => handleViewEvidence(index)}
                      className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 overflow-hidden"
                    >
                      {evidence.fileType?.startsWith('image/') ? (
                        <img
                          src={evidence.url || `/api/files/${evidence.hash}`}
                          alt={evidence.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${evidence.fileType?.startsWith('image/') ? 'hidden' : ''}`}>
                        <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    </button>
                  ))}
                  {event.evidence.length > 4 && (
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-600">+{event.evidence.length - 4}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No Evidence State */}
          {evidenceCount === 0 && (
            <div className="border-t border-gray-200 pt-4">
              <div className="text-center py-3">
                <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-1 text-sm text-gray-500">No evidence uploaded</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Evidence Viewer Modal */}
      {showEvidenceViewer && event.evidence && (
        <EvidenceViewer
          evidence={event.evidence}
          selectedIndex={selectedEvidenceIndex}
          onClose={() => setShowEvidenceViewer(false)}
        />
      )}
    </>
  );
};

export default MonitoringEventCard;
