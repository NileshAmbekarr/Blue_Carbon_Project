// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @title CarbonCreditToken
 * @dev ERC-1155 implementation for carbon credit tokens
 * @notice Semi-fungible tokens where each tokenId represents a credit batch/vintage
 */
contract CarbonCreditToken is 
    ERC1155, 
    AccessControl, 
    Pausable, 
    ReentrancyGuard, 
    ERC1155Burnable, 
    ERC1155Supply 
{
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct CreditBatch {
        bytes32 projectId;
        bytes32 mrvId;
        uint256 vintage; // Year of credit generation
        string metadataIpfsHash;
        uint256 totalIssued;
        uint256 totalRetired;
        address issuer;
        uint256 issuedAt;
        bool exists;
    }

    // Mappings
    mapping(uint256 => CreditBatch) public creditBatches;
    mapping(address => mapping(uint256 => uint256)) public retiredBalances;
    mapping(bytes32 => uint256[]) public projectTokens; // projectId => tokenIds[]
    
    uint256 private _currentTokenId;

    // Events
    event CreditsMinted(
        uint256 indexed tokenId,
        bytes32 indexed projectId,
        bytes32 indexed mrvId,
        uint256 amount,
        address to,
        string ipfsHash,
        uint256 vintage
    );

    event CreditsRetired(
        uint256 indexed tokenId,
        uint256 amount,
        address indexed retiredBy,
        address indexed beneficiary,
        string reason
    );

    event BatchMetadataUpdated(
        uint256 indexed tokenId,
        string newIpfsHash
    );

    constructor(
        string memory uri,
        address admin
    ) ERC1155(uri) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _currentTokenId = 1;
    }

    /**
     * @dev Mint a new batch of carbon credits
     * @param to Recipient address
     * @param projectId Associated project identifier
     * @param mrvId Associated MRV report identifier
     * @param amount Number of credits to mint
     * @param vintage Year of credit generation
     * @param metadataIpfsHash IPFS hash containing batch metadata
     */
    function mintBatch(
        address to,
        bytes32 projectId,
        bytes32 mrvId,
        uint256 amount,
        uint256 vintage,
        string calldata metadataIpfsHash
    ) external onlyRole(ISSUER_ROLE) whenNotPaused nonReentrant returns (uint256 tokenId) {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(vintage >= 2020 && vintage <= block.timestamp / 365 days + 1970, "Invalid vintage year");
        require(bytes(metadataIpfsHash).length > 0, "Metadata IPFS hash required");

        tokenId = _currentTokenId++;

        creditBatches[tokenId] = CreditBatch({
            projectId: projectId,
            mrvId: mrvId,
            vintage: vintage,
            metadataIpfsHash: metadataIpfsHash,
            totalIssued: amount,
            totalRetired: 0,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            exists: true
        });

        projectTokens[projectId].push(tokenId);

        _mint(to, tokenId, amount, "");

        emit CreditsMinted(tokenId, projectId, mrvId, amount, to, metadataIpfsHash, vintage);
    }

    /**
     * @dev Retire carbon credits (burn tokens and track retirement)
     * @param tokenId Token ID to retire
     * @param amount Amount to retire
     * @param beneficiary Address benefiting from the retirement
     * @param reason IPFS hash or string describing retirement reason
     */
    function retire(
        uint256 tokenId,
        uint256 amount,
        address beneficiary,
        string calldata reason
    ) external whenNotPaused nonReentrant {
        require(creditBatches[tokenId].exists, "Token batch does not exist");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        require(beneficiary != address(0), "Invalid beneficiary");

        // Burn the tokens
        _burn(msg.sender, tokenId, amount);

        // Update retired tracking
        creditBatches[tokenId].totalRetired += amount;
        retiredBalances[beneficiary][tokenId] += amount;

        emit CreditsRetired(tokenId, amount, msg.sender, beneficiary, reason);
    }

    /**
     * @dev Batch retire multiple token types
     * @param tokenIds Array of token IDs to retire
     * @param amounts Array of amounts to retire
     * @param beneficiary Address benefiting from the retirement
     * @param reason Retirement reason
     */
    function retireBatch(
        uint256[] calldata tokenIds,
        uint256[] calldata amounts,
        address beneficiary,
        string calldata reason
    ) external whenNotPaused nonReentrant {
        require(tokenIds.length == amounts.length, "Arrays length mismatch");
        require(beneficiary != address(0), "Invalid beneficiary");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(creditBatches[tokenIds[i]].exists, "Token batch does not exist");
            require(amounts[i] > 0, "Amount must be greater than 0");
            require(balanceOf(msg.sender, tokenIds[i]) >= amounts[i], "Insufficient balance");

            creditBatches[tokenIds[i]].totalRetired += amounts[i];
            retiredBalances[beneficiary][tokenIds[i]] += amounts[i];
        }

        _burnBatch(msg.sender, tokenIds, amounts);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            emit CreditsRetired(tokenIds[i], amounts[i], msg.sender, beneficiary, reason);
        }
    }

    /**
     * @dev Update batch metadata IPFS hash
     * @param tokenId Token ID to update
     * @param newIpfsHash New IPFS hash
     */
    function updateBatchMetadata(
        uint256 tokenId,
        string calldata newIpfsHash
    ) external onlyRole(ISSUER_ROLE) whenNotPaused {
        require(creditBatches[tokenId].exists, "Token batch does not exist");
        require(bytes(newIpfsHash).length > 0, "IPFS hash required");

        creditBatches[tokenId].metadataIpfsHash = newIpfsHash;
        emit BatchMetadataUpdated(tokenId, newIpfsHash);
    }

    /**
     * @dev Get token IDs for a project
     * @param projectId Project identifier
     * @return Array of token IDs associated with the project
     */
    function getProjectTokens(bytes32 projectId) external view returns (uint256[] memory) {
        return projectTokens[projectId];
    }

    /**
     * @dev Get batch information
     * @param tokenId Token ID
     * @return Batch information struct
     */
    function getBatchInfo(uint256 tokenId) external view returns (CreditBatch memory) {
        require(creditBatches[tokenId].exists, "Token batch does not exist");
        return creditBatches[tokenId];
    }

    /**
     * @dev Get retired balance for beneficiary and token
     * @param beneficiary Beneficiary address
     * @param tokenId Token ID
     * @return Amount retired for the beneficiary
     */
    function getRetiredBalance(address beneficiary, uint256 tokenId) external view returns (uint256) {
        return retiredBalances[beneficiary][tokenId];
    }

    /**
     * @dev Get current token ID counter
     * @return Current token ID that will be used for next mint
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _currentTokenId;
    }

    /**
     * @dev Set new base URI
     * @param newuri New base URI
     */
    function setURI(string memory newuri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(newuri);
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
     * @dev Revoke issuer role from address
     * @param account Address to revoke role from
     */
    function revokeIssuerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(ISSUER_ROLE, account);
    }

    // Override functions for multiple inheritance
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
