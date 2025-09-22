// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

/**
 * @title BufferPool
 * @dev Manages buffer credits for permanence risk coverage
 * @notice Holds reserved credits to cover potential reversals
 */
contract BufferPool is AccessControl, Pausable, ReentrancyGuard, ERC1155Holder {
    bytes32 public constant BUFFER_MANAGER_ROLE = keccak256("BUFFER_MANAGER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct BufferReserve {
        uint256 totalReserved;
        uint256 totalUsed;
        uint256 reservePercentage; // Basis points (e.g., 500 = 5%)
        bool active;
    }

    struct ReversalEvent {
        bytes32 projectId;
        uint256 tokenId;
        uint256 creditsAffected;
        uint256 bufferUsed;
        string evidenceIpfsHash;
        address executor;
        uint256 timestamp;
        bool executed;
    }

    // State variables
    IERC1155 public immutable carbonCreditToken;
    mapping(uint256 => BufferReserve) public bufferReserves; // tokenId => BufferReserve
    mapping(bytes32 => ReversalEvent) public reversalEvents; // reversalId => ReversalEvent
    mapping(bytes32 => uint256[]) public projectBufferTokens; // projectId => tokenIds[]
    
    uint256 public defaultBufferPercentage = 1000; // 10% default
    uint256 public constant MAX_BUFFER_PERCENTAGE = 5000; // 50% maximum
    uint256 public constant BASIS_POINTS = 10000;

    // Events
    event BufferReserved(
        uint256 indexed tokenId,
        bytes32 indexed projectId,
        uint256 amount,
        uint256 percentage,
        uint256 timestamp
    );

    event BufferPercentageUpdated(
        uint256 indexed tokenId,
        uint256 oldPercentage,
        uint256 newPercentage,
        uint256 timestamp
    );

    event ReversalExecuted(
        bytes32 indexed reversalId,
        bytes32 indexed projectId,
        uint256 indexed tokenId,
        uint256 creditsAffected,
        uint256 bufferUsed,
        string evidenceIpfsHash,
        uint256 timestamp
    );

    event BufferWithdrawn(
        uint256 indexed tokenId,
        address indexed to,
        uint256 amount,
        string reason,
        uint256 timestamp
    );

    event DefaultBufferPercentageUpdated(
        uint256 oldPercentage,
        uint256 newPercentage,
        uint256 timestamp
    );

    constructor(
        address admin,
        address carbonCreditTokenAddress
    ) {
        require(carbonCreditTokenAddress != address(0), "Invalid token address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
        
        carbonCreditToken = IERC1155(carbonCreditTokenAddress);
    }

    /**
     * @dev Reserve buffer credits for a token batch
     * @param tokenId Token ID to reserve buffer for
     * @param projectId Associated project ID
     * @param totalIssued Total credits issued for this batch
     * @param customPercentage Custom buffer percentage (0 to use default)
     */
    function reserveBuffer(
        uint256 tokenId,
        bytes32 projectId,
        uint256 totalIssued,
        uint256 customPercentage
    ) external onlyRole(BUFFER_MANAGER_ROLE) whenNotPaused nonReentrant {
        require(totalIssued > 0, "Invalid total issued amount");
        require(!bufferReserves[tokenId].active, "Buffer already reserved");
        
        uint256 percentage = customPercentage > 0 ? customPercentage : defaultBufferPercentage;
        require(percentage <= MAX_BUFFER_PERCENTAGE, "Buffer percentage too high");
        
        uint256 bufferAmount = (totalIssued * percentage) / BASIS_POINTS;
        require(bufferAmount > 0, "Buffer amount must be greater than 0");
        
        // Transfer buffer credits to this contract
        carbonCreditToken.safeTransferFrom(msg.sender, address(this), tokenId, bufferAmount, "");
        
        bufferReserves[tokenId] = BufferReserve({
            totalReserved: bufferAmount,
            totalUsed: 0,
            reservePercentage: percentage,
            active: true
        });
        
        projectBufferTokens[projectId].push(tokenId);
        
        emit BufferReserved(tokenId, projectId, bufferAmount, percentage, block.timestamp);
    }

    /**
     * @dev Execute reversal and use buffer credits
     * @param reversalId Unique reversal identifier
     * @param projectId Project affected by reversal
     * @param tokenId Token ID affected
     * @param creditsAffected Number of credits affected by reversal
     * @param evidenceIpfsHash IPFS hash of reversal evidence
     */
    function executeReversal(
        bytes32 reversalId,
        bytes32 projectId,
        uint256 tokenId,
        uint256 creditsAffected,
        string calldata evidenceIpfsHash
    ) external onlyRole(GOVERNANCE_ROLE) whenNotPaused nonReentrant {
        require(!reversalEvents[reversalId].executed, "Reversal already executed");
        require(bufferReserves[tokenId].active, "No active buffer for token");
        require(creditsAffected > 0, "Credits affected must be greater than 0");
        require(bytes(evidenceIpfsHash).length > 0, "Evidence IPFS hash required");
        
        BufferReserve storage buffer = bufferReserves[tokenId];
        uint256 availableBuffer = buffer.totalReserved - buffer.totalUsed;
        
        require(availableBuffer >= creditsAffected, "Insufficient buffer credits");
        
        // Update buffer usage
        buffer.totalUsed += creditsAffected;
        
        // Record reversal event
        reversalEvents[reversalId] = ReversalEvent({
            projectId: projectId,
            tokenId: tokenId,
            creditsAffected: creditsAffected,
            bufferUsed: creditsAffected,
            evidenceIpfsHash: evidenceIpfsHash,
            executor: msg.sender,
            timestamp: block.timestamp,
            executed: true
        });
        
        emit ReversalExecuted(
            reversalId,
            projectId,
            tokenId,
            creditsAffected,
            creditsAffected,
            evidenceIpfsHash,
            block.timestamp
        );
    }

    /**
     * @dev Update buffer percentage for a token
     * @param tokenId Token ID to update
     * @param newPercentage New buffer percentage
     */
    function updateBufferPercentage(
        uint256 tokenId,
        uint256 newPercentage
    ) external onlyRole(GOVERNANCE_ROLE) whenNotPaused {
        require(bufferReserves[tokenId].active, "Buffer not active");
        require(newPercentage <= MAX_BUFFER_PERCENTAGE, "Percentage too high");
        
        uint256 oldPercentage = bufferReserves[tokenId].reservePercentage;
        bufferReserves[tokenId].reservePercentage = newPercentage;
        
        emit BufferPercentageUpdated(tokenId, oldPercentage, newPercentage, block.timestamp);
    }

    /**
     * @dev Set default buffer percentage for new tokens
     * @param newPercentage New default percentage
     */
    function setDefaultBufferPercentage(
        uint256 newPercentage
    ) external onlyRole(GOVERNANCE_ROLE) {
        require(newPercentage <= MAX_BUFFER_PERCENTAGE, "Percentage too high");
        
        uint256 oldPercentage = defaultBufferPercentage;
        defaultBufferPercentage = newPercentage;
        
        emit DefaultBufferPercentageUpdated(oldPercentage, newPercentage, block.timestamp);
    }

    /**
     * @dev Withdraw unused buffer credits (governance only)
     * @param tokenId Token ID to withdraw from
     * @param to Recipient address
     * @param amount Amount to withdraw
     * @param reason Reason for withdrawal
     */
    function withdrawBuffer(
        uint256 tokenId,
        address to,
        uint256 amount,
        string calldata reason
    ) external onlyRole(GOVERNANCE_ROLE) whenNotPaused nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(reason).length > 0, "Reason required");
        require(bufferReserves[tokenId].active, "Buffer not active");
        
        BufferReserve storage buffer = bufferReserves[tokenId];
        uint256 availableBuffer = buffer.totalReserved - buffer.totalUsed;
        
        require(availableBuffer >= amount, "Insufficient available buffer");
        
        // Update buffer reserve
        buffer.totalReserved -= amount;
        
        // Transfer credits
        carbonCreditToken.safeTransferFrom(address(this), to, tokenId, amount, "");
        
        emit BufferWithdrawn(tokenId, to, amount, reason, block.timestamp);
    }

    /**
     * @dev Get buffer information for a token
     * @param tokenId Token ID
     * @return totalReserved Total buffer credits reserved
     * @return totalUsed Total buffer credits used
     * @return available Available buffer credits
     * @return percentage Buffer percentage
     * @return active Whether buffer is active
     */
    function getBufferInfo(uint256 tokenId) external view returns (
        uint256 totalReserved,
        uint256 totalUsed,
        uint256 available,
        uint256 percentage,
        bool active
    ) {
        BufferReserve memory buffer = bufferReserves[tokenId];
        return (
            buffer.totalReserved,
            buffer.totalUsed,
            buffer.totalReserved - buffer.totalUsed,
            buffer.reservePercentage,
            buffer.active
        );
    }

    /**
     * @dev Get project buffer tokens
     * @param projectId Project identifier
     * @return Array of token IDs with buffer reserves
     */
    function getProjectBufferTokens(bytes32 projectId) external view returns (uint256[] memory) {
        return projectBufferTokens[projectId];
    }

    /**
     * @dev Get reversal event details
     * @param reversalId Reversal identifier
     * @return Reversal event details
     */
    function getReversalEvent(bytes32 reversalId) external view returns (ReversalEvent memory) {
        return reversalEvents[reversalId];
    }

    /**
     * @dev Calculate buffer amount for given issued amount and percentage
     * @param issuedAmount Amount of credits issued
     * @param percentage Buffer percentage in basis points
     * @return Buffer amount required
     */
    function calculateBufferAmount(
        uint256 issuedAmount,
        uint256 percentage
    ) external pure returns (uint256) {
        return (issuedAmount * percentage) / BASIS_POINTS;
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
     * @dev Grant buffer manager role
     * @param account Address to grant role to
     */
    function grantBufferManagerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(BUFFER_MANAGER_ROLE, account);
    }

    /**
     * @dev Grant governance role
     * @param account Address to grant role to
     */
    function grantGovernanceRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(GOVERNANCE_ROLE, account);
    }
}
