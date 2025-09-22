const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Blue Carbon Production Contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  // Production deployment configuration
  const config = {
    // EIP-712 domain info
    domainName: "Blue Carbon Registry",
    domainVersion: "1.0.0",
    // Base URI for ERC1155 metadata
    baseURI: "https://ipfs.io/ipfs/",
    // Multisig addresses (replace with actual addresses in production)
    nccr_multisig: process.env.NCCR_MULTISIG_ADDRESS || deployer.address,
    governance_multisig: process.env.GOVERNANCE_MULTISIG_ADDRESS || deployer.address,
    // Buffer pool settings
    defaultBufferPercentage: 1000, // 10%
    // Timelock delay (48 hours in production)
    timelockDelay: process.env.TIMELOCK_DELAY || 172800,
  };

  console.log("\n📋 Production Configuration:");
  console.log("- Domain Name:", config.domainName);
  console.log("- Domain Version:", config.domainVersion);
  console.log("- NCCR Multisig:", config.nccr_multisig);
  console.log("- Governance Multisig:", config.governance_multisig);
  console.log("- Default Buffer %:", config.defaultBufferPercentage / 100);
  console.log("- Timelock Delay:", config.timelockDelay, "seconds");

  // Deploy ProjectRegistry
  console.log("\n📄 Deploying ProjectRegistry...");
  const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
  const projectRegistry = await ProjectRegistry.deploy(
    config.nccr_multisig,
    config.domainName,
    config.domainVersion
  );
  await projectRegistry.waitForDeployment();
  const projectRegistryAddress = await projectRegistry.getAddress();
  console.log("✅ ProjectRegistry deployed to:", projectRegistryAddress);

  // Deploy CarbonCreditToken (production version)
  console.log("\n🪙 Deploying CarbonCreditToken...");
  const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
  const carbonCreditToken = await CarbonCreditToken.deploy(
    config.baseURI,
    config.nccr_multisig
  );
  await carbonCreditToken.waitForDeployment();
  const tokenAddress = await carbonCreditToken.getAddress();
  console.log("✅ CarbonCreditToken deployed to:", tokenAddress);

  // Deploy VerificationController
  console.log("\n🔍 Deploying VerificationController...");
  const VerificationController = await ethers.getContractFactory("VerificationController");
  const verificationController = await VerificationController.deploy(
    config.nccr_multisig,
    config.domainName + " Verification",
    config.domainVersion
  );
  await verificationController.waitForDeployment();
  const verificationAddress = await verificationController.getAddress();
  console.log("✅ VerificationController deployed to:", verificationAddress);

  // Deploy BufferPool
  console.log("\n🛡️ Deploying BufferPool...");
  const BufferPool = await ethers.getContractFactory("BufferPool");
  const bufferPool = await BufferPool.deploy(
    config.governance_multisig,
    tokenAddress
  );
  await bufferPool.waitForDeployment();
  const bufferPoolAddress = await bufferPool.getAddress();
  console.log("✅ BufferPool deployed to:", bufferPoolAddress);

  // Setup initial roles and permissions
  console.log("\n🔐 Setting up roles and permissions...");
  
  // Grant roles to deployer for initial setup (to be transferred to multisigs later)
  const PROJECT_REGISTRAR_ROLE = await projectRegistry.PROJECT_REGISTRAR_ROLE();
  const ISSUER_ROLE = await projectRegistry.ISSUER_ROLE();
  const BUFFER_MANAGER_ROLE = await bufferPool.BUFFER_MANAGER_ROLE();
  const ATTESTOR_ROLE = await verificationController.ATTESTOR_ROLE();

  // ProjectRegistry roles
  await projectRegistry.grantProjectRegistrarRole(deployer.address);
  await projectRegistry.grantIssuerRole(deployer.address);
  console.log("✅ Granted PROJECT_REGISTRAR_ROLE and ISSUER_ROLE to deployer");

  // Token roles
  await carbonCreditToken.grantIssuerRole(deployer.address);
  console.log("✅ Granted ISSUER_ROLE to deployer for token contract");

  // BufferPool roles
  await bufferPool.grantBufferManagerRole(deployer.address);
  console.log("✅ Granted BUFFER_MANAGER_ROLE to deployer");

  // VerificationController roles
  await verificationController.grantAttestorRole(deployer.address);
  console.log("✅ Granted ATTESTOR_ROLE to deployer");

  // Set up cross-contract permissions
  console.log("\n🔗 Setting up cross-contract permissions...");
  
  // Allow BufferPool to manage tokens
  await carbonCreditToken.grantIssuerRole(bufferPoolAddress);
  console.log("✅ Granted token ISSUER_ROLE to BufferPool");

  // Verify deployments
  console.log("\n🔍 Verifying deployments...");
  
  // Check ProjectRegistry
  const hasProjectRegistrarRole = await projectRegistry.hasRole(PROJECT_REGISTRAR_ROLE, deployer.address);
  console.log("ProjectRegistry - Deployer has PROJECT_REGISTRAR_ROLE:", hasProjectRegistrarRole);
  
  // Check token contract
  const tokenHasIssuerRole = await carbonCreditToken.hasRole(ISSUER_ROLE, deployer.address);
  console.log("Token - Deployer has ISSUER_ROLE:", tokenHasIssuerRole);
  
  // Check BufferPool
  const bufferHasManagerRole = await bufferPool.hasRole(BUFFER_MANAGER_ROLE, deployer.address);
  console.log("BufferPool - Deployer has BUFFER_MANAGER_ROLE:", bufferHasManagerRole);
  
  // Check VerificationController
  const verificationHasAttestorRole = await verificationController.hasRole(ATTESTOR_ROLE, deployer.address);
  console.log("VerificationController - Deployer has ATTESTOR_ROLE:", verificationHasAttestorRole);

  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");
  
  // Register a test auditor
  await projectRegistry.registerAuditor(deployer.address);
  console.log("✅ Test auditor registered");
  
  // Check default buffer percentage
  const defaultBufferPercentage = await bufferPool.defaultBufferPercentage();
  console.log("BufferPool - Default buffer percentage:", defaultBufferPercentage.toString(), "basis points");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ProjectRegistry: {
        address: projectRegistryAddress,
        constructorArgs: [config.nccr_multisig, config.domainName, config.domainVersion]
      },
      CarbonCreditToken: {
        address: tokenAddress,
        constructorArgs: [config.baseURI, config.nccr_multisig]
      },
      VerificationController: {
        address: verificationAddress,
        constructorArgs: [config.nccr_multisig, config.domainName + " Verification", config.domainVersion]
      },
      BufferPool: {
        address: bufferPoolAddress,
        constructorArgs: [config.governance_multisig, tokenAddress]
      }
    },
    roles: {
      nccr_multisig: config.nccr_multisig,
      governance_multisig: config.governance_multisig,
      deployer: deployer.address
    },
    config: config,
    integrations: {
      bufferPoolTokenContract: tokenAddress,
      crossContractPermissions: {
        bufferPoolCanMintTokens: true
      }
    }
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `production-${network.name}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Create latest deployment symlink
  const latestFile = path.join(deploymentsDir, `production-${network.name}-latest.json`);
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Latest deployment info saved to:", latestFile);

  console.log("\n🎉 Production Deployment Complete!");
  console.log("\n📋 Contract Addresses:");
  console.log("- ProjectRegistry:", projectRegistryAddress);
  console.log("- CarbonCreditToken:", tokenAddress);
  console.log("- VerificationController:", verificationAddress);
  console.log("- BufferPool:", bufferPoolAddress);
  
  console.log("\n🔗 Next Steps:");
  console.log("1. Verify contracts on block explorer:");
  console.log(`   npx hardhat verify --network ${network.name} ${projectRegistryAddress} "${config.nccr_multisig}" "${config.domainName}" "${config.domainVersion}"`);
  console.log(`   npx hardhat verify --network ${network.name} ${tokenAddress} "${config.baseURI}" "${config.nccr_multisig}"`);
  console.log(`   npx hardhat verify --network ${network.name} ${verificationAddress} "${config.nccr_multisig}" "${config.domainName} Verification" "${config.domainVersion}"`);
  console.log(`   npx hardhat verify --network ${network.name} ${bufferPoolAddress} "${config.governance_multisig}" "${tokenAddress}"`);
  console.log("2. Transfer admin roles to multisig wallets");
  console.log("3. Set up Timelock contract for governance");
  console.log("4. Deploy subgraph for event indexing");
  console.log("5. Configure backend integration");
  console.log("6. Set up monitoring and alerting");

  console.log("\n⚠️  SECURITY REMINDERS:");
  console.log("- Transfer all admin roles to multisig wallets");
  console.log("- Set up proper governance with Timelock");
  console.log("- Conduct security audit before mainnet");
  console.log("- Set up emergency pause procedures");
  console.log("- Configure proper access controls");

  return deploymentInfo;
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Production deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;
