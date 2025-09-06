// components/web3/BlockchainCreditActions.jsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LinkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useWallet } from '../../hooks/web3/useWallet';
import blockchainService from '../../services/web3/blockchainService';
import { useProvider, useSigner } from 'wagmi';

const BlockchainCreditActions = ({ batch, onSuccess }) => {
  const { address, isConnected, isWalletLinked } = useWallet();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const queryClient = useQueryClient();
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [blockchainError, setBlockchainError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [txStatus, setTxStatus] = useState(null); // 'pending', 'confirmed', 'failed'

  // Initialize blockchain service
  const initializeBlockchain = async () => {
    if (!provider || !signer) {
      throw new Error('Wallet not connected');
    }
    
    setIsInitializing(true);
    try {
      await blockchainService.initialize(provider, signer);
      setBlockchainError(null);
    } catch (error) {
      setBlockchainError(error.message);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  };

  // Issue credit batch on blockchain
  const issueMutation = useMutation({
    mutationFn: async (batchData) => {
      await initializeBlockchain();
      return await blockchainService.issueCreditBatch(batchData);
    },
    onSuccess: (result) => {
      setTxHash(result.transactionHash);
      setTxStatus('pending');
      queryClient.invalidateQueries({ queryKey: ['credit-batches'] });
      onSuccess?.(result);
      
      // Monitor transaction status
      monitorTransaction(result.transactionHash);
    },
    onError: (error) => {
      setBlockchainError(error.message);
    }
  });

  // Transfer credits on blockchain
  const transferMutation = useMutation({
    mutationFn: async ({ toAddress, quantity }) => {
      await initializeBlockchain();
      return await blockchainService.transferCredits(batch.blockchainId, toAddress, quantity);
    },
    onSuccess: (result) => {
      setTxHash(result.transactionHash);
      setTxStatus('pending');
      queryClient.invalidateQueries({ queryKey: ['credit-batches'] });
      onSuccess?.(result);
      
      monitorTransaction(result.transactionHash);
    },
    onError: (error) => {
      setBlockchainError(error.message);
    }
  });

  // Retire credits on blockchain
  const retireMutation = useMutation({
    mutationFn: async ({ quantity, reason, beneficiary }) => {
      await initializeBlockchain();
      return await blockchainService.retireCredits(batch.blockchainId, quantity, reason, beneficiary);
    },
    onSuccess: (result) => {
      setTxHash(result.transactionHash);
      setTxStatus('pending');
      queryClient.invalidateQueries({ queryKey: ['credit-batches'] });
      onSuccess?.(result);
      
      monitorTransaction(result.transactionHash);
    },
    onError: (error) => {
      setBlockchainError(error.message);
    }
  });

  // Monitor transaction confirmation
  const monitorTransaction = async (hash) => {
    try {
      const receipt = await blockchainService.getTransactionReceipt(hash);
      if (receipt) {
        setTxStatus(receipt.status === 1 ? 'confirmed' : 'failed');
      }
    } catch (error) {
      console.error('Error monitoring transaction:', error);
    }
  };

  const handleIssueToBlockchain = () => {
    if (!batch.serialNumber || !batch.quantity) {
      setBlockchainError('Batch must have serial number and quantity');
      return;
    }

    issueMutation.mutate({
      projectId: batch.projectId,
      quantity: batch.quantity,
      serialNumber: batch.serialNumber,
      metadata: JSON.stringify({
        batchId: batch.id,
        vintage: batch.vintage,
        methodology: batch.methodology,
        issuedAt: batch.issuedAt
      })
    });
  };

  const handleTransferOnBlockchain = (toAddress, quantity) => {
    transferMutation.mutate({ toAddress, quantity });
  };

  const handleRetireOnBlockchain = (quantity, reason, beneficiary) => {
    retireMutation.mutate({ quantity, reason, beneficiary });
  };

  // Check if batch is already on blockchain
  const isOnBlockchain = batch.blockchainTxHash || batch.blockchainId;
  const canInteract = isConnected && isWalletLinked && !isInitializing;

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
          <span className="text-sm text-yellow-800">
            Connect your wallet to interact with blockchain
          </span>
        </div>
      </div>
    );
  }

  if (!isWalletLinked) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex items-center">
          <LinkIcon className="h-5 w-5 text-yellow-400 mr-2" />
          <span className="text-sm text-yellow-800">
            Link your wallet to your account to interact with blockchain
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Blockchain Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Blockchain Status</h4>
        
        {isOnBlockchain ? (
          <div className="space-y-2">
            <div className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm text-green-800">Anchored on blockchain</span>
            </div>
            
            {batch.blockchainTxHash && (
              <div className="text-xs text-gray-600">
                <span className="font-medium">Tx Hash:</span>{' '}
                <a
                  href={`https://etherscan.io/tx/${batch.blockchainTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500 font-mono"
                >
                  {batch.blockchainTxHash.slice(0, 10)}...{batch.blockchainTxHash.slice(-8)}
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2" />
            <span className="text-sm text-yellow-800">Not yet anchored on blockchain</span>
          </div>
        )}
      </div>

      {/* Transaction Status */}
      {txHash && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {txStatus === 'pending' && <ClockIcon className="h-4 w-4 text-blue-500 mr-2 animate-spin" />}
              {txStatus === 'confirmed' && <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />}
              {txStatus === 'failed' && <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-2" />}
              
              <span className="text-sm font-medium text-gray-900">
                {txStatus === 'pending' && 'Transaction Pending'}
                {txStatus === 'confirmed' && 'Transaction Confirmed'}
                {txStatus === 'failed' && 'Transaction Failed'}
              </span>
            </div>
            
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-500"
            >
              View on Etherscan
            </a>
          </div>
        </div>
      )}

      {/* Error Display */}
      {blockchainError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-sm text-red-800">{blockchainError}</span>
          </div>
        </div>
      )}

      {/* Blockchain Actions */}
      <div className="space-y-3">
        {!isOnBlockchain && batch.status === 'issued' && (
          <button
            onClick={handleIssueToBlockchain}
            disabled={!canInteract || issueMutation.isPending}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            {issueMutation.isPending ? 'Anchoring to Blockchain...' : 'Anchor to Blockchain'}
          </button>
        )}

        {isOnBlockchain && batch.status === 'issued' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                // This would typically open a modal for transfer details
                const toAddress = prompt('Enter recipient address:');
                const quantity = prompt('Enter quantity to transfer:');
                if (toAddress && quantity) {
                  handleTransferOnBlockchain(toAddress, parseInt(quantity));
                }
              }}
              disabled={!canInteract || transferMutation.isPending}
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              {transferMutation.isPending ? 'Transferring...' : 'Transfer'}
            </button>

            <button
              onClick={() => {
                // This would typically open a modal for retirement details
                const quantity = prompt('Enter quantity to retire:');
                const reason = prompt('Enter retirement reason:');
                const beneficiary = prompt('Enter beneficiary (optional):');
                if (quantity && reason) {
                  handleRetireOnBlockchain(parseInt(quantity), reason, beneficiary);
                }
              }}
              disabled={!canInteract || retireMutation.isPending}
              className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowDownIcon className="h-4 w-4 mr-1" />
              {retireMutation.isPending ? 'Retiring...' : 'Retire'}
            </button>
          </div>
        )}
      </div>

      {/* Gas Estimation */}
      {canInteract && (
        <div className="text-xs text-gray-500 text-center">
          <span>Network fees apply for blockchain transactions</span>
        </div>
      )}
    </div>
  );
};

export default BlockchainCreditActions;
