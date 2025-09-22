const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

/**
 * Blockchain Integration Service for Blue Carbon Project
 * Handles interactions between backend and smart contracts
 */
class BlockchainIntegrationService {
  constructor(config) {
    this.config = config;
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the blockchain service
   */
  async initialize() {
    try {
      // Setup provider
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      
      // Setup signer (for backend operations)
      if (this.config.privateKey) {
        this.signer = new ethers.Wallet(this.config.privateKey, this.provider);
      } else {
        throw new Error("Private key required for blockchain operations");
      }

      // Load contract addresses and ABIs
      await this.loadContracts();
      
      // Verify network
      const network = await this.provider.getNetwork();
      console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
      
      this.isInitialized = true;
      console.log("✅ Blockchain integration service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize blockchain service:", error);
      throw error;
    }
  }

  /**
   * Load contract instances from deployment files
   */
  async loadContracts() {
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    const networkName = this.config.network || "mumbai";
    const deploymentFile = path.join(deploymentsDir, `${this.config.environment}-${networkName}-latest.json`);

    if (!fs.existsSync(deploymentFile)) {
      throw new Error(`Deployment file not found: ${deploymentFile}`);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    
    // Load contract ABIs
    const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
    
    // Registry Contract
    const registryArtifact = this.config.environment === "production" 
      ? require(path.join(artifactsDir, "production", "ProjectRegistry.sol", "ProjectRegistry.json"))
      : require(path.join(artifactsDir, "mvp", "RegistryContract.sol", "RegistryContract.json"));
    
    this.contracts.registry = new ethers.Contract(
      deployment.contracts[this.config.environment === "production" ? "ProjectRegistry" : "RegistryContract"].address,
      registryArtifact.abi,
      this.signer
    );

    // Carbon Credit Token
    const tokenArtifact = require(path.join(artifactsDir, "mvp", "CarbonCreditToken.sol", "CarbonCreditToken.json"));
    this.contracts.token = new ethers.Contract(
      deployment.contracts.CarbonCreditToken.address,
      tokenArtifact.abi,
      this.signer
    );

    // Production-only contracts
    if (this.config.environment === "production") {
      // Verification Controller
      const verificationArtifact = require(path.join(artifactsDir, "production", "VerificationController.sol", "VerificationController.json"));
      this.contracts.verification = new ethers.Contract(
        deployment.contracts.VerificationController.address,
        verificationArtifact.abi,
        this.signer
      );

      // Buffer Pool
      const bufferArtifact = require(path.join(artifactsDir, "production", "BufferPool.sol", "BufferPool.json"));
      this.contracts.bufferPool = new ethers.Contract(
        deployment.contracts.BufferPool.address,
        bufferArtifact.abi,
        this.signer
      );
    }

    console.log("✅ Contracts loaded successfully");
  }

  /**
   * Register a new project on blockchain
   */
  async registerProject(projectData) {
    this.ensureInitialized();
    
    try {
      const { projectId, owner, ipfsHash } = projectData;
      
      const tx = await this.contracts.registry.registerProject(
        ethers.keccak256(ethers.toUtf8Bytes(projectId)),
        owner,
        ipfsHash
      );
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error("Failed to register project:", error);
      throw error;
    }
  }

  /**
   * Anchor MRV report on blockchain
   */
  async anchorMRV(mrvData) {
    this.ensureInitialized();
    
    try {
      const { mrvId, projectId, ipfsHash, tCO2e, auditor } = mrvData;
      
      let tx;
      if (this.config.environment === "production" && mrvData.signature) {
        // Production: Use signature verification
        tx = await this.contracts.registry.anchorMRVWithSignature(
          ethers.keccak256(ethers.toUtf8Bytes(mrvId)),
          ethers.keccak256(ethers.toUtf8Bytes(projectId)),
          ipfsHash,
          ethers.parseUnits(tCO2e.toString(), 0),
          mrvData.deadline,
          mrvData.signature
        );
      } else {
        // MVP: Direct anchoring
        tx = await this.contracts.registry.anchorMRV(
          ethers.keccak256(ethers.toUtf8Bytes(mrvId)),
          ethers.keccak256(ethers.toUtf8Bytes(projectId)),
          ipfsHash,
          ethers.parseUnits(tCO2e.toString(), 0),
          auditor
        );
      }
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error("Failed to anchor MRV:", error);
      throw error;
    }
  }

  /**
   * Mint carbon credit tokens
   */
  async mintCredits(creditData) {
    this.ensureInitialized();
    
    try {
      const { recipient, projectId, mrvId, amount, vintage, metadataHash } = creditData;
      
      const tx = await this.contracts.token.mintBatch(
        recipient,
        ethers.keccak256(ethers.toUtf8Bytes(projectId)),
        ethers.keccak256(ethers.toUtf8Bytes(mrvId)),
        ethers.parseUnits(amount.toString(), 0),
        vintage,
        metadataHash
      );
      
      const receipt = await tx.wait();
      
      // Extract token ID from events
      const mintEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contracts.token.interface.parseLog(log);
          return parsed.name === "CreditsMinted";
        } catch {
          return false;
        }
      });
      
      let tokenId = null;
      if (mintEvent) {
        const parsed = this.contracts.token.interface.parseLog(mintEvent);
        tokenId = parsed.args.tokenId.toString();
      }
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        tokenId
      };
    } catch (error) {
      console.error("Failed to mint credits:", error);
      throw error;
    }
  }

  /**
   * Retire carbon credits
   */
  async retireCredits(retirementData) {
    this.ensureInitialized();
    
    try {
      const { tokenId, amount, beneficiary, reason, userAddress } = retirementData;
      
      // For backend-initiated retirement, we need to handle this differently
      // In production, this would typically be user-initiated
      const tx = await this.contracts.token.retire(
        tokenId,
        ethers.parseUnits(amount.toString(), 0),
        beneficiary,
        reason
      );
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error("Failed to retire credits:", error);
      throw error;
    }
  }

  /**
   * Get project information from blockchain
   */
  async getProject(projectId) {
    this.ensureInitialized();
    
    try {
      const project = await this.contracts.registry.projects(
        ethers.keccak256(ethers.toUtf8Bytes(projectId))
      );
      
      return {
        owner: project.owner,
        ipfsHash: project.ipfsHash || project.projectIpfsHash,
        createdAt: project.createdAt.toString(),
        active: project.active !== undefined ? project.active : true,
        exists: project.exists
      };
    } catch (error) {
      console.error("Failed to get project:", error);
      throw error;
    }
  }

  /**
   * Get MRV information from blockchain
   */
  async getMRV(mrvId) {
    this.ensureInitialized();
    
    try {
      const [exists, projectId, tCO2e, auditor, approved, canonicalHash] = 
        await this.contracts.registry.getMRVInfo(
          ethers.keccak256(ethers.toUtf8Bytes(mrvId))
        );
      
      return {
        exists,
        projectId,
        tCO2e: tCO2e.toString(),
        auditor,
        approved: approved !== undefined ? approved : true,
        canonicalHash: canonicalHash || null
      };
    } catch (error) {
      console.error("Failed to get MRV:", error);
      throw error;
    }
  }

  /**
   * Get token batch information
   */
  async getTokenBatch(tokenId) {
    this.ensureInitialized();
    
    try {
      const batch = await this.contracts.token.getBatchInfo(tokenId);
      
      return {
        projectId: batch.projectId,
        mrvId: batch.mrvId,
        vintage: batch.vintage.toString(),
        metadataIpfsHash: batch.metadataIpfsHash,
        totalIssued: batch.totalIssued.toString(),
        totalRetired: batch.totalRetired.toString(),
        issuer: batch.issuer,
        issuedAt: batch.issuedAt.toString(),
        exists: batch.exists
      };
    } catch (error) {
      console.error("Failed to get token batch:", error);
      throw error;
    }
  }

  /**
   * Listen for blockchain events
   */
  setupEventListeners(eventHandlers) {
    this.ensureInitialized();
    
    // Registry events
    if (eventHandlers.onProjectRegistered) {
      this.contracts.registry.on("ProjectRegistered", eventHandlers.onProjectRegistered);
    }
    
    if (eventHandlers.onMRVAnchored) {
      this.contracts.registry.on("MRVAnchored", eventHandlers.onMRVAnchored);
    }
    
    // Token events
    if (eventHandlers.onCreditsMinted) {
      this.contracts.token.on("CreditsMinted", eventHandlers.onCreditsMinted);
    }
    
    if (eventHandlers.onCreditsRetired) {
      this.contracts.token.on("CreditsRetired", eventHandlers.onCreditsRetired);
    }
    
    console.log("✅ Event listeners set up");
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash) {
    this.ensureInitialized();
    
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error("Failed to get transaction receipt:", error);
      throw error;
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(contractMethod, ...args) {
    this.ensureInitialized();
    
    try {
      const gasEstimate = await contractMethod.estimateGas(...args);
      return gasEstimate.toString();
    } catch (error) {
      console.error("Failed to estimate gas:", error);
      throw error;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    this.ensureInitialized();
    
    try {
      const gasPrice = await this.provider.getFeeData();
      return {
        gasPrice: gasPrice.gasPrice?.toString(),
        maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString()
      };
    } catch (error) {
      console.error("Failed to get gas price:", error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error("Blockchain service not initialized. Call initialize() first.");
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.contracts.registry) {
      this.contracts.registry.removeAllListeners();
    }
    if (this.contracts.token) {
      this.contracts.token.removeAllListeners();
    }
    console.log("✅ Blockchain service cleaned up");
  }
}

module.exports = BlockchainIntegrationService;
