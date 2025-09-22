import React, { useState } from 'react';
import { useCarbonCredits } from '../hooks/useBlockchainRegistry';
import { useAccount } from 'wagmi';
import { 
  CurrencyDollarIcon, 
  ArrowPathIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

/**
 * Credit Batch Card Component
 * Displays information about a carbon credit batch
 */
export const CreditBatchCard = ({ tokenId, projectId, className = '' }) => {
  const { data: batchInfo, isLoading } = useCarbonCredits().useBatchInfo(tokenId);
  const { address } = useAccount();
  const { data: userBalance } = useCarbonCredits().useUserBalance(address, tokenId);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!batchInfo?.exists) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 border border-gray-200 ${className}`}>
        <div className="text-center text-gray-500">
          <InformationCircleIcon className="h-8 w-8 mx-auto mb-2" />
          <p>Credit batch not found</p>
        </div>
      </div>
    );
  }

  const availableCredits = Number(batchInfo.totalIssued) - Number(batchInfo.totalRetired);
  const retirementPercentage = (Number(batchInfo.totalRetired) / Number(batchInfo.totalIssued)) * 100;

  return (
    <div className={`bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Credit Batch #{tokenId}
          </h3>
          <p className="text-sm text-gray-600">Vintage {batchInfo.vintage}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Your Balance</div>
          <div className="text-lg font-semibold text-green-600">
            {userBalance ? Number(userBalance).toLocaleString() : '0'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Total Issued</div>
          <div className="text-sm font-medium text-gray-900">
            {Number(batchInfo.totalIssued).toLocaleString()} tCO₂e
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Total Retired</div>
          <div className="text-sm font-medium text-gray-900">
            {Number(batchInfo.totalRetired).toLocaleString()} tCO₂e
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Available</div>
          <div className="text-sm font-medium text-green-600">
            {availableCredits.toLocaleString()} tCO₂e
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Retirement Rate</div>
          <div className="text-sm font-medium text-gray-900">
            {retirementPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Retirement Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Retirement Progress</span>
          <span>{retirementPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(retirementPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        <div>Issued: {new Date(Number(batchInfo.issuedAt) * 1000).toLocaleDateString()}</div>
        <div>Issuer: {batchInfo.issuer.slice(0, 10)}...{batchInfo.issuer.slice(-8)}</div>
      </div>
    </div>
  );
};

/**
 * Credit Retirement Form
 * Allows users to retire their carbon credits
 */
export const CreditRetirementForm = ({ tokenId, userBalance, onSuccess, className = '' }) => {
  const [amount, setAmount] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { retireCredits, isRetiring } = useCarbonCredits();
  const { address } = useAccount();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || !beneficiary || !reason) {
      toast.error('Please fill in all fields');
      return;
    }

    if (Number(amount) > Number(userBalance)) {
      toast.error('Insufficient balance');
      return;
    }

    if (Number(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    
    try {
      retireCredits({
        tokenId,
        amount,
        beneficiary,
        reason
      });
      
      // Reset form
      setAmount('');
      setBeneficiary('');
      setReason('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(`Retirement failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isRetiring || isSubmitting;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Retire Credits</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount to Retire
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              max={userBalance}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-gray-500 text-sm">tCO₂e</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Available: {Number(userBalance || 0).toLocaleString()} tCO₂e
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beneficiary Address
          </label>
          <input
            type="text"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            placeholder="0x... or ENS name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setBeneficiary(address)}
            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            disabled={isLoading}
          >
            Use my address
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Retirement Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Corporate carbon neutrality for 2024"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !amount || !beneficiary || !reason}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Retiring Credits...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Retire Credits
            </>
          )}
        </button>
      </form>
    </div>
  );
};

/**
 * Credit Minting Form (Admin/Issuer only)
 * Allows authorized users to mint new credit batches
 */
export const CreditMintingForm = ({ projectId, mrvId, onSuccess, className = '' }) => {
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    vintage: new Date().getFullYear(),
    metadataHash: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { mintCredits, isMinting } = useCarbonCredits();
  const { address } = useAccount();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.recipient || !formData.amount || !formData.metadataHash) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (Number(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    
    try {
      mintCredits({
        projectId,
        mrvId,
        recipient: formData.recipient,
        amount: formData.amount,
        vintage: formData.vintage,
        metadataHash: formData.metadataHash
      });
      
      // Reset form
      setFormData({
        recipient: '',
        amount: '',
        vintage: new Date().getFullYear(),
        metadataHash: ''
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(`Minting failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isMinting || isSubmitting;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Mint Credit Batch</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Address *
          </label>
          <input
            type="text"
            value={formData.recipient}
            onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
            placeholder="0x... or ENS name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setFormData({ ...formData, recipient: address })}
            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            disabled={isLoading}
          >
            Use my address
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (tCO₂e) *
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="Enter amount"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vintage Year
          </label>
          <input
            type="number"
            value={formData.vintage}
            onChange={(e) => setFormData({ ...formData, vintage: Number(e.target.value) })}
            min="2020"
            max={new Date().getFullYear() + 1}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Metadata IPFS Hash *
          </label>
          <input
            type="text"
            value={formData.metadataHash}
            onChange={(e) => setFormData({ ...formData, metadataHash: e.target.value })}
            placeholder="QmHash..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !formData.recipient || !formData.amount || !formData.metadataHash}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Minting Credits...
            </>
          ) : (
            <>
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              Mint Credits
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreditBatchCard;
