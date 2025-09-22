// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title ProjectRegistry
 * @dev Production-grade registry with auditor signature verification
 * @notice Implements EIP-712 for structured data signing and verification
 */
contract ProjectRegistry is AccessControl, Pausable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant PROJECT_REGISTRAR_ROLE = keccak256("PROJECT_REGISTRAR_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // EIP-712 Type Hashes
    bytes32 private constant MRV_APPROVAL_TYPEHASH = keccak256(
        "MRVApproval(bytes32 mrvId,bytes32 projectId,string ipfsHash,uint256 tCO2e,uint256 nonce,uint256 deadline)"
    );

    struct ProjectInfo {
        address owner;
        string projectIpfsHash;
        uint256 createdAt;
        bool active;
        bool exists;
    }

    struct MRVRecord {
        bytes32 projectId;
        string ipfsHash;
        uint256 tCO2e;
        address auditor;
        uint256 timestamp;
        bytes32 canonicalHash;
        bool approved;
        bool exists;
    }

    struct AuditorInfo {
        bool active;
        uint256 approvalCount;
        uint256 registeredAt;
    }

    // State variables
    mapping(bytes32 => ProjectInfo) public projects;
    mapping(bytes32 => MRVRecord) public mrvRecords;
    mapping(bytes32 => bytes32[]) public projectMRVs;
    mapping(address => AuditorInfo) public auditors;
    mapping(address => uint256) public nonces;

    // Events
    event ProjectRegistered(
        bytes32 indexed projectId,
        address indexed owner,
        string projectIpfsHash,
        uint256 timestamp
    );

    event ProjectStatusChanged(
        bytes32 indexed projectId,
        bool active,
        uint256 timestamp
    );

    event MRVAnchored(
        bytes32 indexed mrvId,
        bytes32 indexed projectId,
        address indexed auditor,
        string ipfsHash,
        uint256 tCO2e,
        bytes32 canonicalHash,
        uint256 timestamp
    );

    event MRVApproved(
        bytes32 indexed mrvId,
        address indexed auditor,
        uint256 timestamp
    );

    event AuditorRegistered(
        address indexed auditor,
        uint256 timestamp
    );

    event AuditorStatusChanged(
        address indexed auditor,
        bool active,
        uint256 timestamp
    );

    constructor(
        address admin,
        string memory name,
        string memory version
    ) EIP712(name, version) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
    }

    /**
     * @dev Register a new project
     * @param projectId Unique project identifier
     * @param owner Project owner address
     * @param projectIpfsHash IPFS hash containing project metadata
     */
    function registerProject(
        bytes32 projectId,
        address owner,
        string calldata projectIpfsHash
    ) external onlyRole(PROJECT_REGISTRAR_ROLE) whenNotPaused {
        require(!projects[projectId].exists, "Project already exists");
        require(owner != address(0), "Invalid owner address");
        require(bytes(projectIpfsHash).length > 0, "Project IPFS hash required");

        projects[projectId] = ProjectInfo({
            owner: owner,
            projectIpfsHash: projectIpfsHash,
            createdAt: block.timestamp,
            active: true,
            exists: true
        });

        emit ProjectRegistered(projectId, owner, projectIpfsHash, block.timestamp);
    }

    /**
     * @dev Anchor MRV with auditor signature verification (EIP-712)
     * @param mrvId Unique MRV identifier
     * @param projectId Associated project identifier
     * @param ipfsHash IPFS hash of MRV report
     * @param tCO2e CO2 equivalent amount
     * @param deadline Signature deadline
     * @param signature Auditor's EIP-712 signature
     */
    function anchorMRVWithSignature(
        bytes32 mrvId,
        bytes32 projectId,
        string calldata ipfsHash,
        uint256 tCO2e,
        uint256 deadline,
        bytes calldata signature
    ) external onlyRole(ISSUER_ROLE) whenNotPaused nonReentrant {
        require(!mrvRecords[mrvId].exists, "MRV already anchored");
        require(projects[projectId].exists && projects[projectId].active, "Project not active");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(tCO2e > 0, "tCO2e must be greater than 0");
        require(block.timestamp <= deadline, "Signature expired");

        // Verify auditor signature
        address auditor = _verifyMRVSignature(mrvId, projectId, ipfsHash, tCO2e, deadline, signature);
        require(auditors[auditor].active, "Auditor not active");

        // Compute canonical hash for tamper-proofing
        bytes32 canonicalHash = keccak256(abi.encodePacked(mrvId, projectId, ipfsHash, tCO2e, block.timestamp));

        mrvRecords[mrvId] = MRVRecord({
            projectId: projectId,
            ipfsHash: ipfsHash,
            tCO2e: tCO2e,
            auditor: auditor,
            timestamp: block.timestamp,
            canonicalHash: canonicalHash,
            approved: true,
            exists: true
        });

        projectMRVs[projectId].push(mrvId);
        auditors[auditor].approvalCount++;

        emit MRVAnchored(mrvId, projectId, auditor, ipfsHash, tCO2e, canonicalHash, block.timestamp);
        emit MRVApproved(mrvId, auditor, block.timestamp);
    }

    /**
     * @dev Register a new auditor
     * @param auditor Auditor address to register
     */
    function registerAuditor(address auditor) external onlyRole(GOVERNANCE_ROLE) {
        require(auditor != address(0), "Invalid auditor address");
        require(!auditors[auditor].active, "Auditor already registered");

        auditors[auditor] = AuditorInfo({
            active: true,
            approvalCount: 0,
            registeredAt: block.timestamp
        });

        _grantRole(AUDITOR_ROLE, auditor);
        emit AuditorRegistered(auditor, block.timestamp);
    }

    /**
     * @dev Set auditor status (active/inactive)
     * @param auditor Auditor address
     * @param active New status
     */
    function setAuditorStatus(address auditor, bool active) external onlyRole(GOVERNANCE_ROLE) {
        require(auditors[auditor].registeredAt > 0, "Auditor not registered");
        
        auditors[auditor].active = active;
        
        if (active) {
            _grantRole(AUDITOR_ROLE, auditor);
        } else {
            _revokeRole(AUDITOR_ROLE, auditor);
        }

        emit AuditorStatusChanged(auditor, active, block.timestamp);
    }

    /**
     * @dev Set project status (active/inactive)
     * @param projectId Project identifier
     * @param active New status
     */
    function setProjectStatus(bytes32 projectId, bool active) external onlyRole(GOVERNANCE_ROLE) {
        require(projects[projectId].exists, "Project does not exist");
        
        projects[projectId].active = active;
        emit ProjectStatusChanged(projectId, active, block.timestamp);
    }

    /**
     * @dev Verify MRV signature using EIP-712
     * @param mrvId MRV identifier
     * @param projectId Project identifier
     * @param ipfsHash IPFS hash
     * @param tCO2e CO2 equivalent amount
     * @param deadline Signature deadline
     * @param signature Auditor signature
     * @return auditor Address of the auditor who signed
     */
    function _verifyMRVSignature(
        bytes32 mrvId,
        bytes32 projectId,
        string calldata ipfsHash,
        uint256 tCO2e,
        uint256 deadline,
        bytes calldata signature
    ) internal returns (address auditor) {
        bytes32 structHash = keccak256(
            abi.encode(
                MRV_APPROVAL_TYPEHASH,
                mrvId,
                projectId,
                keccak256(bytes(ipfsHash)),
                tCO2e,
                nonces[msg.sender]++,
                deadline
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        auditor = hash.recover(signature);
        
        require(hasRole(AUDITOR_ROLE, auditor), "Invalid auditor signature");
    }

    /**
     * @dev Get project MRV records
     * @param projectId Project identifier
     * @return Array of MRV IDs
     */
    function getProjectMRVs(bytes32 projectId) external view returns (bytes32[] memory) {
        return projectMRVs[projectId];
    }

    /**
     * @dev Get MRV information
     * @param mrvId MRV identifier
     * @return MRV record details
     */
    function getMRVInfo(bytes32 mrvId) external view returns (
        bool exists,
        bytes32 projectId,
        uint256 tCO2e,
        address auditor,
        bool approved,
        bytes32 canonicalHash
    ) {
        MRVRecord memory record = mrvRecords[mrvId];
        return (
            record.exists,
            record.projectId,
            record.tCO2e,
            record.auditor,
            record.approved,
            record.canonicalHash
        );
    }

    /**
     * @dev Get auditor statistics
     * @param auditor Auditor address
     * @return active Whether auditor is active
     * @return approvalCount Number of approvals made
     * @return registeredAt Registration timestamp
     */
    function getAuditorInfo(address auditor) external view returns (
        bool active,
        uint256 approvalCount,
        uint256 registeredAt
    ) {
        AuditorInfo memory info = auditors[auditor];
        return (info.active, info.approvalCount, info.registeredAt);
    }

    /**
     * @dev Get current nonce for address (for signature replay protection)
     * @param account Account address
     * @return Current nonce
     */
    function getNonce(address account) external view returns (uint256) {
        return nonces[account];
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Grant project registrar role
     * @param account Address to grant role to
     */
    function grantProjectRegistrarRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(PROJECT_REGISTRAR_ROLE, account);
    }

    /**
     * @dev Grant issuer role
     * @param account Address to grant role to
     */
    function grantIssuerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ISSUER_ROLE, account);
    }

    /**
     * @dev Grant governance role
     * @param account Address to grant role to
     */
    function grantGovernanceRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(GOVERNANCE_ROLE, account);
    }
}
