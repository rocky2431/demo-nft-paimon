/**
 * Liquidity Component Type Definitions
 * Inspired by Velodrome Finance + Uniswap V2
 */

// ==================== Enums ====================

/**
 * State machine for add liquidity flow
 */
export enum AddLiquidityState {
  /** Initial state - waiting for user input */
  IDLE = 'IDLE',
  /** Token A needs approval */
  NEEDS_APPROVAL_A = 'NEEDS_APPROVAL_A',
  /** Token B needs approval */
  NEEDS_APPROVAL_B = 'NEEDS_APPROVAL_B',
  /** Approving Token A */
  APPROVING_A = 'APPROVING_A',
  /** Approving Token B */
  APPROVING_B = 'APPROVING_B',
  /** Ready to add liquidity */
  READY = 'READY',
  /** Adding liquidity transaction in progress */
  ADDING = 'ADDING',
  /** Successfully added liquidity */
  SUCCESS = 'SUCCESS',
  /** Error occurred */
  ERROR = 'ERROR',
}

/**
 * Pool types (Velodrome-style)
 */
export enum PoolType {
  /** Volatile pool (xy=k) for uncorrelated assets */
  VOLATILE = 'volatile',
  /** Stable pool (x³y+y³x=k) for correlated assets */
  STABLE = 'stable',
}

// ==================== Interfaces ====================

/**
 * Token information
 */
export interface Token {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

/**
 * Liquidity pool information
 */
export interface LiquidityPool {
  /** Pool pair address */
  address: `0x${string}`;
  /** Token A */
  token0: Token;
  /** Token B */
  token1: Token;
  /** Pool type (volatile or stable) */
  type: PoolType;
  /** Reserve of token0 */
  reserve0: bigint;
  /** Reserve of token1 */
  reserve1: bigint;
  /** Total LP token supply */
  totalSupply: bigint;
  /** Pool name (e.g., "HYD/USDC") */
  name: string;
  /** Annual Percentage Rate (for display) */
  apr?: string;
  /** Total Value Locked (for display) */
  tvl?: string;
}

/**
 * Token amount with balance
 */
export interface TokenAmount {
  /** Token information */
  token: Token;
  /** Amount to deposit (in wei) */
  amount: bigint;
  /** Amount in human-readable format */
  amountFormatted: string;
  /** User's wallet balance (in wei) */
  balance: bigint;
  /** Balance in human-readable format */
  balanceFormatted: string;
}

/**
 * Add liquidity form data
 */
export interface AddLiquidityFormData {
  /** Selected pool */
  pool: LiquidityPool | null;
  /** Token A amount */
  tokenA: TokenAmount | null;
  /** Token B amount (auto-calculated) */
  tokenB: TokenAmount | null;
  /** Slippage tolerance (in basis points, e.g., 50 = 0.5%) */
  slippageBps: number;
  /** Transaction deadline (in minutes) */
  deadlineMinutes: number;
}

/**
 * Liquidity preview data
 */
export interface LiquidityPreview {
  /** Expected LP tokens to receive */
  lpTokens: bigint;
  /** LP tokens in human-readable format */
  lpTokensFormatted: string;
  /** Pool share percentage (0-100) */
  shareOfPool: number;
  /** Price of token0 in terms of token1 */
  priceToken0: string;
  /** Price of token1 in terms of token0 */
  priceToken1: string;
  /** Minimum amount of tokenA (with slippage) */
  amountAMin: bigint;
  /** Minimum amount of tokenB (with slippage) */
  amountBMin: bigint;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the input is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
}

/**
 * Add liquidity result
 */
export interface AddLiquidityResult {
  /** Transaction hash */
  hash: `0x${string}`;
  /** Actual amount of tokenA added */
  amountA: bigint;
  /** Actual amount of tokenB added */
  amountB: bigint;
  /** Actual LP tokens received */
  liquidity: bigint;
}

// ==================== Helper Types ====================

/**
 * Slippage preset options
 */
export type SlippagePreset = 0.1 | 0.5 | 1.0 | 5.0; // in percentage

/**
 * Router function parameters
 */
export interface AddLiquidityParams {
  tokenA: `0x${string}`;
  tokenB: `0x${string}`;
  stable: boolean;
  amountADesired: bigint;
  amountBDesired: bigint;
  amountAMin: bigint;
  amountBMin: bigint;
  to: `0x${string}`;
  deadline: bigint;
}
