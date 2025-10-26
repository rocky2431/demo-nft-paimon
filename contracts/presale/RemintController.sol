// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./RWABondNFT.sol";

/**
 * @title RemintController
 * @notice Gamified dice rolling system + social task verification + leaderboards
 * @dev Features:
 * - Weekly dice rolling (1 free roll/week + bonus rolls from tasks)
 * - Three dice types: Normal (1-6 → 0-3% APY), Gold (1-12 → 0-6% APY), Diamond (1-20 → 0-10% APY)
 * - Social task verification via off-chain oracle with on-chain signature
 * - Unlock better dice: 5 tasks → Gold, 10 tasks → Diamond
 * - Three leaderboards: Top Earners, Luckiest Rollers, Social Champions
 */
contract RemintController is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ==================== State Variables ====================

    /// @notice Reference to RWABondNFT contract
    RWABondNFT public immutable bondNFT;

    /// @notice Oracle address for social task verification
    address public oracle;

    /// @notice Treasury address for referral rewards
    address public treasury;

    /// @notice Week duration (7 days)
    uint256 public constant WEEK_DURATION = 7 days;

    // Dice types
    uint8 public constant DICE_TYPE_NORMAL = 0;
    uint8 public constant DICE_TYPE_GOLD = 1;
    uint8 public constant DICE_TYPE_DIAMOND = 2;

    // Dice unlock thresholds
    uint256 public constant GOLD_DICE_TASKS = 5;
    uint256 public constant DIAMOND_DICE_TASKS = 10;

    // APY ranges (in basis points, 10000 = 100%)
    uint256 public constant NORMAL_DICE_MAX_APY = 300; // 3%
    uint256 public constant GOLD_DICE_MAX_APY = 600; // 6%
    uint256 public constant DIAMOND_DICE_MAX_APY = 1000; // 10%

    // Dice value ranges
    uint8 public constant NORMAL_DICE_MIN = 1;
    uint8 public constant NORMAL_DICE_MAX = 6;
    uint8 public constant GOLD_DICE_MIN = 1;
    uint8 public constant GOLD_DICE_MAX = 12;
    uint8 public constant DIAMOND_DICE_MIN = 1;
    uint8 public constant DIAMOND_DICE_MAX = 20;

    // Leaderboard types
    uint8 public constant LEADERBOARD_TOP_EARNERS = 0;
    uint8 public constant LEADERBOARD_LUCKIEST_ROLLERS = 1;
    uint8 public constant LEADERBOARD_SOCIAL_CHAMPIONS = 2;

    // Referral reward (5 USDC with 6 decimals)
    uint256 public constant REFERRAL_REWARD = 5 * 1e6;

    /// @notice Dice data for each NFT token
    struct DiceData {
        uint8 diceType; // 0 = Normal, 1 = Gold, 2 = Diamond
        uint8 rollsThisWeek; // Remaining rolls this week
        uint256 lastRollTimestamp; // Last roll timestamp
        uint256 totalRemintEarned; // Cumulative Remint earned (in USDC)
        uint256 lastWeekNumber; // Last week number when rolled
        uint8 highestDiceRoll; // Highest single dice roll (for leaderboard)
    }

    /// @notice Mapping of tokenId to DiceData
    mapping(uint256 => DiceData) private _diceData;

    /// @notice Mapping of tokenId to completed social tasks
    mapping(uint256 => mapping(bytes32 => bool)) private _completedTasks;

    /// @notice Mapping of tokenId to total tasks completed count
    mapping(uint256 => uint256) private _tasksCompleted;

    /// @notice Mapping of VRF requestId to tokenId
    mapping(uint256 => uint256) private _requestToTokenId;

    /// @notice Leaderboards (top 10 for each category)
    mapping(uint8 => address[]) private _leaderboards;

    // ==================== Events ====================

    event DiceRollRequested(uint256 indexed tokenId, address indexed roller, uint8 diceType, uint256 requestId);
    event DiceRollCompleted(
        uint256 indexed tokenId,
        uint8 diceType,
        uint8 result,
        uint256 apyBasisPoints,
        uint256 remintEarned
    );
    event SocialTaskCompleted(uint256 indexed tokenId, bytes32 indexed taskId, uint256 timestamp);
    event DiceTypeUpgraded(uint256 indexed tokenId, uint8 oldDiceType, uint8 newDiceType, uint256 tasksCompleted);
    event LeaderboardUpdated(uint8 indexed leaderboardType, uint256 indexed tokenId, address indexed holder);
    event WeeklyRollsReset(uint256 indexed tokenId, uint256 weekNumber);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // ==================== Constructor ====================

    constructor(address _bondNFT, address _oracle, address _treasury) Ownable(msg.sender) {
        require(_bondNFT != address(0), "RemintController: zero address bondNFT");
        require(_oracle != address(0), "RemintController: zero address oracle");
        require(_treasury != address(0), "RemintController: zero address treasury");

        bondNFT = RWABondNFT(_bondNFT);
        oracle = _oracle;
        treasury = _treasury;
    }

    // ==================== Dice Rolling Functions ====================

    /**
     * @notice Roll the dice for an NFT token
     * @param tokenId NFT token ID
     * @return requestId Chainlink VRF request ID
     */
    function rollDice(uint256 tokenId) external nonReentrant returns (uint256 requestId) {
        require(bondNFT.ownerOf(tokenId) == msg.sender, "RemintController: caller is not NFT owner");

        DiceData storage dice = _diceData[tokenId];

        // Initialize dice data if first time
        if (dice.lastRollTimestamp == 0) {
            dice.diceType = DICE_TYPE_NORMAL;
            dice.rollsThisWeek = 1; // 1 free roll per week
            dice.lastWeekNumber = _getCurrentWeekNumber();
        } else {
            // Check if new week, reset rolls
            uint256 currentWeek = _getCurrentWeekNumber();
            if (currentWeek > dice.lastWeekNumber) {
                dice.rollsThisWeek = 1;
                dice.lastWeekNumber = currentWeek;
                emit WeeklyRollsReset(tokenId, currentWeek);
            }
        }

        require(dice.rollsThisWeek > 0, "RemintController: no rolls left this week");

        // Consume one roll (will be decremented after VRF fulfillment)
        dice.lastRollTimestamp = block.timestamp;

        // Request VRF random number through BondNFT
        requestId = bondNFT.requestDiceRoll(tokenId);

        _requestToTokenId[requestId] = tokenId;

        emit DiceRollRequested(tokenId, msg.sender, dice.diceType, requestId);
    }

    /**
     * @notice Process dice roll result (called by VRF Coordinator via BondNFT)
     * @param requestId VRF request ID
     * @param randomWords Random numbers from VRF
     */
    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        require(msg.sender == address(bondNFT.vrfCoordinator()), "RemintController: caller is not VRF coordinator");

        uint256 tokenId = _requestToTokenId[requestId];
        require(tokenId != 0, "RemintController: invalid request ID");

        DiceData storage dice = _diceData[tokenId];

        // Consume the roll
        if (dice.rollsThisWeek > 0) {
            dice.rollsThisWeek--;
        }

        // Determine dice result based on dice type
        uint8 result = _calculateDiceResult(dice.diceType, randomWords[0]);

        // Calculate APY based on result
        uint256 apyBasisPoints = _calculateAPY(dice.diceType, result);

        // Calculate Remint earned (for now, simplified - actual calculation would use time held)
        // Remint = Principal × APY × (time held / 365 days)
        // Simplified: We'll calculate based on 90-day period
        uint256 principal = 100 * 1e6; // 100 USDC
        uint256 remintEarned = (principal * apyBasisPoints * 90) / (10000 * 365);

        dice.totalRemintEarned += remintEarned;

        // Update highest dice roll for leaderboard
        if (result > dice.highestDiceRoll) {
            dice.highestDiceRoll = result;
            _updateLeaderboard(LEADERBOARD_LUCKIEST_ROLLERS, tokenId);
        }

        // Update Top Earners leaderboard
        _updateLeaderboard(LEADERBOARD_TOP_EARNERS, tokenId);

        emit DiceRollCompleted(tokenId, dice.diceType, result, apyBasisPoints, remintEarned);

        delete _requestToTokenId[requestId];
    }

    /**
     * @notice Calculate dice result based on dice type and random word
     */
    function _calculateDiceResult(uint8 diceType, uint256 randomWord) private pure returns (uint8) {
        if (diceType == DICE_TYPE_NORMAL) {
            return uint8((randomWord % NORMAL_DICE_MAX) + NORMAL_DICE_MIN);
        } else if (diceType == DICE_TYPE_GOLD) {
            return uint8((randomWord % GOLD_DICE_MAX) + GOLD_DICE_MIN);
        } else if (diceType == DICE_TYPE_DIAMOND) {
            return uint8((randomWord % DIAMOND_DICE_MAX) + DIAMOND_DICE_MIN);
        }
        revert("RemintController: invalid dice type");
    }

    /**
     * @notice Calculate APY in basis points based on dice type and result
     */
    function _calculateAPY(uint8 diceType, uint8 result) private pure returns (uint256) {
        uint256 maxAPY;
        uint8 maxDiceValue;

        if (diceType == DICE_TYPE_NORMAL) {
            maxAPY = NORMAL_DICE_MAX_APY;
            maxDiceValue = NORMAL_DICE_MAX;
        } else if (diceType == DICE_TYPE_GOLD) {
            maxAPY = GOLD_DICE_MAX_APY;
            maxDiceValue = GOLD_DICE_MAX;
        } else if (diceType == DICE_TYPE_DIAMOND) {
            maxAPY = DIAMOND_DICE_MAX_APY;
            maxDiceValue = DIAMOND_DICE_MAX;
        } else {
            revert("RemintController: invalid dice type");
        }

        // Linear mapping: result / maxDiceValue × maxAPY
        return (uint256(result) * maxAPY) / uint256(maxDiceValue);
    }

    // ==================== Social Task Functions ====================

    /**
     * @notice Complete a social task with oracle signature verification
     * @param tokenId NFT token ID
     * @param taskId Task identifier (hash)
     * @param signature Oracle signature
     */
    function completeSocialTask(uint256 tokenId, bytes32 taskId, bytes memory signature) external nonReentrant {
        require(bondNFT.ownerOf(tokenId) == msg.sender, "RemintController: caller is not NFT owner");
        require(taskId != bytes32(0), "RemintController: invalid task ID");
        require(signature.length > 0, "RemintController: invalid signature");
        require(!_completedTasks[tokenId][taskId], "RemintController: task already completed");

        // Verify oracle signature
        bytes32 messageHash = keccak256(abi.encodePacked(tokenId, taskId));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();

        address signer = ethSignedHash.recover(signature);
        require(signer == oracle, "RemintController: invalid oracle signature");

        // Mark task as completed
        _completedTasks[tokenId][taskId] = true;
        _tasksCompleted[tokenId]++;

        emit SocialTaskCompleted(tokenId, taskId, block.timestamp);

        // Check if should upgrade dice type
        uint256 tasksCompleted = _tasksCompleted[tokenId];
        DiceData storage dice = _diceData[tokenId];

        if (tasksCompleted >= DIAMOND_DICE_TASKS && dice.diceType < DICE_TYPE_DIAMOND) {
            uint8 oldDiceType = dice.diceType;
            dice.diceType = DICE_TYPE_DIAMOND;
            emit DiceTypeUpgraded(tokenId, oldDiceType, DICE_TYPE_DIAMOND, tasksCompleted);
        } else if (tasksCompleted >= GOLD_DICE_TASKS && dice.diceType < DICE_TYPE_GOLD) {
            uint8 oldDiceType = dice.diceType;
            dice.diceType = DICE_TYPE_GOLD;
            emit DiceTypeUpgraded(tokenId, oldDiceType, DICE_TYPE_GOLD, tasksCompleted);
        }

        // Update Social Champions leaderboard
        _updateLeaderboard(LEADERBOARD_SOCIAL_CHAMPIONS, tokenId);

        // Handle referral rewards (if applicable)
        _processReferralReward(taskId);
    }

    /**
     * @notice Process referral reward if task is a referral task
     */
    function _processReferralReward(bytes32 taskId) private {
        bytes32 referral1 = keccak256("REFERRAL_1");
        bytes32 referral5 = keccak256("REFERRAL_5");
        bytes32 referral10 = keccak256("REFERRAL_10");

        if (taskId == referral1 || taskId == referral5 || taskId == referral10) {
            // Transfer 5 USDC from this contract to treasury
            // NOTE: This contract needs to be funded with USDC for referral rewards
            IERC20 usdc = bondNFT.USDC();
            usdc.safeTransfer(treasury, REFERRAL_REWARD);
        }
    }

    // ==================== Leaderboard Functions ====================

    /**
     * @notice Update leaderboard for a token
     * @param leaderboardType Type of leaderboard to update
     * @param tokenId Token ID to potentially add to leaderboard
     */
    function _updateLeaderboard(uint8 leaderboardType, uint256 tokenId) private {
        address holder = bondNFT.ownerOf(tokenId);
        address[] storage leaderboard = _leaderboards[leaderboardType];

        // Remove holder if already in leaderboard
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i] == holder) {
                // Remove by swapping with last element
                leaderboard[i] = leaderboard[leaderboard.length - 1];
                leaderboard.pop();
                break;
            }
        }

        // Add holder to leaderboard
        leaderboard.push(holder);

        // Sort leaderboard (descending order) - simplified bubble sort for top 10
        _sortLeaderboard(leaderboardType);

        // Keep only top 10
        if (leaderboard.length > 10) {
            leaderboard.pop();
        }

        emit LeaderboardUpdated(leaderboardType, tokenId, holder);
    }

    /**
     * @notice Sort leaderboard in descending order (bubble sort)
     */
    function _sortLeaderboard(uint8 leaderboardType) private {
        address[] storage leaderboard = _leaderboards[leaderboardType];
        uint256 length = leaderboard.length;

        for (uint256 i = 0; i < length; i++) {
            for (uint256 j = i + 1; j < length; j++) {
                if (_compareLeaderboardEntries(leaderboardType, leaderboard[j], leaderboard[i])) {
                    // Swap
                    address temp = leaderboard[i];
                    leaderboard[i] = leaderboard[j];
                    leaderboard[j] = temp;
                }
            }
        }
    }

    /**
     * @notice Compare two leaderboard entries
     * @return true if address1 should rank higher than address2
     */
    function _compareLeaderboardEntries(
        uint8 leaderboardType,
        address addr1,
        address addr2
    ) private view returns (bool) {
        if (leaderboardType == LEADERBOARD_TOP_EARNERS) {
            return _getTotalRemintByAddress(addr1) > _getTotalRemintByAddress(addr2);
        } else if (leaderboardType == LEADERBOARD_LUCKIEST_ROLLERS) {
            return _getHighestDiceRollByAddress(addr1) > _getHighestDiceRollByAddress(addr2);
        } else if (leaderboardType == LEADERBOARD_SOCIAL_CHAMPIONS) {
            return _getTotalTasksByAddress(addr1) > _getTotalTasksByAddress(addr2);
        }
        return false;
    }

    /**
     * @notice Get total Remint earned by address (sum across all tokens)
     */
    function _getTotalRemintByAddress(address holder) private view returns (uint256 total) {
        uint256 balance = bondNFT.balanceOf(holder);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = bondNFT.tokenOfOwnerByIndex(holder, i);
            total += _diceData[tokenId].totalRemintEarned;
        }
    }

    /**
     * @notice Get highest dice roll by address (max across all tokens)
     */
    function _getHighestDiceRollByAddress(address holder) private view returns (uint8 highest) {
        uint256 balance = bondNFT.balanceOf(holder);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = bondNFT.tokenOfOwnerByIndex(holder, i);
            if (_diceData[tokenId].highestDiceRoll > highest) {
                highest = _diceData[tokenId].highestDiceRoll;
            }
        }
    }

    /**
     * @notice Get total tasks completed by address (sum across all tokens)
     */
    function _getTotalTasksByAddress(address holder) private view returns (uint256 total) {
        uint256 balance = bondNFT.balanceOf(holder);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = bondNFT.tokenOfOwnerByIndex(holder, i);
            total += _tasksCompleted[tokenId];
        }
    }

    // ==================== View Functions ====================

    /**
     * @notice Get dice data for a token
     */
    function getDiceData(
        uint256 tokenId
    )
        external
        view
        returns (uint8 diceType, uint8 rollsThisWeek, uint256 lastRollTimestamp, uint256 totalRemintEarned, uint256 lastWeekNumber)
    {
        DiceData storage dice = _diceData[tokenId];
        return (dice.diceType, dice.rollsThisWeek, dice.lastRollTimestamp, dice.totalRemintEarned, dice.lastWeekNumber);
    }

    /**
     * @notice Check if a task is completed for a token
     */
    function isTaskCompleted(uint256 tokenId, bytes32 taskId) external view returns (bool) {
        return _completedTasks[tokenId][taskId];
    }

    /**
     * @notice Get total tasks completed for a token
     */
    function getTasksCompleted(uint256 tokenId) external view returns (uint256) {
        return _tasksCompleted[tokenId];
    }

    /**
     * @notice Get leaderboard for a specific type
     * @param leaderboardType Type of leaderboard (0 = Top Earners, 1 = Luckiest Rollers, 2 = Social Champions)
     * @param limit Maximum number of entries to return
     */
    function getLeaderboard(uint8 leaderboardType, uint256 limit) external view returns (address[] memory) {
        require(leaderboardType <= LEADERBOARD_SOCIAL_CHAMPIONS, "RemintController: invalid leaderboard type");
        require(limit > 0, "RemintController: limit must be > 0");

        address[] storage leaderboard = _leaderboards[leaderboardType];
        uint256 length = leaderboard.length < limit ? leaderboard.length : limit;

        address[] memory result = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = leaderboard[i];
        }

        return result;
    }

    /**
     * @notice Get current week number
     */
    function _getCurrentWeekNumber() private view returns (uint256) {
        return block.timestamp / WEEK_DURATION;
    }

    // ==================== Admin Functions ====================

    /**
     * @notice Update oracle address
     */
    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "RemintController: zero address oracle");
        address oldOracle = oracle;
        oracle = newOracle;
        emit OracleUpdated(oldOracle, newOracle);
    }

    /**
     * @notice Update treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "RemintController: zero address treasury");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Withdraw stuck USDC (emergency function)
     */
    function withdrawUSDC(uint256 amount) external onlyOwner {
        IERC20 usdc = bondNFT.USDC();
        usdc.safeTransfer(owner(), amount);
    }
}
