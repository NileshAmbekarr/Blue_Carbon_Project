// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RegistryContract
 * @dev MVP contract for anchoring MRV report proofs and basic project references
 * @notice This contract stores minimal on-chain data (hashes & references) while keeping heavy files off-chain
 */
contract RegistryContract is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct MRVRecord {
        bytes32 projectId;
        string ipfsHash;
        uint256 tCO2e;
        address auditor;
        uint256 timestamp;
        bool exists;
    }

    struct ProjectInfo {
        address owner;
        string ipfsHash;
        uint256 createdAt;
        bool exists;
    }

    // Mappings
    mapping(bytes32 => MRVRecord) public mrvRecords;
    mapping(bytes32 => ProjectInfo) public projects;
    mapping(bytes32 => bytes32[]) public projectMRVs; // projectId => mrvIds[]

    // Events
    event ProjectRegistered(
        bytes32 indexed projectId,
        address indexed owner,
        string ipfsHash,
        uint256 timestamp
    );

    event MRVAnchored(
        bytes32 indexed mrvId,
        bytes32 indexed projectId,
        string ipfsHash,
        uint256 tCO2e,
        address indexed auditor,
        uint256 timestamp
    );

    event MRVUpdated(
        bytes32 indexed mrvId,
        string newIpfsHash,
        uint256 timestamp
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @dev Register a new project with basic metadata
     * @param projectId Unique identifier for the project
     * @param owner Address of the project owner
     * @param ipfsHash IPFS hash containing project metadata
     */
    function registerProject(
        bytes32 projectId,
        address owner,
        string calldata ipfsHash
    ) external onlyRole(ISSUER_ROLE) whenNotPaused {
        require(!projects[projectId].exists, "Project already exists");
        require(owner != address(0), "Invalid owner address");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");

        projects[projectId] = ProjectInfo({
            owner: owner,
            ipfsHash: ipfsHash,
            createdAt: block.timestamp,
            exists: true
        });

        emit ProjectRegistered(projectId, owner, ipfsHash, block.timestamp);
    }

    /**
     * @dev Anchor MRV report proof on-chain
     * @param mrvId Unique identifier for the MRV report
     * @param projectId Associated project identifier
     * @param ipfsHash IPFS hash of the MRV report
     * @param tCO2e Amount of CO2 equivalent in tonnes
     * @param auditor Address of the auditor who verified the report
     */
    function anchorMRV(
        bytes32 mrvId,
        bytes32 projectId,
        string calldata ipfsHash,
        uint256 tCO2e,
        address auditor
    ) external onlyRole(ISSUER_ROLE) whenNotPaused nonReentrant {
        require(!mrvRecords[mrvId].exists, "MRV already anchored");
        require(projects[projectId].exists, "Project not registered");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(tCO2e > 0, "tCO2e must be greater than 0");
        require(auditor != address(0), "Invalid auditor address");

        mrvRecords[mrvId] = MRVRecord({
            projectId: projectId,
            ipfsHash: ipfsHash,
            tCO2e: tCO2e,
            auditor: auditor,
            timestamp: block.timestamp,
            exists: true
        });

        projectMRVs[projectId].push(mrvId);

        emit MRVAnchored(mrvId, projectId, ipfsHash, tCO2e, auditor, block.timestamp);
    }

    /**
     * @dev Update MRV IPFS hash (for corrections or additional data)
     * @param mrvId MRV identifier to update
     * @param newIpfsHash New IPFS hash
     */
    function updateMRVHash(
        bytes32 mrvId,
        string calldata newIpfsHash
    ) external onlyRole(ISSUER_ROLE) whenNotPaused {
        require(mrvRecords[mrvId].exists, "MRV not found");
        require(bytes(newIpfsHash).length > 0, "IPFS hash required");

        mrvRecords[mrvId].ipfsHash = newIpfsHash;
        emit MRVUpdated(mrvId, newIpfsHash, block.timestamp);
    }

    /**
     * @dev Get MRV records for a project
     * @param projectId Project identifier
     * @return Array of MRV IDs associated with the project
     */
    function getProjectMRVs(bytes32 projectId) external view returns (bytes32[] memory) {
        return projectMRVs[projectId];
    }

    /**
     * @dev Check if MRV exists and get basic info
     * @param mrvId MRV identifier
     * @return exists Whether the MRV exists
     * @return projectId Associated project ID
     * @return tCO2e CO2 equivalent amount
     * @return auditor Auditor address
     */
    function getMRVInfo(bytes32 mrvId) external view returns (
        bool exists,
        bytes32 projectId,
        uint256 tCO2e,
        address auditor
    ) {
        MRVRecord memory record = mrvRecords[mrvId];
        return (record.exists, record.projectId, record.tCO2e, record.auditor);
    }

    /**
     * @dev Emergency pause function
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause function
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Grant issuer role to address
     * @param account Address to grant role to
     */
    function grantIssuerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ISSUER_ROLE, account);
    }

    /**
     * @dev Grant auditor role to address
     * @param account Address to grant role to
     */
    function grantAuditorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(AUDITOR_ROLE, account);
    }

    /**
     * @dev Revoke issuer role from address
     * @param account Address to revoke role from
     */
    function revokeIssuerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(ISSUER_ROLE, account);
    }

    /**
     * @dev Revoke auditor role from address
     * @param account Address to revoke role from
     */
    function revokeAuditorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(AUDITOR_ROLE, account);
    }
}
