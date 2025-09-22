const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Blue Carbon MVP Contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  // Contract deployment configuration
  const config = {
    // Base URI for ERC1155 metadata
    baseURI: "https://ipfs.io/ipfs/",
    // Admin address (deployer for MVP, multisig for production)
    admin: deployer.address,
  };

  console.log("\n📋 Deployment Configuration:");
  console.log("- Base URI:", config.baseURI);
  console.log("- Admin Address:", config.admin);

  // Deploy RegistryContract
  console.log("\n📄 Deploying RegistryContract...");
  const RegistryContract = await ethers.getContractFactory("RegistryContract");
  const registryContract = await RegistryContract.deploy(config.admin);
  await registryContract.waitForDeployment();
  const registryAddress = await registryContract.getAddress();
  console.log("✅ RegistryContract deployed to:", registryAddress);

  // Deploy CarbonCreditToken
  console.log("\n🪙 Deploying CarbonCreditToken...");
  const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
  const carbonCreditToken = await CarbonCreditToken.deploy(config.baseURI, config.admin);
  await carbonCreditToken.waitForDeployment();
  const tokenAddress = await carbonCreditToken.getAddress();
  console.log("✅ CarbonCreditToken deployed to:", tokenAddress);

  // Setup roles for MVP
  console.log("\n🔐 Setting up roles...");
  
  // Grant ISSUER_ROLE to deployer (for MVP testing)
  const ISSUER_ROLE = await registryContract.ISSUER_ROLE();
  await registryContract.grantIssuerRole(deployer.address);
  await carbonCreditToken.grantIssuerRole(deployer.address);
  console.log("✅ Granted ISSUER_ROLE to deployer");

  // Verify deployments
  console.log("\n🔍 Verifying deployments...");
  
  // Check registry contract
  const hasIssuerRole = await registryContract.hasRole(ISSUER_ROLE, deployer.address);
  console.log("Registry - Deployer has ISSUER_ROLE:", hasIssuerRole);
  
  // Check token contract
  const tokenHasIssuerRole = await carbonCreditToken.hasRole(ISSUER_ROLE, deployer.address);
  console.log("Token - Deployer has ISSUER_ROLE:", tokenHasIssuerRole);
  
  const currentTokenId = await carbonCreditToken.getCurrentTokenId();
  console.log("Token - Current Token ID:", currentTokenId.toString());

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      RegistryContract: {
        address: registryAddress,
        constructorArgs: [config.admin]
      },
      CarbonCreditToken: {
        address: tokenAddress,
        constructorArgs: [config.baseURI, config.admin]
      }
    },
    roles: {
      admin: config.admin,
      issuer: deployer.address
    },
    config: config
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `mvp-${network.name}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Create latest deployment symlink
  const latestFile = path.join(deploymentsDir, `mvp-${network.name}-latest.json`);
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Latest deployment info saved to:", latestFile);

  console.log("\n🎉 MVP Deployment Complete!");
  console.log("\n📋 Contract Addresses:");
  console.log("- RegistryContract:", registryAddress);
  console.log("- CarbonCreditToken:", tokenAddress);
  
  console.log("\n🔗 Next Steps:");
  console.log("1. Verify contracts on block explorer:");
  console.log(`   npx hardhat verify --network ${network.name} ${registryAddress} "${config.admin}"`);
  console.log(`   npx hardhat verify --network ${network.name} ${tokenAddress} "${config.baseURI}" "${config.admin}"`);
  console.log("2. Update backend configuration with contract addresses");
  console.log("3. Test basic functionality with sample transactions");
  console.log("4. Set up event indexing/subgraph");

  return deploymentInfo;
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;
