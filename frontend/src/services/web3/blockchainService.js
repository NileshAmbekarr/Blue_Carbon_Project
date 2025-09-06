// services/web3/blockchainService.js
import { ethers } from 'ethers';

// Carbon Credit Registry Contract ABI (simplified)
const CARBON_REGISTRY_ABI = [
  "function issueCreditBatch(uint256 projectId, uint256 quantity, string memory serialNumber, string memory metadata) external returns (uint256)",
  "function transferCredits(uint256 batchId, address to, uint256 quantity) external",
  "function retireCredits(uint256 batchId, uint256 quantity, string memory reason, string memory beneficiary) external",
  "function getCreditBatch(uint256 batchId) external view returns (tuple(uint256 id, uint256 projectId, uint256 quantity, uint256 available, address owner, string serialNumber, string metadata, bool isActive))",
  "function getProjectBatches(uint256 projectId) external view returns (uint256[])",
  "function getUserBatches(address user) external view returns (uint256[])",
  "event CreditBatchIssued(uint256 indexed batchId, uint256 indexed projectId, uint256 quantity, address indexed owner)",
  "event CreditsTransferred(uint256 indexed batchId, address indexed from, address indexed to, uint256 quantity)",
  "event CreditsRetired(uint256 indexed batchId, address indexed owner, uint256 quantity, string reason)"
];

// Project Registry Contract ABI (simplified)
const PROJECT_REGISTRY_ABI = [
  "function registerProject(string memory name, string memory description, string memory location, string memory methodology, string memory ipfsHash) external returns (uint256)",
  "function updateProject(uint256 projectId, string memory ipfsHash) external",
  "function getProject(uint256 projectId) external view returns (tuple(uint256 id, string name, string description, address owner, bool isActive, string ipfsHash))",
  "function verifyProject(uint256 projectId) external",
  "event ProjectRegistered(uint256 indexed projectId, address indexed owner, string name)",
  "event ProjectUpdated(uint256 indexed projectId, string ipfsHash)",
  "event ProjectVerified(uint256 indexed projectId, address indexed verifier)"
];

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.carbonRegistryContract = null;
    this.projectRegistryContract = null;
    
    // Contract addresses (these would be set based on network)
    this.contractAddresses = {
      1: { // Mainnet
        carbonRegistry: process.env.VITE_CARBON_REGISTRY_ADDRESS_MAINNET,
        projectRegistry: process.env.VITE_PROJECT_REGISTRY_ADDRESS_MAINNET
      },
      5: { // Goerli
        carbonRegistry: process.env.VITE_CARBON_REGISTRY_ADDRESS_GOERLI,
        projectRegistry: process.env.VITE_PROJECT_REGISTRY_ADDRESS_GOERLI
      }
    };
  }

  async initialize(provider, signer) {
    this.provider = provider;
    this.signer = signer;
    
    const network = await provider.getNetwork();
    const addresses = this.contractAddresses[network.chainId];
    
    if (!addresses) {
      throw new Error(`Unsupported network: ${network.name}`);
    }

    this.carbonRegistryContract = new ethers.Contract(
      addresses.carbonRegistry,
      CARBON_REGISTRY_ABI,
      signer
    );

    this.projectRegistryContract = new ethers.Contract(
      addresses.projectRegistry,
      PROJECT_REGISTRY_ABI,
      signer
    );
  }

  // Project Management
  async registerProject(projectData) {
    if (!this.projectRegistryContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const tx = await this.projectRegistryContract.registerProject(
        projectData.name,
        projectData.description,
        projectData.location,
        projectData.methodology,
        projectData.ipfsHash
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'ProjectRegistered');
      
      return {
        transactionHash: tx.hash,
        projectId: event?.args?.projectId?.toString(),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      throw new Error(`Failed to register project: ${error.message}`);
    }
  }

  async updateProject(projectId, ipfsHash) {
    if (!this.projectRegistryContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const tx = await this.projectRegistryContract.updateProject(projectId, ipfsHash);
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

  async getProject(projectId) {
    if (!this.projectRegistryContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const project = await this.projectRegistryContract.getProject(projectId);
      return {
        id: project.id.toString(),
        name: project.name,
        description: project.description,
        owner: project.owner,
        isActive: project.isActive,
        ipfsHash: project.ipfsHash
      };
    } catch (error) {
      throw new Error(`Failed to get project: ${error.message}`);
    }
  }

  // Credit Management
  async issueCreditBatch(batchData) {
    if (!this.carbonRegistryContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const tx = await this.carbonRegistryContract.issueCreditBatch(
        batchData.projectId,
        ethers.utils.parseUnits(batchData.quantity.toString(), 0),
        batchData.serialNumber,
        batchData.metadata
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'CreditBatchIssued');
      
      return {
        transactionHash: tx.hash,
        batchId: event?.args?.batchId?.toString(),
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      throw new Error(`Failed to issue credit batch: ${error.message}`);
    }
  }

  async transferCredits(batchId, toAddress, quantity) {
    if (!this.carbonRegistryContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const tx = await this.carbonRegistryContract.transferCredits(
        batchId,
        toAddress,
        ethers.utils.parseUnits(quantity.toString(), 0)
      );

      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      throw new Error(`Failed to transfer credits: ${error.message}`);
    }
  }

  async retireCredits(batchId, quantity, reason, beneficiary) {
    if (!this.carbonRegistryContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const tx = await this.carbonRegistryContract.retireCredits(
        batchId,
        ethers.utils.parseUnits(quantity.toString(), 0),
        reason,
        beneficiary || ''
      );

      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      throw new Error(`Failed to retire credits: ${error.message}`);
    }
  }

  async getCreditBatch(batchId) {
    if (!this.carbonRegistryContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const batch = await this.carbonRegistryContract.getCreditBatch(batchId);
      return {
        id: batch.id.toString(),
        projectId: batch.projectId.toString(),
        quantity: batch.quantity.toString(),
        available: batch.available.toString(),
        owner: batch.owner,
        serialNumber: batch.serialNumber,
        metadata: batch.metadata,
        isActive: batch.isActive
      };
    } catch (error) {
      throw new Error(`Failed to get credit batch: ${error.message}`);
    }
  }

  async getProjectBatches(projectId) {
    if (!this.carbonRegistryContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const batchIds = await this.carbonRegistryContract.getProjectBatches(projectId);
      return batchIds.map(id => id.toString());
    } catch (error) {
      throw new Error(`Failed to get project batches: ${error.message}`);
    }
  }

  async getUserBatches(userAddress) {
    if (!this.carbonRegistryContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const batchIds = await this.carbonRegistryContract.getUserBatches(userAddress);
      return batchIds.map(id => id.toString());
    } catch (error) {
      throw new Error(`Failed to get user batches: ${error.message}`);
    }
  }

  // Event Listening
  setupEventListeners(callbacks = {}) {
    if (!this.carbonRegistryContract || !this.projectRegistryContract) {
      throw new Error('Blockchain service not initialized');
    }

    // Credit events
    if (callbacks.onCreditBatchIssued) {
      this.carbonRegistryContract.on('CreditBatchIssued', callbacks.onCreditBatchIssued);
    }

    if (callbacks.onCreditsTransferred) {
      this.carbonRegistryContract.on('CreditsTransferred', callbacks.onCreditsTransferred);
    }

    if (callbacks.onCreditsRetired) {
      this.carbonRegistryContract.on('CreditsRetired', callbacks.onCreditsRetired);
    }

    // Project events
    if (callbacks.onProjectRegistered) {
      this.projectRegistryContract.on('ProjectRegistered', callbacks.onProjectRegistered);
    }

    if (callbacks.onProjectUpdated) {
      this.projectRegistryContract.on('ProjectUpdated', callbacks.onProjectUpdated);
    }

    if (callbacks.onProjectVerified) {
      this.projectRegistryContract.on('ProjectVerified', callbacks.onProjectVerified);
    }
  }

  removeAllListeners() {
    if (this.carbonRegistryContract) {
      this.carbonRegistryContract.removeAllListeners();
    }
    if (this.projectRegistryContract) {
      this.projectRegistryContract.removeAllListeners();
    }
  }

  // Utility methods
  async estimateGas(method, ...args) {
    try {
      const gasEstimate = await method.estimateGas(...args);
      return gasEstimate.toString();
    } catch (error) {
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  async getTransactionReceipt(txHash) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
  }

  formatUnits(value, decimals = 0) {
    return ethers.utils.formatUnits(value, decimals);
  }

  parseUnits(value, decimals = 0) {
    return ethers.utils.parseUnits(value.toString(), decimals);
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService;
