# Blue Carbon Blockchain Registry

A comprehensive blockchain registry system for the Blue Carbon Project, implementing both MVP and production-grade smart contracts for carbon credit lifecycle management.

## 🏗️ Architecture Overview

This blockchain registry implements a two-tier approach:

### MVP (Minimum Viable Product)
- **RegistryContract**: Simple MRV anchoring and project registration
- **CarbonCreditToken**: ERC-1155 based carbon credits with basic retirement
- **AccessControl**: Role-based permissions (Admin, Issuer, Auditor)

### Production (Full-Featured)
- **ProjectRegistry**: Advanced project management with EIP-712 signature verification
- **VerificationController**: Oracle-based attestations and auditor signature verification
- **BufferPool**: Permanence risk management with buffer reserves
- **CarbonCreditToken**: Enhanced with production features

## 📋 Features

### Core Functionality
- ✅ **Project Registration**: On-chain project anchoring with IPFS metadata
- ✅ **MRV Anchoring**: Immutable MRV report proofs with auditor verification
- ✅ **Credit Issuance**: ERC-1155 batch tokens for carbon credits
- ✅ **Credit Retirement**: Permanent retirement with beneficiary tracking
- ✅ **Role-Based Access**: Multi-tier permission system

### Production Features
- ✅ **EIP-712 Signatures**: Cryptographic auditor verification
- ✅ **Oracle Integration**: Decentralized verification attestations
- ✅ **Buffer Management**: Permanence risk coverage
- ✅ **Reversal Handling**: Systematic reversal event management
- ✅ **Governance Controls**: Multi-sig and timelock integration

### Security & Compliance
- ✅ **Pausable Contracts**: Emergency stop functionality
- ✅ **Reentrancy Protection**: Secure state transitions
- ✅ **Access Control**: OpenZeppelin role-based permissions
- ✅ **Signature Verification**: EIP-712 structured data signing
- ✅ **Event Logging**: Comprehensive audit trail

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Hardhat
- MetaMask or similar wallet
- Polygon Mumbai testnet access

### Installation

```bash
# Clone and install dependencies
cd blockchain_registery
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your configuration
```

### Environment Setup

```bash
# Required environment variables
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### Deployment

#### MVP Deployment (Testnet)
```bash
# Deploy MVP contracts to Mumbai testnet
npm run deploy:mumbai

# Verify contracts
npm run verify:mumbai
```

#### Production Deployment
```bash
# Deploy production contracts
npm run deploy:polygon

# Verify contracts
npm run verify:polygon
```

## 📖 Contract Documentation

### MVP Contracts

#### RegistryContract
```solidity
// Register a new project
function registerProject(bytes32 projectId, address owner, string ipfsHash)

// Anchor MRV report
function anchorMRV(bytes32 mrvId, bytes32 projectId, string ipfsHash, uint256 tCO2e, address auditor)

// Get project MRVs
function getProjectMRVs(bytes32 projectId) returns (bytes32[])
```

#### CarbonCreditToken
```solidity
// Mint credit batch
function mintBatch(address to, bytes32 projectId, bytes32 mrvId, uint256 amount, uint256 vintage, string metadataHash)

// Retire credits
function retire(uint256 tokenId, uint256 amount, address beneficiary, string reason)

// Get batch info
function getBatchInfo(uint256 tokenId) returns (CreditBatch)
```

### Production Contracts

#### ProjectRegistry
```solidity
// Register project
function registerProject(bytes32 projectId, address owner, string projectIpfsHash)

// Anchor MRV with signature verification
function anchorMRVWithSignature(bytes32 mrvId, bytes32 projectId, string ipfsHash, uint256 tCO2e, uint256 deadline, bytes signature)

// Register auditor
function registerAuditor(address auditor)
```

#### VerificationController
```solidity
// Create direct attestation
function createDirectAttestation(bytes32 mrvId, bytes32 projectId, address auditor, uint256 tCO2e, uint256 deadline, bytes signature)

// Create oracle attestation
function createOracleAttestation(bytes32 mrvId, bytes32 projectId, address auditor, uint256 tCO2e)

// Register oracle
function registerOracle(address oracle, string endpoint)
```

#### BufferPool
```solidity
// Reserve buffer credits
function reserveBuffer(uint256 tokenId, bytes32 projectId, uint256 totalIssued, uint256 customPercentage)

// Execute reversal
function executeReversal(bytes32 reversalId, bytes32 projectId, uint256 tokenId, uint256 creditsAffected, string evidenceIpfsHash)
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run specific test suite
npx hardhat test test/mvp/RegistryContract.test.js
npx hardhat test test/mvp/CarbonCreditToken.test.js

# Run with coverage
npm run coverage
```

### Test Coverage
- ✅ Contract deployment and initialization
- ✅ Role-based access control
- ✅ Project registration and management
- ✅ MRV anchoring and verification
- ✅ Credit minting and retirement
- ✅ Buffer pool management
- ✅ Emergency pause functionality
- ✅ Event emission verification

## 🔗 Integration

### Backend Integration

The blockchain registry integrates with the Blue Carbon Project backend through:

```javascript
const BlockchainIntegrationService = require('./services/blockchain-integration');

// Initialize service
const blockchainService = new BlockchainIntegrationService(config);
await blockchainService.initialize();

// Register project
const result = await blockchainService.registerProject({
  projectId: "PROJECT_001",
  owner: "0x...",
  ipfsHash: "QmHash..."
});
```

### Frontend Integration

The React dashboard integrates using Wagmi hooks:

```typescript
import { useContractWrite } from 'wagmi';
import { registryABI } from './abis/RegistryContract';

const { write: registerProject } = useContractWrite({
  address: REGISTRY_ADDRESS,
  abi: registryABI,
  functionName: 'registerProject'
});
```

## 📊 Event Indexing

### Subgraph Deployment

```bash
# Install Graph CLI
npm install -g @graphprotocol/graph-cli

# Deploy subgraph
cd subgraph
graph deploy --product hosted-service your-username/blue-carbon-registry
```

### Key Events Indexed
- `ProjectRegistered`: New project registrations
- `MRVAnchored`: MRV report anchoring
- `CreditsMinted`: Credit batch issuance
- `CreditsRetired`: Credit retirements
- `BufferReserved`: Buffer pool reserves
- `ReversalExecuted`: Reversal events

## 🔐 Security Considerations

### Access Control
- **DEFAULT_ADMIN_ROLE**: Contract administration
- **ISSUER_ROLE**: Project and MRV operations
- **AUDITOR_ROLE**: MRV verification
- **GOVERNANCE_ROLE**: System governance
- **ORACLE_ROLE**: Attestation creation

### Best Practices
- All admin roles should be transferred to multisig wallets
- Use Timelock contracts for governance operations
- Regular security audits before mainnet deployment
- Emergency pause procedures for incident response

## 🌐 Network Configuration

### Supported Networks
- **Mumbai Testnet**: Development and testing
- **Polygon Mainnet**: Production deployment
- **Ethereum Mainnet**: Future consideration
- **Other L2s**: Arbitrum, Optimism (configurable)

### Gas Optimization
- ERC-1155 for batch operations
- Minimal on-chain storage (IPFS for heavy data)
- Efficient event logging
- Batch operations where possible

## 📈 Monitoring & Analytics

### Key Metrics
- Total projects registered
- Total MRV reports anchored
- Total credits issued/retired
- Buffer pool utilization
- Gas usage optimization

### Dashboard Integration
- Real-time blockchain status
- Transaction monitoring
- Event-based notifications
- Performance analytics

## 🛠️ Development

### Local Development
```bash
# Start local hardhat node
npm run node

# Deploy to local network
npx hardhat run scripts/deploy-mvp.js --network localhost

# Run console
npm run console
```

### Contract Verification
```bash
# Verify on Polygonscan
npx hardhat verify --network mumbai CONTRACT_ADDRESS "CONSTRUCTOR_ARG1" "CONSTRUCTOR_ARG2"
```

## 📚 Additional Resources

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [ERC-1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [The Graph Protocol](https://thegraph.com/docs/)
- [Hardhat Documentation](https://hardhat.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**⚠️ Important**: This is a production-grade system handling real carbon credits. Always conduct thorough testing and security audits before mainnet deployment.
