/**
 * Treasury Constants
 * Configuration for RWA Treasury deposit functionality
 */

import { RWAAsset } from '@/types/treasury';

// Whitelisted RWA Assets (demo addresses - to be updated with actual deployed contracts)
export const RWA_ASSETS: RWAAsset[] = [
  {
    address: '0x0000000000000000000000000000000000000001',
    name: 'Tokenized US Treasury Bond',
    symbol: 'tUST',
    tier: 1,
    ltvRatio: 60, // 60% LTV for T1
    mintDiscount: 0,
    isActive: true,
  },
  {
    address: '0x0000000000000000000000000000000000000002',
    name: 'Tokenized Corporate Bond',
    symbol: 'tCORPBOND',
    tier: 2,
    ltvRatio: 50, // 50% LTV for T2
    mintDiscount: 0,
    isActive: true,
  },
  {
    address: '0x0000000000000000000000000000000000000003',
    name: 'Tokenized Real Estate',
    symbol: 'tRE',
    tier: 3,
    ltvRatio: 40, // 40% LTV for T3
    mintDiscount: 0,
    isActive: true,
  },
];

// Treasury Configuration
export const TREASURY_CONFIG = {
  MIN_DEPOSIT_AMOUNT: 10, // Minimum 10 RWA tokens
  MAX_DEPOSIT_AMOUNT: 1000000, // Maximum 1M RWA tokens
  COOLDOWN_PERIOD_DAYS: 7,
  REDEMPTION_FEE_BPS: 50, // 0.5%
  BPS_DENOMINATOR: 10000,
  TARGET_HEALTH_FACTOR: 125, // 125%
  LIQUIDATION_THRESHOLD: 115, // 115%
  LIQUIDATION_PENALTY: 5, // 5%
} as const;

// Color Theme (warm colors)
export const TREASURY_THEME = {
  PRIMARY: '#FFD700', // Warm gold
  SECONDARY: '#FF8C00', // Dark orange
  ACCENT: '#FFA500', // Orange
  SUCCESS: '#8BC34A', // Light Green (for health factor)
  WARNING: '#FFB74D', // Deep Orange (for health factor)
  ERROR: '#FF6B35', // Warm Red-Orange (for health factor)
  BACKGROUND: '#FFF8E7', // Cornsilk
} as const;

/**
 * Unified Card Styles
 * Standard card styling to ensure consistency across all Treasury components
 * Matches Presale component styling for better UX consistency
 */
export const TREASURY_CARD_STYLES = {
  /**
   * Primary card style (default) - with subtle golden glow
   */
  primary: {
    backgroundColor: 'background.paper',
    borderRadius: 3, // 24px (MUI spacing unit * 3)
    border: `1px solid ${TREASURY_THEME.PRIMARY}`,
    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.12)',
    transition: 'box-shadow 0.3s ease',
    '&:hover': {
      boxShadow: '0 6px 20px rgba(255, 215, 0, 0.2)',
    },
  },
  /**
   * Secondary card style (less emphasis)
   */
  secondary: {
    backgroundColor: 'background.paper',
    borderRadius: 3,
    border: `1px solid`,
    borderColor: 'divider',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  /**
   * Info card style (informational content)
   */
  info: {
    backgroundColor: 'background.paper',
    borderRadius: 2,
    border: `1px solid ${TREASURY_THEME.SECONDARY}`,
    boxShadow: 'none',
  },
} as const;
