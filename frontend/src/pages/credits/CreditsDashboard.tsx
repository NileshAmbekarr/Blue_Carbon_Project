// pages/credits/CreditsDashboard.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/auth/useAuth';
import { creditsAPI } from '../../services/api/credits';

const CreditsDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);

  const { data: creditBatches, isLoading } = useQuery({
    queryKey: ['credit-batches'],
    queryFn: () => creditsAPI.getCreditBatches(),
  });

  const { data: creditStats } = useQuery({
    queryKey: ['credit-stats'],
    queryFn: () => creditsAPI.getCreditStats(),
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => creditsAPI.transferCredits(data.batchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-batches'] });
      queryClient.invalidateQueries({ queryKey: ['credit-stats'] });
      setShowTransferModal(false);
      setSelectedBatch(null);
    },
  });

  const retireMutation = useMutation({
    mutationFn: (data: any) => creditsAPI.retireCredits(data.batchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-batches'] });
      queryClient.invalidateQueries({ queryKey: ['credit-stats'] });
      setShowRetireModal(false);
      setSelectedBatch(null);
    },
  });

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'issued', label: 'Issued' },
    { value: 'transferred', label: 'Transferred' },
    { value: 'retired', label: 'Retired' }
  ];

  const filteredBatches = creditBatches?.filter(batch => {
    if (searchTerm && !batch.id.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !batch.project?.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && batch.status !== statusFilter) {
      return false;
    }
    return true;
  }) || [];

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      issued: 'bg-green-100 text-green-800',
      transferred: 'bg-blue-100 text-blue-800',
      retired: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const canManageCredits = user?.roles.includes('Admin') || user?.roles.includes('Developer');

  if (isLoading) {
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Credits Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage carbon credit batches and transactions
              </p>
            </div>
            
            {canManageCredits && (
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Issue Credits
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Total Credits</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {creditStats?.totalCredits?.toLocaleString() || 0}
              </dd>
              <dd className="text-xs text-gray-600">tCO₂e</dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Available</dt>
              <dd className="mt-1 text-2xl font-semibold text-green-600">
                {creditStats?.availableCredits?.toLocaleString() || 0}
              </dd>
              <dd className="text-xs text-gray-600">tCO₂e</dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Transferred</dt>
              <dd className="mt-1 text-2xl font-semibold text-blue-600">
                {creditStats?.transferredCredits?.toLocaleString() || 0}
              </dd>
              <dd className="text-xs text-gray-600">tCO₂e</dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Retired</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-600">
                {creditStats?.retiredCredits?.toLocaleString() || 0}
              </dd>
              <dd className="text-xs text-gray-600">tCO₂e</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
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
                  placeholder="Search batches..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Batches */}
      {filteredBatches.length > 0 ? (
        <div className="space-y-4">
          {filteredBatches.map((batch) => (
            <div key={batch.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        Batch #{batch.id}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                        {batch.status}
                      </span>
                      {batch.blockchainTxHash && (
                        <a
                          href={`https://etherscan.io/tx/${batch.blockchainTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-500"
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          Blockchain
                        </a>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {batch.project?.name} • {batch.quantity} tCO₂e
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>Issued {new Date(batch.issuedAt || batch.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {batch.vintage && (
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-4 w-4 mr-2" />
                          <span>Vintage {batch.vintage}</span>
                        </div>
                      )}
                      
                      {batch.serialNumber && (
                        <div className="flex items-center">
                          <span className="font-medium">Serial:</span>
                          <span className="ml-1 font-mono text-xs">{batch.serialNumber}</span>
                        </div>
                      )}
                    </div>

                    {batch.methodology && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Methodology:</span> {batch.methodology}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => setSelectedBatch(batch)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    
                    {canManageCredits && batch.status === 'issued' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedBatch(batch);
                            setShowTransferModal(true);
                          }}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <ArrowUpIcon className="h-4 w-4 mr-2" />
                          Transfer
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedBatch(batch);
                            setShowRetireModal(true);
                          }}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <ArrowDownIcon className="h-4 w-4 mr-2" />
                          Retire
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                {(batch.transferHistory?.length > 0 || batch.retirements?.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex space-x-4">
                        {batch.transferHistory?.length > 0 && (
                          <span className="text-gray-500">
                            {batch.transferHistory.length} transfer(s)
                          </span>
                        )}
                        {batch.retirements?.length > 0 && (
                          <span className="text-gray-500">
                            {batch.retirements.reduce((sum: number, r: any) => sum + r.quantity, 0)} retired
                          </span>
                        )}
                      </div>
                      
                      {batch.currentOwner && batch.currentOwner !== batch.originalOwner && (
                        <span className="text-gray-500">
                          Owner: {batch.currentOwner}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No credit batches found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters to see more batches.'
              : 'Credit batches will appear here once they are issued.'}
          </p>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedBatch && (
        <TransferModal
          batch={selectedBatch}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedBatch(null);
          }}
          onTransfer={(data) => transferMutation.mutate({ batchId: selectedBatch.id, ...data })}
          isLoading={transferMutation.isPending}
        />
      )}

      {/* Retire Modal */}
      {showRetireModal && selectedBatch && (
        <RetireModal
          batch={selectedBatch}
          onClose={() => {
            setShowRetireModal(false);
            setSelectedBatch(null);
          }}
          onRetire={(data) => retireMutation.mutate({ batchId: selectedBatch.id, ...data })}
          isLoading={retireMutation.isPending}
        />
      )}
    </div>
  );
};

// Transfer Modal Component
const TransferModal = ({ batch, onClose, onTransfer, isLoading }: any) => {
  const [transferData, setTransferData] = useState({
    toAddress: '',
    quantity: batch.quantity,
    reason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTransfer(transferData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center mb-4">
            <ArrowUpIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Transfer Credits</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Recipient Address</label>
              <input
                type="text"
                required
                value={transferData.toAddress}
                onChange={(e) => setTransferData({ ...transferData, toAddress: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity (tCO₂e)</label>
              <input
                type="number"
                required
                min="1"
                max={batch.quantity}
                value={transferData.quantity}
                onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Available: {batch.quantity} tCO₂e</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Transfer Reason</label>
              <textarea
                rows={3}
                value={transferData.reason}
                onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional reason for transfer..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Transferring...' : 'Transfer Credits'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Retire Modal Component
const RetireModal = ({ batch, onClose, onRetire, isLoading }: any) => {
  const [retireData, setRetireData] = useState({
    quantity: batch.quantity,
    reason: '',
    beneficiary: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRetire(retireData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center mb-4">
            <ArrowDownIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Retire Credits</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity (tCO₂e)</label>
              <input
                type="number"
                required
                min="1"
                max={batch.quantity}
                value={retireData.quantity}
                onChange={(e) => setRetireData({ ...retireData, quantity: parseInt(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Available: {batch.quantity} tCO₂e</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Beneficiary</label>
              <input
                type="text"
                value={retireData.beneficiary}
                onChange={(e) => setRetireData({ ...retireData, beneficiary: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="On behalf of..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Retirement Reason</label>
              <textarea
                rows={3}
                required
                value={retireData.reason}
                onChange={(e) => setRetireData({ ...retireData, reason: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Reason for retirement..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Retiring...' : 'Retire Credits'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreditsDashboard;