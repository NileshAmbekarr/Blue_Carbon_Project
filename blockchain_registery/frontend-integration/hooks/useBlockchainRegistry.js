import { useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

// Contract ABIs (these would be imported from generated files)
import { registryABI } from '../abis/RegistryContract';
import { tokenABI } from '../abis/CarbonCreditToken';
import { projectRegistryABI } from '../abis/ProjectRegistry';
import { verificationABI } from '../abis/VerificationController';
import { bufferPoolABI } from '../abis/BufferPool';

// Contract addresses (these would come from deployment config)
const CONTRACTS = {
  mvp: {
    registry: process.env.VITE_MVP_REGISTRY_ADDRESS,
    token: process.env.VITE_MVP_TOKEN_ADDRESS,
  },
  production: {
    projectRegistry: process.env.VITE_PROD_PROJECT_REGISTRY_ADDRESS,
    token: process.env.VITE_PROD_TOKEN_ADDRESS,
    verification: process.env.VITE_PROD_VERIFICATION_ADDRESS,
    bufferPool: process.env.VITE_PROD_BUFFER_POOL_ADDRESS,
  }
};

/**
 * Hook for blockchain registry operations
 * Integrates with Blue Carbon Project React dashboard
 */
export const useBlockchainRegistry = () => {
  const queryClient = useQueryClient();
  const environment = process.env.VITE_BLOCKCHAIN_ENV || 'mvp';
  
  // Get appropriate contract addresses
  const getContractAddress = (contractType) => {
    return environment === 'production' 
      ? CONTRACTS.production[contractType] 
      : CONTRACTS.mvp[contractType];
  };

  // Get appropriate ABI
  const getContractABI = (contractType) => {
    switch (contractType) {
      case 'registry':
        return environment === 'production' ? projectRegistryABI : registryABI;
      case 'token':
        return tokenABI;
      case 'verification':
        return verificationABI;
      case 'bufferPool':
        return bufferPoolABI;
      default:
        throw new Error(`Unknown contract type: ${contractType}`);
    }
  };

  return {
    environment,
    getContractAddress,
    getContractABI,
    contracts: environment === 'production' ? CONTRACTS.production : CONTRACTS.mvp
  };
};

/**
 * Hook for project registration operations
 */
export const useProjectRegistry = () => {
  const { environment, getContractAddress, getContractABI } = useBlockchainRegistry();
  const queryClient = useQueryClient();

  // Register project mutation
  const { 
    write: registerProject, 
    data: registerData, 
    isLoading: isRegistering 
  } = useContractWrite({
    address: getContractAddress('registry'),
    abi: getContractABI('registry'),
    functionName: 'registerProject',
    onSuccess: (data) => {
      toast.success('Project registration transaction submitted');
      queryClient.invalidateQueries(['projects']);
    },
    onError: (error) => {
      toast.error(`Registration failed: ${error.message}`);
    }
  });

  // Wait for registration transaction
  const { isLoading: isWaitingForRegistration } = useWaitForTransaction({
    hash: registerData?.hash,
    onSuccess: (data) => {
      toast.success('Project registered successfully on blockchain');
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['blockchain-status']);
    }
  });

  // Get project information
  const useProjectInfo = (projectId) => {
    const projectIdHash = projectId ? ethers.keccak256(ethers.toUtf8Bytes(projectId)) : null;
    
    return useContractRead({
      address: getContractAddress('registry'),
      abi: getContractABI('registry'),
      functionName: 'projects',
      args: [projectIdHash],
      enabled: !!projectIdHash,
      select: (data) => ({
        owner: data.owner,
        ipfsHash: data.ipfsHash || data.projectIpfsHash,
        createdAt: data.createdAt?.toString(),
        active: data.active !== undefined ? data.active : true,
        exists: data.exists
      })
    });
  };

  // Get project MRVs
  const useProjectMRVs = (projectId) => {
    const projectIdHash = projectId ? ethers.keccak256(ethers.toUtf8Bytes(projectId)) : null;
    
    return useContractRead({
      address: getContractAddress('registry'),
      abi: getContractABI('registry'),
      functionName: 'getProjectMRVs',
      args: [projectIdHash],
      enabled: !!projectIdHash
    });
  };

  return {
    registerProject: (projectId, owner, ipfsHash) => {
      const projectIdHash = ethers.keccak256(ethers.toUtf8Bytes(projectId));
      registerProject({
        args: [projectIdHash, owner, ipfsHash]
      });
    },
    isRegistering: isRegistering || isWaitingForRegistration,
    useProjectInfo,
    useProjectMRVs
  };
};

/**
 * Hook for MRV operations
 */
export const useMRVRegistry = () => {
  const { environment, getContractAddress, getContractABI } = useBlockchainRegistry();
  const queryClient = useQueryClient();

  // Anchor MRV mutation
  const { 
    write: anchorMRV, 
    data: anchorData, 
    isLoading: isAnchoring 
  } = useContractWrite({
    address: getContractAddress('registry'),
    abi: getContractABI('registry'),
    functionName: environment === 'production' ? 'anchorMRVWithSignature' : 'anchorMRV',
    onSuccess: (data) => {
      toast.success('MRV anchoring transaction submitted');
      queryClient.invalidateQueries(['mrv-records']);
    },
    onError: (error) => {
      toast.error(`MRV anchoring failed: ${error.message}`);
    }
  });

  // Wait for anchoring transaction
  const { isLoading: isWaitingForAnchoring } = useWaitForTransaction({
    hash: anchorData?.hash,
    onSuccess: (data) => {
      toast.success('MRV anchored successfully on blockchain');
      queryClient.invalidateQueries(['mrv-records']);
      queryClient.invalidateQueries(['projects']);
    }
  });

  // Get MRV information
  const useMRVInfo = (mrvId) => {
    const mrvIdHash = mrvId ? ethers.keccak256(ethers.toUtf8Bytes(mrvId)) : null;
    
    return useContractRead({
      address: getContractAddress('registry'),
      abi: getContractABI('registry'),
      functionName: 'getMRVInfo',
      args: [mrvIdHash],
      enabled: !!mrvIdHash,
      select: (data) => ({
        exists: data[0],
        projectId: data[1],
        tCO2e: data[2]?.toString(),
        auditor: data[3],
        approved: data[4] !== undefined ? data[4] : true,
        canonicalHash: data[5] || null
      })
    });
  };

  return {
    anchorMRV: (mrvData) => {
      const mrvIdHash = ethers.keccak256(ethers.toUtf8Bytes(mrvData.mrvId));
      const projectIdHash = ethers.keccak256(ethers.toUtf8Bytes(mrvData.projectId));
      
      if (environment === 'production' && mrvData.signature) {
        anchorMRV({
          args: [
            mrvIdHash,
            projectIdHash,
            mrvData.ipfsHash,
            ethers.parseUnits(mrvData.tCO2e.toString(), 0),
            mrvData.deadline,
            mrvData.signature
          ]
        });
      } else {
        anchorMRV({
          args: [
            mrvIdHash,
            projectIdHash,
            mrvData.ipfsHash,
            ethers.parseUnits(mrvData.tCO2e.toString(), 0),
            mrvData.auditor
          ]
        });
      }
    },
    isAnchoring: isAnchoring || isWaitingForAnchoring,
    useMRVInfo
  };
};

/**
 * Hook for carbon credit operations
 */
export const useCarbonCredits = () => {
  const { getContractAddress, getContractABI } = useBlockchainRegistry();
  const queryClient = useQueryClient();

  // Mint credits mutation
  const { 
    write: mintCredits, 
    data: mintData, 
    isLoading: isMinting 
  } = useContractWrite({
    address: getContractAddress('token'),
    abi: getContractABI('token'),
    functionName: 'mintBatch',
    onSuccess: (data) => {
      toast.success('Credit minting transaction submitted');
      queryClient.invalidateQueries(['credit-batches']);
    },
    onError: (error) => {
      toast.error(`Credit minting failed: ${error.message}`);
    }
  });

  // Wait for minting transaction
  const { isLoading: isWaitingForMinting } = useWaitForTransaction({
    hash: mintData?.hash,
    onSuccess: (data) => {
      toast.success('Credits minted successfully');
      queryClient.invalidateQueries(['credit-batches']);
      queryClient.invalidateQueries(['user-balances']);
    }
  });

  // Retire credits mutation
  const { 
    write: retireCredits, 
    data: retireData, 
    isLoading: isRetiring 
  } = useContractWrite({
    address: getContractAddress('token'),
    abi: getContractABI('token'),
    functionName: 'retire',
    onSuccess: (data) => {
      toast.success('Credit retirement transaction submitted');
      queryClient.invalidateQueries(['user-balances']);
    },
    onError: (error) => {
      toast.error(`Credit retirement failed: ${error.message}`);
    }
  });

  // Wait for retirement transaction
  const { isLoading: isWaitingForRetirement } = useWaitForTransaction({
    hash: retireData?.hash,
    onSuccess: (data) => {
      toast.success('Credits retired successfully');
      queryClient.invalidateQueries(['user-balances']);
      queryClient.invalidateQueries(['credit-batches']);
      queryClient.invalidateQueries(['retirement-certificates']);
    }
  });

  // Get token batch information
  const useBatchInfo = (tokenId) => {
    return useContractRead({
      address: getContractAddress('token'),
      abi: getContractABI('token'),
      functionName: 'getBatchInfo',
      args: [tokenId],
      enabled: !!tokenId,
      select: (data) => ({
        projectId: data.projectId,
        mrvId: data.mrvId,
        vintage: data.vintage?.toString(),
        metadataIpfsHash: data.metadataIpfsHash,
        totalIssued: data.totalIssued?.toString(),
        totalRetired: data.totalRetired?.toString(),
        issuer: data.issuer,
        issuedAt: data.issuedAt?.toString(),
        exists: data.exists
      })
    });
  };

  // Get user balance
  const useUserBalance = (userAddress, tokenId) => {
    return useContractRead({
      address: getContractAddress('token'),
      abi: getContractABI('token'),
      functionName: 'balanceOf',
      args: [userAddress, tokenId],
      enabled: !!(userAddress && tokenId),
      select: (data) => data?.toString()
    });
  };

  // Get retired balance
  const useRetiredBalance = (beneficiary, tokenId) => {
    return useContractRead({
      address: getContractAddress('token'),
      abi: getContractABI('token'),
      functionName: 'getRetiredBalance',
      args: [beneficiary, tokenId],
      enabled: !!(beneficiary && tokenId),
      select: (data) => data?.toString()
    });
  };

  // Get project tokens
  const useProjectTokens = (projectId) => {
    const projectIdHash = projectId ? ethers.keccak256(ethers.toUtf8Bytes(projectId)) : null;
    
    return useContractRead({
      address: getContractAddress('token'),
      abi: getContractABI('token'),
      functionName: 'getProjectTokens',
      args: [projectIdHash],
      enabled: !!projectIdHash,
      select: (data) => data?.map(id => id.toString())
    });
  };

  return {
    mintCredits: (creditData) => {
      const projectIdHash = ethers.keccak256(ethers.toUtf8Bytes(creditData.projectId));
      const mrvIdHash = ethers.keccak256(ethers.toUtf8Bytes(creditData.mrvId));
      
      mintCredits({
        args: [
          creditData.recipient,
          projectIdHash,
          mrvIdHash,
          ethers.parseUnits(creditData.amount.toString(), 0),
          creditData.vintage,
          creditData.metadataHash
        ]
      });
    },
    retireCredits: (retirementData) => {
      retireCredits({
        args: [
          retirementData.tokenId,
          ethers.parseUnits(retirementData.amount.toString(), 0),
          retirementData.beneficiary,
          retirementData.reason
        ]
      });
    },
    isMinting: isMinting || isWaitingForMinting,
    isRetiring: isRetiring || isWaitingForRetirement,
    useBatchInfo,
    useUserBalance,
    useRetiredBalance,
    useProjectTokens
  };
};

/**
 * Hook for blockchain status and monitoring
 */
export const useBlockchainStatus = () => {
  const { environment, contracts } = useBlockchainRegistry();

  return useQuery({
    queryKey: ['blockchain-status'],
    queryFn: async () => {
      // This would typically call the backend API
      const response = await fetch('/api/blockchain/status');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    select: (data) => ({
      ...data,
      environment,
      contracts
    })
  });
};

/**
 * Hook for dashboard analytics
 */
export const useBlockchainAnalytics = () => {
  return useQuery({
    queryKey: ['blockchain-analytics'],
    queryFn: async () => {
      // This would query the subgraph or backend API
      const response = await fetch('/api/blockchain/analytics');
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
