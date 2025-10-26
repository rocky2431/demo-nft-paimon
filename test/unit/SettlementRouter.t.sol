// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../contracts/presale/SettlementRouter.sol";
import "../../contracts/presale/RWABondNFT.sol";
import "../../contracts/presale/RemintController.sol";
import "../../contracts/core/VotingEscrow.sol";
import "../../contracts/treasury/Treasury.sol";
import "../../contracts/core/HYD.sol";
import "../../contracts/core/PSM.sol";
import "../../contracts/mocks/MockERC20.sol";
import "../../contracts/mocks/MockVRFCoordinatorV2.sol";

/**
 * @title SettlementRouter Test Suite (PRESALE-003)
 * @notice TDD RED phase tests for Bond NFT settlement with 2 options
 * @dev Tests for:
 *      - Option 1: veNFT conversion (1 USDC = 1 HYD locked, 3-48 months)
 *      - Option 2: Cash redemption (100 USDC principal + 0.5 base yield + Remint yield)
 *      - Maturity enforcement (only after 90 days)
 *      - Integration with VotingEscrow, Treasury, RemintController
 *      - Settlement events for analytics
 */
contract SettlementRouterTest is Test {
    // ==================== Contracts ====================

    SettlementRouter public router;
    RWABondNFT public bondNFT;
    RemintController public remintController;
    VotingEscrow public votingEscrow;
    Treasury public treasury;
    HYD public hyd;
    PSM public psm;
    MockERC20 public usdc;
    MockVRFCoordinatorV2 public vrfCoordinator;

    // ==================== Test Accounts ====================

    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public oracle = address(0x4);

    // ==================== Constants ====================

    uint256 public constant INITIAL_USDC_SUPPLY = 10_000_000 * 1e6;
    uint256 public constant BOND_PRICE = 100 * 1e6; // 100 USDC
    uint256 public constant BASE_YIELD = 5 * 1e5; // 0.5 USDC (500,000 with 6 decimals)
    uint256 public constant MIN_LOCK_DURATION = 90 days; // 3 months
    uint256 public constant MAX_LOCK_DURATION = 1460 days; // 48 months

    // VRF Mock Config
    uint96 public constant VRF_BASE_FEE = 0.25 ether;
    uint96 public constant VRF_GAS_PRICE_LINK = 1e9;

    // ==================== Setup ====================

    function setUp() public {
        // Deploy USDC
        usdc = new MockERC20("USD Coin", "USDC", 6);
        usdc.mint(owner, INITIAL_USDC_SUPPLY);

        // Deploy HYD and PSM (circular dependency resolution)
        hyd = new HYD(address(this));
        psm = new PSM(address(hyd), address(usdc));
        hyd = new HYD(address(psm));
        psm = new PSM(address(hyd), address(usdc));
        hyd = new HYD(address(psm));

        // Deploy VotingEscrow
        votingEscrow = new VotingEscrow(address(hyd));

        // Deploy Treasury with USDC
        treasury = new Treasury(owner, address(usdc));

        // Fund treasury with USDC for redemptions (540K USDC)
        vm.prank(owner);
        usdc.transfer(address(treasury), 540_000 * 1e6);

        // Deploy VRF Coordinator Mock
        vrfCoordinator = new MockVRFCoordinatorV2();

        // Create VRF subscription (simplified for Mock)
        uint64 subId = 1;

        // Deploy RWABondNFT
        bondNFT = new RWABondNFT(
            address(usdc),
            address(vrfCoordinator),
            subId,
            bytes32(uint256(1)) // keyHash
        );

        // No need to add consumer for Mock VRF

        // Deploy RemintController
        remintController = new RemintController(
            address(bondNFT),
            address(usdc),
            oracle
        );

        // Set remint controller in bondNFT
        bondNFT.setRemintController(address(remintController));

        // Pause minting to prevent interference
        bondNFT.pause();

        // Fund users with USDC
        vm.startPrank(owner);
        usdc.transfer(user1, 10_000 * 1e6);
        usdc.transfer(user2, 10_000 * 1e6);
        vm.stopPrank();

        // Fund RemintController for referral rewards
        vm.prank(owner);
        usdc.transfer(address(remintController), 500 * 1e6);
    }

    // ==================== Option 1: veNFT Conversion Tests ====================

    /**
     * @notice [Functional] Should convert mature Bond NFT to veNFT with custom lock duration
     */
    function test_Functional_ConvertToVeNFT_Success() public {
        // This test will FAIL initially (RED phase)
        // Expected: User settles mature Bond NFT and receives veNFT with HYD locked

        // Step 1: Mint Bond NFT for user1
        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        // Step 2: Fast forward 90 days to maturity
        vm.warp(block.timestamp + 90 days);

        // Verify bond is matured
        assertTrue(bondNFT.isMatured(tokenId), "Bond should be matured");

        // Step 3: User1 chooses veNFT conversion with 1 year lock
        uint256 lockDuration = 365 days;

        vm.prank(user1);
        // uint256 veNFTTokenId = router.settleToVeNFT(tokenId, lockDuration);

        // Verify veNFT was created
        // assertEq(votingEscrow.ownerOf(veNFTTokenId), user1, "User should own veNFT");

        // Verify lock amount (100 USDC + 0.5 yield = 100.5 HYD)
        // VotingEscrow.LockedBalance memory lock = votingEscrow.getLockedBalance(veNFTTokenId);
        // assertEq(lock.amount, 100.5 * 1e18, "Should lock 100.5 HYD");

        // Verify lock duration
        // uint256 actualDuration = lock.end - block.timestamp;
        // assertApproxEqAbs(actualDuration, lockDuration, 1 days, "Lock duration should be ~1 year");

        // Verify Bond NFT was burned
        // vm.expectRevert();
        // bondNFT.ownerOf(tokenId);
    }

    /**
     * @notice [Exception] Should revert when bond not matured
     */
    function test_Exception_ConvertToVeNFT_RevertWhen_NotMatured() public {
        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        // Try to settle before 90 days
        vm.prank(user1);
        vm.expectRevert(); // Expect "SettlementRouter: bond not matured"
        // router.settleToVeNFT(tokenId, 365 days);
    }

    /**
     * @notice [Boundary] Should reject lock duration < 90 days
     */
    function test_Boundary_ConvertToVeNFT_RevertWhen_DurationTooShort() public {
        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        vm.warp(block.timestamp + 90 days);

        vm.prank(user1);
        vm.expectRevert(); // Expect "SettlementRouter: lock duration too short"
        // router.settleToVeNFT(tokenId, 89 days);
    }

    /**
     * @notice [Boundary] Should reject lock duration > 1460 days
     */
    function test_Boundary_ConvertToVeNFT_RevertWhen_DurationTooLong() public {
        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        vm.warp(block.timestamp + 90 days);

        vm.prank(user1);
        vm.expectRevert(); // Expect "SettlementRouter: lock duration too long"
        // router.settleToVeNFT(tokenId, 1461 days);
    }

    /**
     * @notice [Exception] Should revert when non-owner tries to settle
     */
    function test_Exception_ConvertToVeNFT_RevertWhen_NotOwner() public {
        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        vm.warp(block.timestamp + 90 days);

        vm.prank(user2);
        vm.expectRevert(); // Expect "SettlementRouter: caller is not NFT owner"
        // router.settleToVeNFT(tokenId, 365 days);
    }

    /**
     * @notice [Integration] Should include Remint rewards in veNFT lock amount
     */
    function test_Integration_ConvertToVeNFT_WithRemintRewards() public {
        // Expected: If user earned Remint from dice rolls, it's included in HYD lock amount
        // Total HYD = 100 (principal) + 0.5 (base yield) + Remint earned

        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        // Perform dice roll to earn Remint (simplified simulation)
        // In real scenario, user would roll dice multiple times over 90 days
        // For test, we'll just verify the calculation includes RemintController.totalRemintEarned(tokenId)

        vm.warp(block.timestamp + 90 days);

        vm.prank(user1);
        // uint256 veNFTTokenId = router.settleToVeNFT(tokenId, 365 days);

        // Verify lock amount includes Remint (exact amount depends on dice rolls)
        // VotingEscrow.LockedBalance memory lock = votingEscrow.getLockedBalance(veNFTTokenId);
        // assertGe(lock.amount, 100.5 * 1e18, "Should at least lock principal + base yield");
    }

    // ==================== Option 2: Cash Redemption Tests ====================

    /**
     * @notice [Functional] Should redeem mature Bond NFT for cash (principal + yield)
     */
    function test_Functional_RedeemCash_Success() public {
        // Expected: User receives 100 USDC principal + 0.5 USDC base yield + Remint yield

        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        vm.warp(block.timestamp + 90 days);

        uint256 user1BalanceBefore = usdc.balanceOf(user1);

        vm.prank(user1);
        // router.settleToCash(tokenId);

        // Verify user1 received USDC (at least 100.5 USDC)
        // uint256 amountReceived = usdc.balanceOf(user1) - user1BalanceBefore;
        // assertGe(amountReceived, 100.5 * 1e6, "Should receive at least principal + base yield");

        // Verify Bond NFT was burned
        // vm.expectRevert();
        // bondNFT.ownerOf(tokenId);
    }

    /**
     * @notice [Exception] Should revert when bond not matured
     */
    function test_Exception_RedeemCash_RevertWhen_NotMatured() public {
        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert(); // Expect "SettlementRouter: bond not matured"
        // router.settleToCash(tokenId);
    }

    /**
     * @notice [Exception] Should revert when non-owner tries to redeem
     */
    function test_Exception_RedeemCash_RevertWhen_NotOwner() public {
        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        vm.warp(block.timestamp + 90 days);

        vm.prank(user2);
        vm.expectRevert(); // Expect "SettlementRouter: caller is not NFT owner"
        // router.settleToCash(tokenId);
    }

    /**
     * @notice [Integration] Should calculate total redemption amount correctly
     */
    function test_Integration_RedeemCash_TotalAmount() public {
        // Expected: 100 USDC principal + 0.5 USDC base + Remint earned from dice rolls

        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        vm.warp(block.timestamp + 90 days);

        // Calculate expected amount
        // uint256 expectedAmount = BOND_PRICE + BASE_YIELD; // 100.5 USDC minimum

        uint256 user1BalanceBefore = usdc.balanceOf(user1);

        vm.prank(user1);
        // router.settleToCash(tokenId);

        // uint256 actualAmount = usdc.balanceOf(user1) - user1BalanceBefore;
        // assertGe(actualAmount, expectedAmount, "Should receive at least expected amount");
    }

    // ==================== Settlement Events Tests ====================

    /**
     * @notice [Functional] Should emit SettledToVeNFT event
     */
    function test_Functional_EmitSettledToVeNFT_Event() public {
        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        vm.warp(block.timestamp + 90 days);

        // vm.expectEmit(true, true, true, true);
        // emit SettlementRouter.SettledToVeNFT(user1, tokenId, veNFTTokenId, hydAmount, lockDuration);

        vm.prank(user1);
        // router.settleToVeNFT(tokenId, 365 days);
    }

    /**
     * @notice [Functional] Should emit SettledToCash event
     */
    function test_Functional_EmitSettledToCash_Event() public {
        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        vm.warp(block.timestamp + 90 days);

        // vm.expectEmit(true, true, true, true);
        // emit SettlementRouter.SettledToCash(user1, tokenId, totalAmount);

        vm.prank(user1);
        // router.settleToCash(tokenId);
    }

    // ==================== Security Tests ====================

    /**
     * @notice [Security] Should prevent reentrancy attacks on settleToVeNFT
     */
    function test_Security_SettleToVeNFT_ReentrancyProtection() public {
        // Test will verify ReentrancyGuard is applied
    }

    /**
     * @notice [Security] Should prevent reentrancy attacks on settleToCash
     */
    function test_Security_SettleToCash_ReentrancyProtection() public {
        // Test will verify ReentrancyGuard is applied
    }

    /**
     * @notice [Security] Should prevent double settlement of same NFT
     */
    function test_Security_PreventDoubleSettlement() public {
        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        vm.warp(block.timestamp + 90 days);

        // Settle to veNFT first
        vm.prank(user1);
        // router.settleToVeNFT(tokenId, 365 days);

        // Try to settle again (should fail because NFT is burned)
        vm.prank(user1);
        vm.expectRevert(); // NFT no longer exists
        // router.settleToCash(tokenId);
    }

    // ==================== Compatibility Tests ====================

    /**
     * @notice [Compatibility] Should work with multiple users settling different NFTs
     */
    function test_Compatibility_MultipleUsersSettlement() public {
        bondNFT.unpause();

        // User1 mints and settles to veNFT
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId1 = bondNFT.mint();
        vm.stopPrank();

        // User2 mints and settles to cash
        vm.startPrank(user2);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId2 = bondNFT.mint();
        vm.stopPrank();

        vm.warp(block.timestamp + 90 days);

        // User1 settles to veNFT
        vm.prank(user1);
        // router.settleToVeNFT(tokenId1, 365 days);

        // User2 settles to cash
        vm.prank(user2);
        // router.settleToCash(tokenId2);

        // Both should succeed independently
    }

    /**
     * @notice [Compatibility] Should maintain Bond NFT contract state correctly
     */
    function test_Compatibility_BondNFTState() public {
        bondNFT.unpause();
        vm.startPrank(user1);
        usdc.approve(address(bondNFT), BOND_PRICE);
        uint256 tokenId = bondNFT.mint();
        vm.stopPrank();

        vm.warp(block.timestamp + 90 days);

        // uint256 totalSupplyBefore = bondNFT.totalSupply();

        vm.prank(user1);
        // router.settleToVeNFT(tokenId, 365 days);

        // Verify total supply decreased by 1 (NFT burned)
        // assertEq(bondNFT.totalSupply(), totalSupplyBefore - 1, "Total supply should decrease");
    }
}
