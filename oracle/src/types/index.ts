/**
 * Type Definitions for Paimon Bond Oracle Service
 */

// Task Types
export enum TaskType {
  TWITTER_FOLLOW = 'TWITTER_FOLLOW',
  TWITTER_RETWEET = 'TWITTER_RETWEET',
  TWITTER_LIKE = 'TWITTER_LIKE',
  TWITTER_MENTION = 'TWITTER_MENTION',
  TWITTER_MEME = 'TWITTER_MEME',
  DISCORD_JOIN = 'DISCORD_JOIN',
  DISCORD_ROLE = 'DISCORD_ROLE',
  DISCORD_MESSAGE = 'DISCORD_MESSAGE',
  DISCORD_SHARE = 'DISCORD_SHARE',
  REFERRAL = 'REFERRAL',
}

// Verification Request
export interface VerificationRequest {
  tokenId: number;
  taskId: string;
  proof: TaskProof;
  userAddress: string;
}

// Task Proof (union type for different providers)
export type TaskProof =
  | TwitterProof
  | DiscordProof
  | ReferralProof;

export interface TwitterProof {
  type: 'twitter';
  twitterUserId: string;
  twitterUsername: string;
  tweetId?: string; // For retweet/like verification
}

export interface DiscordProof {
  type: 'discord';
  discordUserId: string;
  discordUsername: string;
  guildId: string;
  roleId?: string;
}

export interface ReferralProof {
  type: 'referral';
  referralCode: string;
}

// Verification Response
export interface VerificationResponse {
  success: boolean;
  signature?: string;
  nonce?: number;
  message?: string;
  error?: string;
}

// Task Completion Record
export interface TaskCompletion {
  id: string;
  tokenId: number;
  taskId: string;
  userAddress: string;
  taskType: TaskType;
  proofData: Record<string, any>;
  completedAt: Date;
  signature: string;
  nonce: number;
  verified: boolean;
}

// Referral Code
export interface ReferralCode {
  id: string;
  code: string;
  ownerAddress: string;
  tokenId?: number;
  createdAt: Date;
  clicks: number;
  conversions: number;
}

// EIP-712 Domain
export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

// EIP-712 Task Verification Message
export interface TaskVerificationMessage {
  tokenId: number;
  taskId: string;
  completedAt: number; // Unix timestamp
  nonce: number;
}

// EIP-712 Typed Data
export interface EIP712TypedData {
  types: {
    EIP712Domain: Array<{ name: string; type: string }>;
    TaskVerification: Array<{ name: string; type: string }>;
  };
  primaryType: 'TaskVerification';
  domain: EIP712Domain;
  message: TaskVerificationMessage;
}

// Configuration
export interface OracleConfig {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  twitter: {
    apiKey: string;
    apiSecret: string;
    bearerToken: string;
    clientId: string;
    clientSecret: string;
  };
  discord: {
    botToken: string;
    clientId: string;
    clientSecret: string;
    guildId: string;
  };
  oracle: {
    privateKey: string;
    address: string;
  };
  contracts: {
    remintControllerTestnet: string;
    remintControllerMainnet: string;
  };
  chainIds: {
    testnet: number;
    mainnet: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  referral: {
    codeLength: number;
    rewardUsdc: number;
  };
  cors: {
    origin: string[];
  };
}

// API Responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Twitter API Types
export interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

export interface TwitterFollowResponse {
  data: {
    following: boolean;
  };
}

export interface TwitterTweetResponse {
  data: {
    id: string;
    text: string;
    author_id: string;
  };
}

// Discord API Types
export interface DiscordGuildMember {
  user: {
    id: string;
    username: string;
    discriminator: string;
  };
  roles: string[];
  joined_at: string;
}

export interface DiscordRole {
  id: string;
  name: string;
}
