// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title VerificationController
 * @dev Manages verification attestations and oracle-based approvals
 * @notice Supports both direct auditor signatures and oracle attestations
 */
contract VerificationController is AccessControl, Pausable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant ATTESTOR_ROLE = keccak256("ATTESTOR_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // EIP-712 Type Hashes
    bytes32 private constant ATTESTATION_TYPEHASH = keccak256(
        "Attestation(bytes32 mrvId,bytes32 projectId,address auditor,uint256 tCO2e,uint256 nonce,uint256 deadline)"
    );

    bytes32 private constant BATCH_ATTESTATION_TYPEHASH = keccak256(
        "BatchAttestation(bytes32[] mrvIds,bytes32[] projectIds,address[] auditors,uint256[] tCO2eAmounts,uint256 nonce,uint256 deadline)"
    );

    enum AttestationType {
        DIRECT_SIGNATURE,
        ORACLE_ATTESTATION,
        MULTI_SIG_ATTESTATION
    }

    struct Attestation {
        bytes32 mrvId;
        bytes32 projectId;
        address auditor;
        address attestor;
        uint256 tCO2e;
        AttestationType attestationType;
        uint256 timestamp;
        bool valid;
        bool revoked;
    }

    struct OracleInfo {
        bool active;
        uint256 attestationCount;
        uint256 registeredAt;
        string endpoint;
    }

    // State variables
    mapping(bytes32 => Attestation) public attestations; // mrvId => Attestation
    mapping(address => OracleInfo) public oracles;
    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public revokedAttestations;
    
    uint256 public attestationValidityPeriod = 365 days;
    uint256 public minAttestationDelay = 1 hours;

    // Events
    event AttestationCreated(
        bytes32 indexed mrvId,
        bytes32 indexed projectId,
        address indexed auditor,
        address attestor,
        AttestationType attestationType,
        uint256 tCO2e,
        uint256 timestamp
    );

    event AttestationRevoked(
        bytes32 indexed mrvId,
        address indexed revoker,
        string reason,
        uint256 timestamp
    );

    event BatchAttestationCreated(
        bytes32[] mrvIds,
        address indexed attestor,
        uint256 count,
        uint256 timestamp
    );

    event OracleRegistered(
        address indexed oracle,
        string endpoint,
        uint256 timestamp
    );

    event OracleStatusChanged(
        address indexed oracle,
        bool active,
        uint256 timestamp
    );

    event AttestationValidityPeriodUpdated(
        uint256 oldPeriod,
        uint256 newPeriod,
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
     * @dev Create attestation with direct auditor signature
     * @param mrvId MRV identifier
     * @param projectId Project identifier
     * @param auditor Auditor address
     * @param tCO2e CO2 equivalent amount
     * @param deadline Signature deadline
     * @param signature Auditor's signature
     */
    function createDirectAttestation(
        bytes32 mrvId,
        bytes32 projectId,
        address auditor,
        uint256 tCO2e,
        uint256 deadline,
        bytes calldata signature
    ) external onlyRole(ATTESTOR_ROLE) whenNotPaused nonReentrant {
        require(!attestations[mrvId].valid, "Attestation already exists");
        require(block.timestamp <= deadline, "Signature expired");
        require(tCO2e > 0, "Invalid tCO2e amount");

        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                ATTESTATION_TYPEHASH,
                mrvId,
                projectId,
                auditor,
                tCO2e,
                nonces[auditor]++,
                deadline
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        address recoveredAuditor = hash.recover(signature);
        require(recoveredAuditor == auditor, "Invalid signature");

        _createAttestation(
            mrvId,
            projectId,
            auditor,
            msg.sender,
            tCO2e,
            AttestationType.DIRECT_SIGNATURE
        );
    }

    /**
     * @dev Create oracle-based attestation
     * @param mrvId MRV identifier
     * @param projectId Project identifier
     * @param auditor Auditor address
     * @param tCO2e CO2 equivalent amount
     */
    function createOracleAttestation(
        bytes32 mrvId,
        bytes32 projectId,
        address auditor,
        uint256 tCO2e
    ) external onlyRole(ORACLE_ROLE) whenNotPaused nonReentrant {
        require(!attestations[mrvId].valid, "Attestation already exists");
        require(oracles[msg.sender].active, "Oracle not active");
        require(tCO2e > 0, "Invalid tCO2e amount");

        _createAttestation(
            mrvId,
            projectId,
            auditor,
            msg.sender,
            tCO2e,
            AttestationType.ORACLE_ATTESTATION
        );

        oracles[msg.sender].attestationCount++;
    }

    /**
     * @dev Create batch attestations (oracle only)
     * @param mrvIds Array of MRV identifiers
     * @param projectIds Array of project identifiers
     * @param auditors Array of auditor addresses
     * @param tCO2eAmounts Array of CO2 equivalent amounts
     */
    function createBatchAttestation(
        bytes32[] calldata mrvIds,
        bytes32[] calldata projectIds,
        address[] calldata auditors,
        uint256[] calldata tCO2eAmounts
    ) external onlyRole(ORACLE_ROLE) whenNotPaused nonReentrant {
        require(
            mrvIds.length == projectIds.length &&
            projectIds.length == auditors.length &&
            auditors.length == tCO2eAmounts.length,
            "Array length mismatch"
        );
        require(mrvIds.length > 0, "Empty arrays");
        require(oracles[msg.sender].active, "Oracle not active");

        for (uint256 i = 0; i < mrvIds.length; i++) {
            require(!attestations[mrvIds[i]].valid, "Attestation already exists");
            require(tCO2eAmounts[i] > 0, "Invalid tCO2e amount");

            _createAttestation(
                mrvIds[i],
                projectIds[i],
                auditors[i],
                msg.sender,
                tCO2eAmounts[i],
                AttestationType.ORACLE_ATTESTATION
            );
        }

        oracles[msg.sender].attestationCount += mrvIds.length;
        emit BatchAttestationCreated(mrvIds, msg.sender, mrvIds.length, block.timestamp);
    }

    /**
     * @dev Revoke an attestation
     * @param mrvId MRV identifier
     * @param reason Reason for revocation
     */
    function revokeAttestation(
        bytes32 mrvId,
        string calldata reason
    ) external onlyRole(GOVERNANCE_ROLE) whenNotPaused {
        require(attestations[mrvId].valid, "Attestation does not exist");
        require(!attestations[mrvId].revoked, "Attestation already revoked");
        require(bytes(reason).length > 0, "Reason required");

        attestations[mrvId].revoked = true;
        revokedAttestations[mrvId] = true;

        emit AttestationRevoked(mrvId, msg.sender, reason, block.timestamp);
    }

    /**
     * @dev Register a new oracle
     * @param oracle Oracle address
     * @param endpoint Oracle endpoint URL
     */
    function registerOracle(
        address oracle,
        string calldata endpoint
    ) external onlyRole(GOVERNANCE_ROLE) {
        require(oracle != address(0), "Invalid oracle address");
        require(bytes(endpoint).length > 0, "Endpoint required");
        require(!oracles[oracle].active, "Oracle already registered");

        oracles[oracle] = OracleInfo({
            active: true,
            attestationCount: 0,
            registeredAt: block.timestamp,
            endpoint: endpoint
        });

        _grantRole(ORACLE_ROLE, oracle);
        emit OracleRegistered(oracle, endpoint, block.timestamp);
    }

    /**
     * @dev Set oracle status
     * @param oracle Oracle address
     * @param active New status
     */
    function setOracleStatus(
        address oracle,
        bool active
    ) external onlyRole(GOVERNANCE_ROLE) {
        require(oracles[oracle].registeredAt > 0, "Oracle not registered");

        oracles[oracle].active = active;

        if (active) {
            _grantRole(ORACLE_ROLE, oracle);
        } else {
            _revokeRole(ORACLE_ROLE, oracle);
        }

        emit OracleStatusChanged(oracle, active, block.timestamp);
    }

    /**
     * @dev Set attestation validity period
     * @param newPeriod New validity period in seconds
     */
    function setAttestationValidityPeriod(
        uint256 newPeriod
    ) external onlyRole(GOVERNANCE_ROLE) {
        require(newPeriod >= 30 days, "Period too short");
        require(newPeriod <= 1095 days, "Period too long"); // 3 years max

        uint256 oldPeriod = attestationValidityPeriod;
        attestationValidityPeriod = newPeriod;

        emit AttestationValidityPeriodUpdated(oldPeriod, newPeriod, block.timestamp);
    }

    /**
     * @dev Internal function to create attestation
     */
    function _createAttestation(
        bytes32 mrvId,
        bytes32 projectId,
        address auditor,
        address attestor,
        uint256 tCO2e,
        AttestationType attestationType
    ) internal {
        attestations[mrvId] = Attestation({
            mrvId: mrvId,
            projectId: projectId,
            auditor: auditor,
            attestor: attestor,
            tCO2e: tCO2e,
            attestationType: attestationType,
            timestamp: block.timestamp,
            valid: true,
            revoked: false
        });

        emit AttestationCreated(
            mrvId,
            projectId,
            auditor,
            attestor,
            attestationType,
            tCO2e,
            block.timestamp
        );
    }

    /**
     * @dev Check if attestation is valid and not expired
     * @param mrvId MRV identifier
     * @return valid Whether attestation is valid
     * @return expired Whether attestation is expired
     */
    function isAttestationValid(bytes32 mrvId) external view returns (bool valid, bool expired) {
        Attestation memory attestation = attestations[mrvId];
        
        if (!attestation.valid || attestation.revoked) {
            return (false, false);
        }

        bool isExpired = block.timestamp > attestation.timestamp + attestationValidityPeriod;
        return (true, isExpired);
    }

    /**
     * @dev Get attestation details
     * @param mrvId MRV identifier
     * @return Attestation struct
     */
    function getAttestation(bytes32 mrvId) external view returns (Attestation memory) {
        return attestations[mrvId];
    }

    /**
     * @dev Get oracle information
     * @param oracle Oracle address
     * @return Oracle information struct
     */
    function getOracleInfo(address oracle) external view returns (OracleInfo memory) {
        return oracles[oracle];
    }

    /**
     * @dev Get current nonce for address
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
     * @dev Grant attestor role
     * @param account Address to grant role to
     */
    function grantAttestorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ATTESTOR_ROLE, account);
    }

    /**
     * @dev Grant governance role
     * @param account Address to grant role to
     */
    function grantGovernanceRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(GOVERNANCE_ROLE, account);
    }
}
