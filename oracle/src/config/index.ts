/**
 * Configuration Loader
 * Loads environment variables and validates configuration
 */

import dotenv from 'dotenv';
import { OracleConfig } from '../types';

// Load environment variables
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const config: OracleConfig = {
  port: parseInt(getEnv('PORT', '3001'), 10),
  nodeEnv: getEnv('NODE_ENV', 'development'),

  database: {
    url: requireEnv('DATABASE_URL'),
    host: requireEnv('DB_HOST'),
    port: parseInt(requireEnv('DB_PORT'), 10),
    name: requireEnv('DB_NAME'),
    user: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
  },

  twitter: {
    apiKey: requireEnv('TWITTER_API_KEY'),
    apiSecret: requireEnv('TWITTER_API_SECRET'),
    bearerToken: requireEnv('TWITTER_BEARER_TOKEN'),
    clientId: requireEnv('TWITTER_CLIENT_ID'),
    clientSecret: requireEnv('TWITTER_CLIENT_SECRET'),
  },

  discord: {
    botToken: requireEnv('DISCORD_BOT_TOKEN'),
    clientId: requireEnv('DISCORD_CLIENT_ID'),
    clientSecret: requireEnv('DISCORD_CLIENT_SECRET'),
    guildId: requireEnv('DISCORD_GUILD_ID'),
  },

  oracle: {
    privateKey: requireEnv('ORACLE_PRIVATE_KEY'),
    address: requireEnv('ORACLE_ADDRESS'),
  },

  contracts: {
    remintControllerTestnet: requireEnv('REMINT_CONTROLLER_ADDRESS_TESTNET'),
    remintControllerMainnet: requireEnv('REMINT_CONTROLLER_ADDRESS_MAINNET'),
  },

  chainIds: {
    testnet: parseInt(requireEnv('CHAIN_ID_TESTNET'), 10),
    mainnet: parseInt(requireEnv('CHAIN_ID_MAINNET'), 10),
  },

  rateLimit: {
    windowMs: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10), // 15 minutes
    maxRequests: parseInt(getEnv('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  },

  referral: {
    codeLength: parseInt(getEnv('REFERRAL_CODE_LENGTH', '8'), 10),
    rewardUsdc: parseFloat(getEnv('REFERRAL_REWARD_USDC', '0.1')),
  },

  cors: {
    origin: getEnv('CORS_ORIGIN', 'http://localhost:3000').split(','),
  },
};

// Validate configuration
export function validateConfig(): void {
  // Validate private key format
  if (!config.oracle.privateKey.startsWith('0x') || config.oracle.privateKey.length !== 66) {
    throw new Error('Invalid ORACLE_PRIVATE_KEY format (must be 0x + 64 hex chars)');
  }

  // Validate address format
  if (!config.oracle.address.startsWith('0x') || config.oracle.address.length !== 42) {
    throw new Error('Invalid ORACLE_ADDRESS format (must be 0x + 40 hex chars)');
  }

  // Validate chain IDs
  if (![56, 97].includes(config.chainIds.testnet) || ![56, 97].includes(config.chainIds.mainnet)) {
    throw new Error('Invalid chain IDs (must be 56 for BSC Mainnet or 97 for BSC Testnet)');
  }

  console.log('✅ Configuration validated successfully');
}
