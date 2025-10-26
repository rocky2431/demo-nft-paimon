// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RWABondNFT
 * @notice ERC-721 NFT representing RWA bond certificates with gamification
 * @dev Features:
 * - 5,000 supply @ 100 USDC per NFT
 * - 90-day maturity with 2% APY base yield
 * - Chainlink VRF integration for dice rolling game
 * - Dynamic metadata based on accumulated Remint earnings
 * - 5 rarity tiers: Bronze → Silver → Gold → Diamond → Legendary
 */
contract RWABondNFT is ERC721, ERC721URIStorage, Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ==================== State Variables ====================

    /// @notice USDC token (6 decimals)
    IERC20 public immutable USDC;

    /// @notice Treasury address to receive mint payments
    address public treasury;

    /// @notice VRF Coordinator address
    address public immutable vrfCoordinator;

    /// @notice VRF Subscription ID
    uint64 public immutable vrfSubscriptionId;

    /// @notice VRF Key Hash
    bytes32 public immutable vrfKeyHash;

    /// @notice VRF Callback Gas Limit
    uint32 public immutable vrfCallbackGasLimit;

    /// @notice Maximum supply of NFTs
    uint256 public constant maxSupply = 5_000;

    /// @notice Mint price in USDC (100 USDC with 6 decimals)
    uint256 public constant mintPrice = 100 * 1e6;

    /// @notice Maturity period in days
    uint256 public constant maturityDays = 90;

    /// @notice Base yield for 90 days (0.5 USDC = 2% APY)
    uint256 public constant baseYieldAmount = 0.5 * 1e6;

    /// @notice Current token ID counter
    uint256 private _tokenIdCounter;

    /// @notice Rarity tier thresholds (in USDC)
    uint256 public constant BRONZE_THRESHOLD = 0;
    uint256 public constant SILVER_THRESHOLD = 2 * 1e6;
    uint256 public constant GOLD_THRESHOLD = 4 * 1e6;
    uint256 public constant DIAMOND_THRESHOLD = 6 * 1e6;
    uint256 public constant LEGENDARY_THRESHOLD = 8 * 1e6;

    /// @notice Bond information for each token
    struct BondInfo {
        uint128 principal; // Principal amount (100 USDC)
        uint64 mintTime; // Timestamp of minting
        uint64 maturityDate; // Maturity date (mintTime + 90 days)
        uint128 accumulatedRemint; // Accumulated Remint earnings from dice game
        uint8 diceType; // 0 = Normal, 1 = Gold, 2 = Diamond
        uint8 weeklyRollsLeft; // Remaining dice rolls this week
    }

    /// @notice Mapping of tokenId to BondInfo
    mapping(uint256 => BondInfo) private _bondInfo;

    /// @notice Mapping of VRF requestId to tokenId (for dice rolling)
    mapping(uint256 => uint256) private _vrfRequestToTokenId;

    // ==================== Events ====================

    event NFTMinted(address indexed minter, uint256 indexed tokenId, uint256 quantity, uint256 totalCost);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event DiceRolled(uint256 indexed tokenId, uint256 requestId, uint8 diceType);
    event DiceResult(uint256 indexed tokenId, uint256 result, uint256 remintEarned);
    event RarityUpgraded(uint256 indexed tokenId, string oldRarity, string newRarity);

    // ==================== Constructor ====================

    constructor(
        address _usdc,
        address _treasury,
        address _vrfCoordinator,
        uint64 _vrfSubscriptionId,
        bytes32 _vrfKeyHash,
        uint32 _vrfCallbackGasLimit
    ) ERC721("Paimon Bond NFT", "PAIMON-BOND") Ownable(msg.sender) {
        require(_usdc != address(0), "RWABondNFT: zero address USDC");
        require(_treasury != address(0), "RWABondNFT: zero address treasury");
        require(_vrfCoordinator != address(0), "RWABondNFT: zero address VRF coordinator");

        USDC = IERC20(_usdc);
        treasury = _treasury;
        vrfCoordinator = _vrfCoordinator;
        vrfSubscriptionId = _vrfSubscriptionId;
        vrfKeyHash = _vrfKeyHash;
        vrfCallbackGasLimit = _vrfCallbackGasLimit;
    }

    // ==================== Minting Functions ====================

    /**
     * @notice Mint NFTs by paying USDC
     * @param quantity Number of NFTs to mint
     */
    function mint(uint256 quantity) external whenNotPaused nonReentrant {
        require(quantity > 0, "RWABondNFT: quantity must be > 0");
        require(_tokenIdCounter + quantity <= maxSupply, "RWABondNFT: exceeds max supply");

        uint256 totalCost = mintPrice * quantity;

        // Transfer USDC from minter to treasury
        USDC.safeTransferFrom(msg.sender, treasury, totalCost);

        // Mint NFTs
        for (uint256 i = 0; i < quantity; i++) {
            _tokenIdCounter++;
            uint256 newTokenId = _tokenIdCounter;

            _safeMint(msg.sender, newTokenId);

            // Initialize bond info
            _bondInfo[newTokenId] = BondInfo({
                principal: uint128(mintPrice),
                mintTime: uint64(block.timestamp),
                maturityDate: uint64(block.timestamp + maturityDays * 1 days),
                accumulatedRemint: 0,
                diceType: 0, // Normal dice
                weeklyRollsLeft: 1 // 1 free roll per week
            });
        }

        emit NFTMinted(msg.sender, _tokenIdCounter - quantity + 1, quantity, totalCost);
    }

    // ==================== Yield Calculation Functions ====================

    /**
     * @notice Calculate base yield for a token (2% APY for 90 days)
     * @param tokenId Token ID
     * @return Base yield amount in USDC
     */
    function calculateBaseYield(uint256 tokenId) public view returns (uint256) {
        _requireOwned(tokenId);

        BondInfo memory bond = _bondInfo[tokenId];
        uint256 timeElapsed = block.timestamp - bond.mintTime;
        uint256 maturityTime = maturityDays * 1 days;

        if (timeElapsed >= maturityTime) {
            return baseYieldAmount;
        }

        // Linear yield accrual: (timeElapsed / maturityTime) * baseYieldAmount
        return (timeElapsed * baseYieldAmount) / maturityTime;
    }

    /**
     * @notice Calculate total yield (base + Remint)
     * @param tokenId Token ID
     * @return Total yield amount in USDC
     */
    function calculateTotalYield(uint256 tokenId) public view returns (uint256) {
        _requireOwned(tokenId);

        uint256 baseYield = calculateBaseYield(tokenId);
        uint256 remintYield = _bondInfo[tokenId].accumulatedRemint;

        return baseYield + remintYield;
    }

    // ==================== Maturity Functions ====================

    /**
     * @notice Check if a token has matured
     * @param tokenId Token ID
     * @return True if matured
     */
    function isMatured(uint256 tokenId) public view returns (bool) {
        _requireOwned(tokenId);
        return block.timestamp >= _bondInfo[tokenId].maturityDate;
    }

    // ==================== Metadata Functions ====================

    /**
     * @notice Get rarity tier based on accumulated Remint
     * @param tokenId Token ID
     * @return Rarity tier name
     */
    function getRarityTier(uint256 tokenId) public view returns (string memory) {
        _requireOwned(tokenId);

        uint256 remint = _bondInfo[tokenId].accumulatedRemint;

        if (remint >= LEGENDARY_THRESHOLD) return "Legendary";
        if (remint >= DIAMOND_THRESHOLD) return "Diamond";
        if (remint >= GOLD_THRESHOLD) return "Gold";
        if (remint >= SILVER_THRESHOLD) return "Silver";
        return "Bronze";
    }

    /**
     * @notice Generate token URI with dynamic metadata
     * @param tokenId Token ID
     * @return Token URI (JSON)
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        _requireOwned(tokenId);

        BondInfo memory bond = _bondInfo[tokenId];
        string memory rarity = getRarityTier(tokenId);

        // For now, return a simple JSON string
        // TODO: Implement full JSON metadata with IPFS images
        string memory json = string(
            abi.encodePacked(
                '{"name": "Paimon Bond NFT #',
                _toString(tokenId),
                '", "description": "RWA Bond Certificate with gamified yield", "rarity": "',
                rarity,
                '", "maturity": ',
                _toString(bond.maturityDate),
                "}"
            )
        );

        return json;
    }

    // ==================== View Functions ====================

    /**
     * @notice Get bond information for a token
     * @param tokenId Token ID
     * @return principal Principal amount in USDC
     * @return mintTime Timestamp of minting
     * @return maturityDate Maturity date (mintTime + 90 days)
     * @return accumulatedRemint Accumulated Remint earnings
     * @return diceType Dice type (0=Normal, 1=Gold, 2=Diamond)
     * @return weeklyRollsLeft Remaining dice rolls this week
     */
    function getBondInfo(uint256 tokenId)
        external
        view
        returns (uint128 principal, uint64 mintTime, uint64 maturityDate, uint128 accumulatedRemint, uint8 diceType, uint8 weeklyRollsLeft)
    {
        _requireOwned(tokenId);

        BondInfo memory bond = _bondInfo[tokenId];
        return (bond.principal, bond.mintTime, bond.maturityDate, bond.accumulatedRemint, bond.diceType, bond.weeklyRollsLeft);
    }

    /**
     * @notice Get total supply of minted NFTs
     * @return Total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // ==================== Admin Functions ====================

    /**
     * @notice Pause contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Set treasury address
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "RWABondNFT: zero address treasury");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    // ==================== Internal Functions ====================

    /**
     * @notice Convert uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @notice Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
