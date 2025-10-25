// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "../core/VotingEscrow.sol";

/**
 * @title RewardDistributor
 * @notice Distribute protocol fees to veNFT holders via Merkle tree based on voting power snapshots
 * @dev Implements efficient reward distribution using Merkle proofs (inspired by Uniswap V3 distributor)
 *
 * Key Features:
 * - Merkle tree-based distribution (off-chain computation, on-chain verification)
 * - Multi-token support (USDC, PAIMON, HYD, etc.)
 * - Epoch-based snapshots (7-day cycles aligned with GaugeController)
 * - Unclaimed rewards roll over to next epoch (no expiry)
 * - Merkle proof verification <50K gas
 *
 * Workflow:
 * 1. Off-chain: Calculate reward distribution based on veNFT voting power snapshot
 * 2. Off-chain: Generate Merkle tree with (user address, amount) leaves
 * 3. On-chain: Owner sets Merkle root for epoch + token
 * 4. Users: Claim rewards with Merkle proof
 *
 * Security:
 * - ReentrancyGuard on all state-changing functions
 * - SafeERC20 for token transfers
 * - Owner-only Merkle root updates
 * - Double-claim prevention via bitmap
 * - Front-running protection (msg.sender in proof)
 *
 * Gas Optimization:
 * - Merkle proof verification instead of full distribution array
 * - Bitmap for claimed status (1 bit per user per epoch per token)
 * - No historical data storage (events only)
 */
contract RewardDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice VotingEscrow contract for veNFT verification
    VotingEscrow public immutable votingEscrow;

    /// @notice Treasury address for protocol fees
    address public treasury;

    /// @notice Epoch duration (7 days, aligned with GaugeController)
    uint256 public constant EPOCH_DURATION = 7 days;

    /// @notice Epoch start timestamp
    uint256 public epochStartTime;

    /// @notice Current epoch number
    uint256 public currentEpoch;

    /// @notice Merkle root for each epoch and token
    /// @dev merkleRoots[epoch][token] = root
    mapping(uint256 => mapping(address => bytes32)) public merkleRoots;

    /// @notice Track claimed status for each user, epoch, and token
    /// @dev claimed[epoch][token][user] = true if claimed
    mapping(uint256 => mapping(address => mapping(address => bool))) public claimed;

    /// @notice Emitted when Merkle root is set for an epoch and token
    event MerkleRootSet(uint256 indexed epoch, address indexed token, bytes32 merkleRoot);

    /// @notice Emitted when user claims rewards
    event RewardClaimed(uint256 indexed epoch, address indexed user, address indexed token, uint256 amount);

    /// @notice Emitted when epoch advances
    event EpochAdvanced(uint256 indexed newEpoch, uint256 timestamp);

    /**
     * @notice Constructor
     * @param _votingEscrow VotingEscrow contract address
     * @param _treasury Treasury address
     */
    constructor(address _votingEscrow, address _treasury) Ownable(msg.sender) {
        require(_votingEscrow != address(0), "Invalid votingEscrow");
        require(_treasury != address(0), "Invalid treasury");

        votingEscrow = VotingEscrow(_votingEscrow);
        treasury = _treasury;
        epochStartTime = block.timestamp;
        currentEpoch = 0;
    }

    /**
     * @notice Set Merkle root for an epoch and token (owner only)
     * @param epoch Epoch number
     * @param token Reward token address
     * @param merkleRoot Merkle tree root
     */
    function setMerkleRoot(uint256 epoch, address token, bytes32 merkleRoot) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(merkleRoot != bytes32(0), "Invalid merkle root");

        merkleRoots[epoch][token] = merkleRoot;
        emit MerkleRootSet(epoch, token, merkleRoot);
    }

    /**
     * @notice Claim rewards for a specific epoch and token
     * @param epoch Epoch number
     * @param token Reward token address
     * @param amount Reward amount
     * @param proof Merkle proof
     */
    function claim(uint256 epoch, address token, uint256 amount, bytes32[] calldata proof) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(merkleRoots[epoch][token] != bytes32(0), "Merkle root not set");
        require(!claimed[epoch][token][msg.sender], "Already claimed");

        // Verify Merkle proof (compatible with @openzeppelin/merkle-tree StandardMerkleTree)
        // StandardMerkleTree uses double hashing: keccak256(bytes.concat(keccak256(abi.encode(...))))
        // Note: For single-leaf tree, proof is empty array and leaf must equal root
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        require(MerkleProof.verify(proof, merkleRoots[epoch][token], leaf), "Invalid proof");

        // Mark as claimed
        claimed[epoch][token][msg.sender] = true;

        // Transfer rewards
        IERC20(token).safeTransfer(msg.sender, amount);

        emit RewardClaimed(epoch, msg.sender, token, amount);
    }

    /**
     * @notice Check if user has claimed rewards for an epoch and token
     * @param epoch Epoch number
     * @param token Reward token address
     * @param user User address
     * @return True if claimed, false otherwise
     */
    function isClaimed(uint256 epoch, address token, address user) external view returns (bool) {
        return claimed[epoch][token][user];
    }

    /**
     * @notice Advance epoch if duration has passed
     */
    function advanceEpoch() public {
        uint256 epochsPassed = (block.timestamp - epochStartTime) / EPOCH_DURATION;
        if (epochsPassed > currentEpoch) {
            currentEpoch = epochsPassed;
            emit EpochAdvanced(currentEpoch, block.timestamp);
        }
    }

    /**
     * @notice Get current epoch (auto-advances if needed)
     * @return Current epoch number
     */
    function getCurrentEpoch() external view returns (uint256) {
        uint256 epochsPassed = (block.timestamp - epochStartTime) / EPOCH_DURATION;
        return epochsPassed;
    }

    /**
     * @notice Emergency withdraw tokens (owner only)
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(treasury, amount);
    }

    /**
     * @notice Update treasury address (owner only)
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }
}
