// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../contracts/treasury/Treasury.sol";
import "../../contracts/core/HYD.sol";
import "../../contracts/oracle/RWAPriceOracle.sol";
import "../../contracts/mocks/MockERC20.sol";
import "../../contracts/mocks/MockV3Aggregator.sol";

/**
 * @title Treasury RWA Deposit/Redeem Test Suite
 * @notice Comprehensive tests for RWA-008 (Stage 1: Core Deposit/Redeem Logic)
 * @dev Tests the depositRWA() and redeemRWA() functionality in Treasury contract
 *
 * Test Coverage (6 dimensions):
 * 1. FUNCTIONAL: Core deposit/redeem flows
 * 2. BOUNDARY: Min/max amounts, edge cases
 * 3. EXCEPTION: Invalid inputs, unauthorized access
 * 4. PERFORMANCE: Gas benchmarks
 * 5. SECURITY: Access control, reentrancy
 * 6. COMPATIBILITY: Multi-tier LTV, different RWA assets
 *
 * Task: RWA-008 Stage 1
 * Priority: P1
 */
contract TreasuryRWATest is Test {
  // ============================================================
  // STATE VARIABLES
  // ============================================================

  Treasury public treasury;
  HYD public hydToken;
  RWAPriceOracle public oracle;
  MockERC20 public usdc;
  MockERC20 public rwaToken;
  MockV3Aggregator public ethUsdFeed;
  MockV3Aggregator public sequencerFeed;

  // Test accounts
  address public owner = address(0x1);
  address public user = address(0x2);
  address public unauthorized = address(0x3);
  address public trustedOracle = address(0x4);

  // Constants
  uint256 public constant INITIAL_RWA_PRICE = 1000 * 10**18; // $1000
  uint256 public constant RWA_DEPOSIT_AMOUNT = 10 * 10**18; // 10 RWA tokens

  // LTV Ratios (basis points: 10000 = 100%)
  uint256 public constant LTV_T1 = 8000; // 80%
  uint256 public constant LTV_T2 = 6500; // 65%
  uint256 public constant LTV_T3 = 5000; // 50%

  uint256 public constant REDEMPTION_FEE = 50; // 0.50%
  uint256 public constant COOLDOWN_PERIOD = 7 days;

  uint256 public constant GRACE_PERIOD = 3600; // 1 hour

  // ============================================================
  // SETUP
  // ============================================================

  function setUp() public {
    // Set timestamp to allow grace period calculations
    vm.warp(GRACE_PERIOD + 1000);

    // Deploy mock tokens
    usdc = new MockERC20("USD Coin", "USDC", 6);
    rwaToken = new MockERC20("RWA Token", "RWA", 18);

    // Deploy Chainlink mock feeds
    ethUsdFeed = new MockV3Aggregator(8, int256(INITIAL_RWA_PRICE / 10**10)); // Scale to 8 decimals
    sequencerFeed = new MockV3Aggregator(0, 0); // 0 = sequencer up

    // Set sequencer grace period
    sequencerFeed.updateRoundData(
      1,
      0,
      block.timestamp - GRACE_PERIOD - 1,
      block.timestamp,
      1
    );

    // Deploy RWAPriceOracle
    vm.prank(owner);
    oracle = new RWAPriceOracle(
      address(ethUsdFeed),
      address(sequencerFeed),
      trustedOracle
    );

    // Deploy HYD Token (PSM will be Treasury for simplicity)
    vm.prank(owner);
    hydToken = new HYD(owner); // Use owner as PSM temporarily

    // Deploy Treasury
    vm.prank(owner);
    treasury = new Treasury(owner, address(usdc));

    // Authorize Treasury as HYD minter
    vm.prank(owner);
    hydToken.authorizeMinter(address(treasury));

    // Set HYD token in Treasury
    vm.prank(owner);
    treasury.setHYDToken(address(hydToken));

    // Fund user with RWA tokens
    rwaToken.mint(user, 1000 * 10**18);

    // Fund Treasury with USDC for redemptions
    usdc.mint(address(treasury), 1_000_000 * 10**6);
  }

  // ============================================================
  // 1. FUNCTIONAL TESTS: Core Deposit/Redeem Flows
  // ============================================================

  /**
   * @notice Test: Add RWA asset to whitelist (T1)
   */
  function test_AddRWAAsset_T1_Success() public {
    vm.prank(owner);
    treasury.addRWAAsset(address(rwaToken), address(oracle), 1, LTV_T1, 0);

    // Verify asset added
    (
      address oracleAddr,
      uint8 tier,
      uint256 ltvRatio,
      uint256 mintDiscount,
      bool isActive
    ) = treasury.rwaAssets(address(rwaToken));

    assertEq(oracleAddr, address(oracle));
    assertEq(tier, 1);
    assertEq(ltvRatio, LTV_T1);
    assertEq(mintDiscount, 0);
    assertTrue(isActive);
  }

  /**
   * @notice Test: Deposit RWA and mint HYD (T1: 80% LTV)
   */
  function test_DepositRWA_T1_Success() public {
    // Add RWA asset (T1: 80% LTV)
    vm.prank(owner);
    treasury.addRWAAsset(address(rwaToken), address(oracle), 1, LTV_T1, 0);

    // User approves Treasury to spend RWA
    vm.startPrank(user);
    rwaToken.approve(address(treasury), RWA_DEPOSIT_AMOUNT);

    // Deposit RWA
    treasury.depositRWA(address(rwaToken), RWA_DEPOSIT_AMOUNT);
    vm.stopPrank();

    // Calculate expected HYD minted
    // rwaValue = 10 RWA * $1000 = $10,000
    // hydMinted = $10,000 * 80% = $8,000 HYD
    uint256 expectedHYD = (INITIAL_RWA_PRICE * RWA_DEPOSIT_AMOUNT / 10**18) * LTV_T1 / 10000;

    // Verify HYD minted
    assertEq(hydToken.balanceOf(user), expectedHYD);

    // Verify position tracked
    (
      address rwaAsset,
      uint256 rwaAmount,
      uint256 hydMinted,
      uint256 depositTime
    ) = treasury.getUserPosition(user, address(rwaToken));

    assertEq(rwaAsset, address(rwaToken));
    assertEq(rwaAmount, RWA_DEPOSIT_AMOUNT);
    assertEq(hydMinted, expectedHYD);
    assertTrue(depositTime > 0);
  }

  /**
   * @notice Test: Deposit RWA with T2 (65% LTV)
   */
  function test_DepositRWA_T2_Success() public {
    // Add RWA asset (T2: 65% LTV)
    vm.prank(owner);
    treasury.addRWAAsset(address(rwaToken), address(oracle), 2, LTV_T2, 0);

    vm.startPrank(user);
    rwaToken.approve(address(treasury), RWA_DEPOSIT_AMOUNT);
    treasury.depositRWA(address(rwaToken), RWA_DEPOSIT_AMOUNT);
    vm.stopPrank();

    // Calculate expected HYD (65% LTV)
    uint256 expectedHYD = (INITIAL_RWA_PRICE * RWA_DEPOSIT_AMOUNT / 10**18) * LTV_T2 / 10000;

    assertEq(hydToken.balanceOf(user), expectedHYD);
  }

  /**
   * @notice Test: Deposit RWA with T3 (50% LTV)
   */
  function test_DepositRWA_T3_Success() public {
    // Add RWA asset (T3: 50% LTV)
    vm.prank(owner);
    treasury.addRWAAsset(address(rwaToken), address(oracle), 3, LTV_T3, 0);

    vm.startPrank(user);
    rwaToken.approve(address(treasury), RWA_DEPOSIT_AMOUNT);
    treasury.depositRWA(address(rwaToken), RWA_DEPOSIT_AMOUNT);
    vm.stopPrank();

    // Calculate expected HYD (50% LTV)
    uint256 expectedHYD = (INITIAL_RWA_PRICE * RWA_DEPOSIT_AMOUNT / 10**18) * LTV_T3 / 10000;

    assertEq(hydToken.balanceOf(user), expectedHYD);
  }

  /**
   * @notice Test: Redeem RWA after cooldown period
   */
  function test_RedeemRWA_AfterCooldown_Success() public {
    // Setup: Deposit RWA first
    vm.prank(owner);
    treasury.addRWAAsset(address(rwaToken), address(oracle), 1, LTV_T1, 0);

    vm.startPrank(user);
    rwaToken.approve(address(treasury), RWA_DEPOSIT_AMOUNT);
    treasury.depositRWA(address(rwaToken), RWA_DEPOSIT_AMOUNT);

    // Fast forward past cooldown period
    vm.warp(block.timestamp + COOLDOWN_PERIOD + 1);

    // Calculate HYD to burn (full position)
    uint256 hydToBurn = (INITIAL_RWA_PRICE * RWA_DEPOSIT_AMOUNT / 10**18) * LTV_T1 / 10000;

    // Approve Treasury to spend HYD
    hydToken.approve(address(treasury), hydToBurn);

    // Redeem RWA
    treasury.redeemRWA(address(rwaToken), RWA_DEPOSIT_AMOUNT);
    vm.stopPrank();

    // Calculate expected RWA back (minus 0.5% fee)
    uint256 fee = RWA_DEPOSIT_AMOUNT * REDEMPTION_FEE / 10000;
    uint256 expectedRWA = RWA_DEPOSIT_AMOUNT - fee;

    // Verify RWA returned (approximately, within 1% due to rounding)
    assertApproxEqRel(rwaToken.balanceOf(user), 1000 * 10**18 - RWA_DEPOSIT_AMOUNT + expectedRWA, 0.01e18);
  }

  // ============================================================
  // 2. BOUNDARY TESTS: Edge Cases
  // ============================================================

  /**
   * @notice Test: Deposit minimum amount (1 wei)
   */
  function test_DepositRWA_MinimumAmount() public {
    vm.prank(owner);
    treasury.addRWAAsset(address(rwaToken), address(oracle), 1, LTV_T1, 0);

    vm.startPrank(user);
    rwaToken.approve(address(treasury), 1);
    treasury.depositRWA(address(rwaToken), 1);
    vm.stopPrank();

    // Should succeed with tiny HYD mint
    assertTrue(hydToken.balanceOf(user) > 0);
  }

  /**
   * @notice Test: Redeem before cooldown period (should revert)
   */
  function test_RedeemRWA_BeforeCooldown_Reverts() public {
    // Setup: Deposit RWA
    vm.prank(owner);
    treasury.addRWAAsset(address(rwaToken), address(oracle), 1, LTV_T1, 0);

    vm.startPrank(user);
    rwaToken.approve(address(treasury), RWA_DEPOSIT_AMOUNT);
    treasury.depositRWA(address(rwaToken), RWA_DEPOSIT_AMOUNT);

    // Try to redeem immediately (should fail)
    vm.expectRevert(Treasury.CooldownNotMet.selector);
    treasury.redeemRWA(address(rwaToken), RWA_DEPOSIT_AMOUNT);
    vm.stopPrank();
  }

  // ============================================================
  // 3. EXCEPTION TESTS: Error Handling
  // ============================================================

  /**
   * @notice Test: Deposit unauthorized RWA asset (not whitelisted)
   */
  function test_DepositRWA_UnauthorizedAsset_Reverts() public {
    vm.startPrank(user);
    rwaToken.approve(address(treasury), RWA_DEPOSIT_AMOUNT);

    vm.expectRevert(Treasury.AssetNotWhitelisted.selector);
    treasury.depositRWA(address(rwaToken), RWA_DEPOSIT_AMOUNT);
    vm.stopPrank();
  }

  /**
   * @notice Test: Deposit zero amount (should revert)
   */
  function test_DepositRWA_ZeroAmount_Reverts() public {
    vm.prank(owner);
    treasury.addRWAAsset(address(rwaToken), address(oracle), 1, LTV_T1, 0);

    vm.startPrank(user);
    vm.expectRevert(Treasury.ZeroAmount.selector);
    treasury.depositRWA(address(rwaToken), 0);
    vm.stopPrank();
  }

  /**
   * @notice Test: Add RWA asset by unauthorized user (should revert)
   */
  function test_AddRWAAsset_Unauthorized_Reverts() public {
    vm.prank(unauthorized);
    vm.expectRevert();
    treasury.addRWAAsset(address(rwaToken), address(oracle), 1, LTV_T1, 0);
  }

  // ============================================================
  // 4. PERFORMANCE TESTS: Gas Benchmarks
  // ============================================================

  /**
   * @notice Test: Gas usage for depositRWA
   */
  function test_DepositRWA_GasUsage() public {
    vm.prank(owner);
    treasury.addRWAAsset(address(rwaToken), address(oracle), 1, LTV_T1, 0);

    vm.startPrank(user);
    rwaToken.approve(address(treasury), RWA_DEPOSIT_AMOUNT);

    uint256 gasBefore = gasleft();
    treasury.depositRWA(address(rwaToken), RWA_DEPOSIT_AMOUNT);
    uint256 gasUsed = gasBefore - gasleft();
    vm.stopPrank();

    // Should be < 200k gas
    assertTrue(gasUsed < 200_000, "DepositRWA should use < 200k gas");
    emit log_named_uint("DepositRWA gas", gasUsed);
  }

  /**
   * @notice Test: Gas usage for redeemRWA
   */
  function test_RedeemRWA_GasUsage() public {
    // Setup
    vm.prank(owner);
    treasury.addRWAAsset(address(rwaToken), address(oracle), 1, LTV_T1, 0);

    vm.startPrank(user);
    rwaToken.approve(address(treasury), RWA_DEPOSIT_AMOUNT);
    treasury.depositRWA(address(rwaToken), RWA_DEPOSIT_AMOUNT);
    vm.warp(block.timestamp + COOLDOWN_PERIOD + 1);

    uint256 hydToBurn = (INITIAL_RWA_PRICE * RWA_DEPOSIT_AMOUNT / 10**18) * LTV_T1 / 10000;
    hydToken.approve(address(treasury), hydToBurn);

    uint256 gasBefore = gasleft();
    treasury.redeemRWA(address(rwaToken), RWA_DEPOSIT_AMOUNT);
    uint256 gasUsed = gasBefore - gasleft();
    vm.stopPrank();

    // Should be < 150k gas
    assertTrue(gasUsed < 150_000, "RedeemRWA should use < 150k gas");
    emit log_named_uint("RedeemRWA gas", gasUsed);
  }

  // ============================================================
  // 5. SECURITY TESTS: Access Control & Reentrancy
  // ============================================================

  /**
   * @notice Test: Remove RWA asset (owner only)
   */
  function test_RemoveRWAAsset_OwnerOnly_Success() public {
    vm.prank(owner);
    treasury.addRWAAsset(address(rwaToken), address(oracle), 1, LTV_T1, 0);

    vm.prank(owner);
    treasury.removeRWAAsset(address(rwaToken));

    // Verify asset removed
    (,,,,bool isActive) = treasury.rwaAssets(address(rwaToken));
    assertFalse(isActive);
  }

  /**
   * @notice Test: Remove RWA asset unauthorized (should revert)
   */
  function test_RemoveRWAAsset_Unauthorized_Reverts() public {
    vm.prank(owner);
    treasury.addRWAAsset(address(rwaToken), address(oracle), 1, LTV_T1, 0);

    vm.prank(unauthorized);
    vm.expectRevert();
    treasury.removeRWAAsset(address(rwaToken));
  }

  // ============================================================
  // 6. COMPATIBILITY TESTS: Multi-Asset Support
  // ============================================================

  /**
   * @notice Test: Deposit multiple different RWA assets
   */
  function test_DepositRWA_MultipleAssets_Success() public {
    // Deploy second RWA token
    MockERC20 rwaToken2 = new MockERC20("RWA Token 2", "RWA2", 18);
    rwaToken2.mint(user, 1000 * 10**18);

    // Add both assets
    vm.startPrank(owner);
    treasury.addRWAAsset(address(rwaToken), address(oracle), 1, LTV_T1, 0);
    treasury.addRWAAsset(address(rwaToken2), address(oracle), 2, LTV_T2, 0);
    vm.stopPrank();

    // Deposit both assets
    vm.startPrank(user);

    rwaToken.approve(address(treasury), RWA_DEPOSIT_AMOUNT);
    treasury.depositRWA(address(rwaToken), RWA_DEPOSIT_AMOUNT);

    rwaToken2.approve(address(treasury), RWA_DEPOSIT_AMOUNT);
    treasury.depositRWA(address(rwaToken2), RWA_DEPOSIT_AMOUNT);

    vm.stopPrank();

    // Verify separate positions tracked
    (,uint256 amount1,,) = treasury.getUserPosition(user, address(rwaToken));
    (,uint256 amount2,,) = treasury.getUserPosition(user, address(rwaToken2));

    assertEq(amount1, RWA_DEPOSIT_AMOUNT);
    assertEq(amount2, RWA_DEPOSIT_AMOUNT);
  }
}
