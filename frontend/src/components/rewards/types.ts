/**
 * Rewards Dashboard Type Definitions
 */

import { LiquidityPool } from '../liquidity/types';

// ==================== Interfaces ====================

/**
 * Pool reward information
 */
export interface PoolReward {
  /** Pool information */
  pool: LiquidityPool;
  /** Gauge contract address */
  gauge: `0x${string}`;
  /** Earned rewards (PAIMON) */
  earnedRewards: bigint;
  /** Earned rewards (formatted) */
  earnedRewardsFormatted: string;
  /** Staked LP token balance */
  stakedBalance: bigint;
  /** Staked balance (formatted) */
  stakedBalanceFormatted: string;
  /** Annual Percentage Rate */
  apr: string;
}

/**
 * Rewards summary data
 */
export interface RewardsSummary {
  /** Total earned PAIMON across all pools */
  totalEarnedPAIMON: bigint;
  /** Total earned PAIMON (formatted) */
  totalEarnedPAIMONFormatted: string;
  /** Total staked value (USD estimate) */
  totalStakedValueUSD: string;
  /** Average APR across all pools */
  averageAPR: string;
  /** Number of active positions */
  activePositions: number;
}

/**
 * Claim history entry
 */
export interface ClaimHistoryEntry {
  /** Transaction hash */
  txHash: `0x${string}`;
  /** Pool name */
  poolName: string;
  /** Amount claimed (PAIMON) */
  amount: bigint;
  /** Amount claimed (formatted) */
  amountFormatted: string;
  /** Claim timestamp */
  timestamp: number;
  /** Timestamp (formatted) */
  timestampFormatted: string;
}

/**
 * Rewards dashboard state
 */
export enum RewardsDashboardState {
  /** Loading pool data */
  LOADING = 'LOADING',
  /** Ready to display */
  READY = 'READY',
  /** Claiming rewards in progress */
  CLAIMING = 'CLAIMING',
  /** Claim successful */
  SUCCESS = 'SUCCESS',
  /** Error occurred */
  ERROR = 'ERROR',
}

// ==================== Helper Types ====================

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the action is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
}
