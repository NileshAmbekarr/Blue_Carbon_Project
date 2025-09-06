// pages/audits/MRVReview.tsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PhotoIcon,
  MapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/auth/useAuth';
import { auditsAPI } from '../../services/api/audits';

const MRVReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('report');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_changes' | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  const { data: mrvReport, isLoading, error } = useQuery({
    queryKey: ['mrv-report', id],
    queryFn: () => auditsAPI.getMRVReport(id!),
    enabled: !!id,
  });

  const { data: evidence } = useQuery({
    queryKey: ['mrv-evidence', id],
    queryFn: () => auditsAPI.getMRVEvidence(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: (data: any) => auditsAPI.approveMRV(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mrv-report', id] });
      queryClient.invalidateQueries({ queryKey: ['mrv-queue'] });
      navigate('/audits');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: any) => auditsAPI.rejectMRV(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mrv-report', id] });
      queryClient.invalidateQueries({ queryKey: ['mrv-queue'] });
      navigate('/audits');
    },
  });

  const requestChangesMutation = useMutation({
    mutationFn: (data: any) => auditsAPI.requestMRVChanges(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mrv-report', id] });
      queryClient.invalidateQueries({ queryKey: ['mrv-queue'] });
      navigate('/audits');
    },
  });

  const tabs = [
    { id: 'report', name: 'MRV Report', icon: DocumentTextIcon },
    { id: 'evidence', name: 'Evidence', icon: PhotoIcon },
    { id: 'location', name: 'Location', icon: MapIcon },
  ];

  const handleReviewSubmit = () => {
    const reviewData = {
      auditorId: user?.id,
      note: reviewNote,
      timestamp: new Date().toISOString(),
    };

    if (reviewAction === 'approve') {
      approveMutation.mutate(reviewData);
    } else if (reviewAction === 'reject') {
      rejectMutation.mutate(reviewData);
    } else if (reviewAction === 'request_changes') {
      requestChangesMutation.mutate(reviewData);
    }

    setShowReviewModal(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
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

  if (error || !mrvReport) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">
          Error loading MRV report: {error?.message || 'Report not found'}
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
                to="/audits"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Queue
              </Link>
            </div>
            
            {mrvReport.status === 'pending' && (
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setReviewAction('request_changes');
                    setShowReviewModal(true);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-yellow-300 shadow-sm text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Request Changes
                </button>
                
                <button
                  onClick={() => {
                    setReviewAction('reject');
                    setShowReviewModal(true);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Reject
                </button>
                
                <button
                  onClick={() => {
                    setReviewAction('approve');
                    setShowReviewModal(true);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Approve
                </button>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  MRV Report #{mrvReport.id}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {mrvReport.project?.name} - {mrvReport.project?.ownerOrg?.name}
                </p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mrvReport.status)}`}>
                {mrvReport.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Carbon Credits</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {mrvReport.tCO2e} tCO₂e
                </dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Uncertainty</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  ±{(mrvReport.uncertainty * 100).toFixed(1)}%
                </dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">
                  {new Date(mrvReport.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Auditor</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">
                  {mrvReport.auditor || 'Unassigned'}
                </dd>
              </div>
            </div>
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
          {activeTab === 'report' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Report Summary</h4>
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Reporting Period</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {mrvReport.reportingPeriod || 'Q3 2024'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Methodology</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {mrvReport.methodology || 'Blue Carbon v1.2'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Area Monitored</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {mrvReport.monitoredArea || 'N/A'} hectares
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Monitoring Events</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {mrvReport.monitoringEventIds?.length || 0} events
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900">Report Document</h4>
                {mrvReport.reportHash ? (
                  <div className="mt-2 flex items-center space-x-2">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    <a
                      href={`/api/files/${mrvReport.reportHash}`}
                      className="text-blue-600 hover:text-blue-500"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View MRV Report (PDF)
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500">No report document available.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Monitoring Evidence</h4>
                {evidence && evidence.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {evidence.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">
                              {item.type || 'Evidence'}
                            </h5>
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          <button className="text-blue-600 hover:text-blue-500">
                            <PhotoIcon className="h-5 w-5" />
                          </button>
                        </div>
                        {item.description && (
                          <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-center py-8">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No evidence available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No monitoring evidence has been uploaded for this report.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'location' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Project Location</h4>
                <div className="mt-4 h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Map integration coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center">
                {reviewAction === 'approve' && <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />}
                {reviewAction === 'reject' && <XCircleIcon className="h-6 w-6 text-red-600 mr-2" />}
                {reviewAction === 'request_changes' && <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-2" />}
                <h3 className="text-lg font-medium text-gray-900">
                  {reviewAction === 'approve' && 'Approve MRV Report'}
                  {reviewAction === 'reject' && 'Reject MRV Report'}
                  {reviewAction === 'request_changes' && 'Request Changes'}
                </h3>
              </div>
              
              <div className="mt-4">
                <label htmlFor="review-note" className="block text-sm font-medium text-gray-700">
                  Review Notes
                </label>
                <textarea
                  id="review-note"
                  rows={4}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add your review notes..."
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewSubmit}
                  disabled={!reviewNote.trim()}
                  className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
                    reviewAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : reviewAction === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {reviewAction === 'approve' && 'Approve'}
                  {reviewAction === 'reject' && 'Reject'}
                  {reviewAction === 'request_changes' && 'Request Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MRVReview;