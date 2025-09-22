import React from 'react';
import { useBlockchainStatus } from '../hooks/useBlockchainRegistry';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

/**
 * Blockchain Status Widget for Blue Carbon Dashboard
 * Shows real-time blockchain connection and transaction status
 */
export const BlockchainStatusWidget = ({ className = '' }) => {
  const { data: status, isLoading, error } = useBlockchainStatus();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !status?.isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 border-l-4 border-red-500 ${className}`}>
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Blockchain Disconnected</h3>
            <p className="text-xs text-red-600 mt-1">
              {error?.message || status?.error || 'Unable to connect to blockchain'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!status.isConnected) return 'red';
    return 'green';
  };

  const statusColor = getStatusColor();

  return (
    <div className={`bg-white rounded-lg shadow p-4 border-l-4 border-${statusColor}-500 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CheckCircleIcon className={`h-5 w-5 text-${statusColor}-500 mr-2`} />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Blockchain Connected</h3>
            <p className="text-xs text-gray-600">
              {status.network?.name} (Chain ID: {status.network?.chainId})
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Block #{status.blockNumber}</div>
          <div className="text-xs text-gray-500">
            Environment: <span className="font-medium">{status.environment}</span>
          </div>
        </div>
      </div>
      
      {status.gasPrice && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Gas Price:</span>
            <span>{Math.round(Number(status.gasPrice) / 1e9)} Gwei</span>
          </div>
        </div>
      )}
      
      {status.lastSync && (
        <div className="mt-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Last Sync:</span>
            <span>{new Date(status.lastSync).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Transaction Status Component
 * Shows pending transactions and their status
 */
export const TransactionStatus = ({ transactions = [], className = '' }) => {
  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">Pending Transactions</h3>
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div key={tx.hash} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 text-yellow-500 mr-2" />
              <div>
                <div className="text-xs font-medium text-gray-900">{tx.type}</div>
                <div className="text-xs text-gray-500">
                  {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {Math.round((Date.now() - new Date(tx.timestamp)) / 1000)}s ago
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Blockchain Analytics Summary
 * Shows key metrics from the blockchain
 */
export const BlockchainAnalyticsSummary = ({ className = '' }) => {
  const { data: analytics, isLoading } = useBlockchainAnalytics();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const metrics = [
    {
      label: 'Total Projects',
      value: analytics.totalProjects?.toLocaleString() || '0',
      color: 'blue'
    },
    {
      label: 'Credits Issued',
      value: analytics.totalCreditsIssued?.toLocaleString() || '0',
      color: 'green'
    },
    {
      label: 'Credits Retired',
      value: analytics.totalCreditsRetired?.toLocaleString() || '0',
      color: 'purple'
    },
    {
      label: 'Active Auditors',
      value: analytics.totalAuditors?.toLocaleString() || '0',
      color: 'orange'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-4">Blockchain Metrics</h3>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="text-xs text-gray-500 mb-1">{metric.label}</div>
            <div className={`text-lg font-semibold text-${metric.color}-600`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>
      
      {analytics.lastUpdated && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainStatusWidget;
