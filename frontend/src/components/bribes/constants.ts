/**
 * Bribes Marketplace Constants
 */

import { BribeToken } from './types';

/**
 * BribeMarketplace contract address
 * TODO: Update with actual deployed address
 */
export const BRIBE_MARKETPLACE_ADDRESS = '0x0000000000000000000000000000000000001000' as `0x${string}`;

/**
 * Platform fee rate (2%)
 */
export const PLATFORM_FEE_RATE = 200; // 200 / 10000 = 2%

/**
 * Fee denominator
 */
export const FEE_DENOMINATOR = 10000;

/**
 * Calculate platform fee
 * @param amount - Total bribe amount
 * @returns Platform fee (2% of amount)
 */
export const calculatePlatformFee = (amount: bigint): bigint => {
  if (amount === 0n) return 0n;
  return (amount * BigInt(PLATFORM_FEE_RATE)) / BigInt(FEE_DENOMINATOR);
};

/**
 * Calculate net bribe amount (after fee)
 * @param amount - Total bribe amount
 * @returns Net amount (98% of amount)
 */
export const calculateNetBribeAmount = (amount: bigint): bigint => {
  if (amount === 0n) return 0n;
  const fee = calculatePlatformFee(amount);
  return amount - fee;
};

/**
 * Whitelisted bribe tokens
 * TODO: Update with actual whitelisted tokens
 */
export const WHITELISTED_BRIBE_TOKENS: BribeToken[] = [
  {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' as `0x${string}`,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 18,
    logoURI: '/tokens/usdc.svg',
  },
  {
    address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56' as `0x${string}`,
    symbol: 'BUSD',
    name: 'Binance USD',
    decimals: 18,
    logoURI: '/tokens/busd.svg',
  },
  {
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as `0x${string}`,
    symbol: 'WBNB',
    name: 'Wrapped BNB',
    decimals: 18,
    logoURI: '/tokens/wbnb.svg',
  },
  {
    address: '0x0000000000000000000000000000000000000002' as `0x${string}`,
    symbol: 'PAIMON',
    name: 'Paimon Governance Token',
    decimals: 18,
    logoURI: '/tokens/paimon.svg',
  },
];

/**
 * Get bribe token by address
 * @param address - Token address
 * @returns Bribe token or undefined
 */
export const getBribeTokenByAddress = (address: `0x${string}`): BribeToken | undefined => {
  return WHITELISTED_BRIBE_TOKENS.find((token) => token.address.toLowerCase() === address.toLowerCase());
};

/**
 * Calculate bribe APR (estimated)
 * Formula: (bribe amount / gauge TVL) × (52 weeks / year) × 100%
 * @param bribeAmount - Total bribe amount for the epoch
 * @param gaugeTVL - Total value locked in gauge (USD)
 * @returns APR percentage string (e.g., "15.5%")
 */
export const calculateBribeAPR = (bribeAmount: bigint, gaugeTVL: bigint): string => {
  if (gaugeTVL === 0n) return '0%';

  // APR = (bribe / TVL) × 52 weeks × 100%
  // Multiply by 100 for percentage, then by 52 for annualization
  const apr = Number((bribeAmount * 5200n) / gaugeTVL) / 100;
  return `${apr.toFixed(1)}%`;
};

/**
 * Sort bribes by amount (descending)
 * @param bribes - Array of bribes
 * @returns Sorted array (highest amount first)
 */
export const sortBribesByAmount = <T extends { amount: bigint }>(bribes: T[]): T[] => {
  return [...bribes].sort((a, b) => {
    if (a.amount > b.amount) return -1;
    if (a.amount < b.amount) return 1;
    return 0;
  });
};

/**
 * Group bribes by gauge
 * @param bribes - Array of bribes
 * @returns Map of gauge address to bribes
 */
export const groupBribesByGauge = <T extends { gauge: `0x${string}` }>(
  bribes: T[]
): Map<`0x${string}`, T[]> => {
  const grouped = new Map<`0x${string}`, T[]>();

  bribes.forEach((bribe) => {
    const existing = grouped.get(bribe.gauge) || [];
    existing.push(bribe);
    grouped.set(bribe.gauge, existing);
  });

  return grouped;
};

/**
 * Design tokens (OlympusDAO style)
 */
export const BRIBES_DESIGN_TOKENS = {
  /** Pill-shaped border radius */
  RADIUS_PILL: '100px',
  /** Large border radius for cards */
  RADIUS_LARGE: '24px',
  /** Card shadow (inset style) */
  SHADOW_CARD: 'inset 0 -1px 0 0 rgba(255, 152, 0, 0.1)',
  /** Button shadow */
  SHADOW_BUTTON: '0 4px 12px rgba(255, 152, 0, 0.2)',
} as const;
