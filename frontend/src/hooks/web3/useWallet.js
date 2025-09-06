// hooks/web3/useWallet.js
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { useAuthStore } from '../../stores/authStore';

export const useWallet = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error: connectError, isLoading: isConnectLoading, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const { user, setAuth } = useAuthStore();

  // Clear connection error when successfully connected
  useEffect(() => {
    if (isConnected && connectionError) {
      setConnectionError(null);
    }
  }, [isConnected, connectionError]);

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      setConnectionError(connectError.message);
    }
  }, [connectError]);

  const connectWallet = useCallback(async (connector) => {
    try {
      setConnectionError(null);
      await connect({ connector });
      setIsWalletModalOpen(false);
    } catch (error) {
      setConnectionError(error.message || 'Failed to connect wallet');
    }
  }, [connect]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setConnectionError(null);
  }, [disconnect]);

  const openWalletModal = useCallback(() => {
    setIsWalletModalOpen(true);
  }, []);

  const closeWalletModal = useCallback(() => {
    setIsWalletModalOpen(false);
    setConnectionError(null);
  }, []);

  const switchToRequiredNetwork = useCallback(async (targetChainId) => {
    try {
      await switchChain?.({ chainId: targetChainId });
    } catch (error) {
      setConnectionError(`Failed to switch network: ${error.message}`);
    }
  }, [switchChain]);

  // Format address for display
  const formatAddress = useCallback((addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  // Check if user has linked their wallet to their account
  const isWalletLinked = user?.walletAddress?.toLowerCase() === address?.toLowerCase();

  // Get chain info
  const getChainInfo = () => {
    // This would normally come from wagmi's useNetwork hook
    // For now, we'll return basic info based on chainId
    if (chainId === 1) return { id: 1, name: 'Ethereum Mainnet' };
    if (chainId === 137) return { id: 137, name: 'Polygon' };
    return { id: chainId, name: 'Unknown Network' };
  };

  const chain = getChainInfo();

  return {
    // Connection state
    address,
    isConnected,
    isConnecting: isConnecting || isConnectLoading,
    isSwitchingNetwork: isSwitchingChain,

    // Wallet data
    balance,
    chain,

    // Available connectors
    connectors: connectors.filter(connector => connector.ready),
    pendingConnector,

    // Actions
    connectWallet,
    disconnectWallet,
    switchToRequiredNetwork,

    // Modal state
    isWalletModalOpen,
    openWalletModal,
    closeWalletModal,

    // Errors
    connectionError,

    // Utilities
    formatAddress,
    isWalletLinked,

    // Status checks
    isWrongNetwork: chain && chain.id !== 1, // Assuming mainnet for production
    needsNetworkSwitch: chain && chain.id !== 1,
  };
};
