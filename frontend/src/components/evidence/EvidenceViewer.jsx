// components/evidence/EvidenceViewer.jsx
import React, { useState } from 'react';
import {
  PhotoIcon,
  DocumentTextIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  EyeIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const EvidenceViewer = ({ evidence = [], onClose, selectedIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const currentEvidence = evidence[currentIndex];

  const nextEvidence = () => {
    setCurrentIndex((prev) => (prev + 1) % evidence.length);
  };

  const prevEvidence = () => {
    setCurrentIndex((prev) => (prev - 1 + evidence.length) % evidence.length);
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) {
      return PhotoIcon;
    }
    return DocumentTextIcon;
  };

  const isImage = (fileType) => {
    return fileType?.startsWith('image/');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!currentEvidence) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No evidence available</h3>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 overflow-y-auto h-full w-full z-50">
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {evidence.length > 1 && (
                  <>
                    <button
                      onClick={prevEvidence}
                      className="p-1 rounded-md hover:bg-gray-100"
                    >
                      <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentIndex + 1} of {evidence.length}
                    </span>
                    <button
                      onClick={nextEvidence}
                      className="p-1 rounded-md hover:bg-gray-100"
                    >
                      <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  </>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {currentEvidence.name || 'Evidence'}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentEvidence.type || 'Monitoring Evidence'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isImage(currentEvidence.fileType) && (
                <button
                  onClick={() => setShowFullscreen(true)}
                  className="p-2 rounded-md hover:bg-gray-100"
                  title="View fullscreen"
                >
                  <ArrowsPointingOutIcon className="h-5 w-5 text-gray-600" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex">
            {/* Main Content */}
            <div className="flex-1 p-6">
              {/* File Preview */}
              <div className="mb-6">
                {isImage(currentEvidence.fileType) ? (
                  <div className="relative">
                    <img
                      src={currentEvidence.url || `/api/files/${currentEvidence.hash}`}
                      alt={currentEvidence.name}
                      className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">Image unavailable</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm font-medium text-gray-900">
                        {currentEvidence.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatFileSize(currentEvidence.size)}
                      </p>
                      <a
                        href={currentEvidence.url || `/api/files/${currentEvidence.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View Document
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {currentEvidence.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    {currentEvidence.description}
                  </p>
                </div>
              )}
            </div>

            {/* Metadata Sidebar */}
            <div className="w-80 bg-gray-50 p-6 border-l border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Evidence Details</h4>
              
              <div className="space-y-4">
                {/* Date */}
                <div className="flex items-start space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date Collected</p>
                    <p className="text-sm text-gray-600">
                      {new Date(currentEvidence.timestamp || currentEvidence.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {(currentEvidence.latitude && currentEvidence.longitude) && (
                  <div className="flex items-start space-x-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">
                        {currentEvidence.latitude.toFixed(6)}, {currentEvidence.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Collector */}
                {currentEvidence.collectedBy && (
                  <div className="flex items-start space-x-3">
                    <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Collected By</p>
                      <p className="text-sm text-gray-600">
                        {currentEvidence.collectedBy.name || currentEvidence.collectedBy}
                      </p>
                    </div>
                  </div>
                )}

                {/* File Info */}
                <div className="pt-4 border-t border-gray-200">
                  <h5 className="text-xs font-medium text-gray-900 uppercase tracking-wide mb-2">
                    File Information
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-900">{currentEvidence.fileType || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span className="text-gray-900">{formatFileSize(currentEvidence.size)}</span>
                    </div>
                    {currentEvidence.hash && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hash:</span>
                        <span className="text-gray-900 font-mono text-xs truncate ml-2">
                          {currentEvidence.hash.substring(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Status */}
                {currentEvidence.verified !== undefined && (
                  <div className="pt-4 border-t border-gray-200">
                    <h5 className="text-xs font-medium text-gray-900 uppercase tracking-wide mb-2">
                      Verification
                    </h5>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentEvidence.verified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {currentEvidence.verified ? 'Verified' : 'Pending Verification'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {showFullscreen && isImage(currentEvidence.fileType) && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-60 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={currentEvidence.url || `/api/files/${currentEvidence.hash}`}
              alt={currentEvidence.name}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceViewer;
