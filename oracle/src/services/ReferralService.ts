/**
 * Referral Tracking Service
 * Generates referral codes and tracks clicks/conversions
 */

import { nanoid } from 'nanoid';
import { config } from '../config';
import { ReferralCode } from '../types';

// In-memory storage for demo (replace with DatabaseService in production)
const referralCodesStore = new Map<string, ReferralCode>();
const referralClicksStore: Array<{
  code: string;
  ip: string;
  userAgent: string;
  clickedAt: Date;
  converted: boolean;
}> = [];

export class ReferralService {
  private codeLength: number;

  constructor() {
    this.codeLength = config.referral.codeLength;
    console.log('🔗 ReferralService initialized');
    console.log(`   Code length: ${this.codeLength} characters`);
  }

  /**
   * Generate a unique referral code
   * @param ownerAddress - Wallet address of the code owner
   * @param tokenId - Optional Bond NFT token ID
   * @returns Generated referral code
   */
  async generateCode(ownerAddress: string, tokenId?: number): Promise<string> {
    // Generate unique code using nanoid
    let code = nanoid(this.codeLength);

    // Ensure uniqueness (retry if collision occurs)
    while (referralCodesStore.has(code)) {
      code = nanoid(this.codeLength);
    }

    const referralCode: ReferralCode = {
      id: nanoid(),
      code,
      ownerAddress,
      tokenId,
      createdAt: new Date(),
      clicks: 0,
      conversions: 0,
    };

    referralCodesStore.set(code, referralCode);

    console.log(`✅ Generated referral code: ${code} for ${ownerAddress}`);
    return code;
  }

  /**
   * Track a referral click
   * @param code - Referral code
   * @param ip - IP address of the clicker
   * @param userAgent - User agent string
   * @returns True if click was tracked successfully
   */
  async trackClick(code: string, ip: string, userAgent: string): Promise<boolean> {
    const referralCode = referralCodesStore.get(code);

    if (!referralCode) {
      console.warn(`⚠️ Invalid referral code: ${code}`);
      return false;
    }

    // Increment clicks
    referralCode.clicks += 1;

    // Log click event
    referralClicksStore.push({
      code,
      ip,
      userAgent,
      clickedAt: new Date(),
      converted: false,
    });

    console.log(`📊 Referral click tracked: Code ${code} | Total clicks: ${referralCode.clicks}`);
    return true;
  }

  /**
   * Track a referral conversion (successful mint)
   * @param code - Referral code
   * @param ip - IP address of the converter
   * @returns True if conversion was tracked successfully
   */
  async trackConversion(code: string, ip: string): Promise<boolean> {
    const referralCode = referralCodesStore.get(code);

    if (!referralCode) {
      console.warn(`⚠️ Invalid referral code: ${code}`);
      return false;
    }

    // Increment conversions
    referralCode.conversions += 1;

    // Mark the most recent click from this IP as converted
    const recentClick = referralClicksStore
      .filter((click) => click.code === code && click.ip === ip && !click.converted)
      .sort((a, b) => b.clickedAt.getTime() - a.clickedAt.getTime())[0];

    if (recentClick) {
      recentClick.converted = true;
    }

    console.log(`🎯 Referral conversion tracked: Code ${code} | Total conversions: ${referralCode.conversions}`);
    return true;
  }

  /**
   * Verify a referral code exists and is valid
   * @param code - Referral code to verify
   * @returns True if code exists and is valid
   */
  async verifyCode(code: string): Promise<boolean> {
    const exists = referralCodesStore.has(code);

    console.log(`✅ Referral code verification: ${code} → ${exists ? 'VALID' : 'INVALID'}`);
    return exists;
  }

  /**
   * Get referral code details
   * @param code - Referral code
   * @returns ReferralCode object or null if not found
   */
  async getCodeDetails(code: string): Promise<ReferralCode | null> {
    return referralCodesStore.get(code) || null;
  }

  /**
   * Get all referral codes for an owner
   * @param ownerAddress - Wallet address
   * @returns Array of referral codes
   */
  async getCodesByOwner(ownerAddress: string): Promise<ReferralCode[]> {
    const codes = Array.from(referralCodesStore.values()).filter(
      (rc) => rc.ownerAddress.toLowerCase() === ownerAddress.toLowerCase()
    );

    console.log(`📋 Found ${codes.length} referral codes for ${ownerAddress}`);
    return codes;
  }

  /**
   * Get referral leaderboard (top referrers by conversions)
   * @param limit - Number of top referrers to return (default: 10)
   * @returns Array of referral codes sorted by conversions
   */
  async getLeaderboard(limit: number = 10): Promise<ReferralCode[]> {
    const sortedCodes = Array.from(referralCodesStore.values())
      .sort((a, b) => {
        // Sort by conversions first, then by clicks
        if (b.conversions !== a.conversions) {
          return b.conversions - a.conversions;
        }
        return b.clicks - a.clicks;
      })
      .slice(0, limit);

    console.log(`🏆 Leaderboard (top ${limit}):`);
    sortedCodes.forEach((rc, idx) => {
      const conversionRate = rc.clicks > 0 ? ((rc.conversions / rc.clicks) * 100).toFixed(2) : '0.00';
      console.log(
        `   ${idx + 1}. ${rc.code} - ${rc.conversions} conversions (${rc.clicks} clicks, ${conversionRate}% rate)`
      );
    });

    return sortedCodes;
  }

  /**
   * Get referral statistics
   * @param code - Referral code
   * @returns Statistics object with clicks, conversions, and conversion rate
   */
  async getStats(code: string): Promise<{
    code: string;
    clicks: number;
    conversions: number;
    conversionRate: number;
  } | null> {
    const referralCode = referralCodesStore.get(code);

    if (!referralCode) {
      return null;
    }

    const conversionRate =
      referralCode.clicks > 0 ? (referralCode.conversions / referralCode.clicks) * 100 : 0;

    return {
      code: referralCode.code,
      clicks: referralCode.clicks,
      conversions: referralCode.conversions,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
    };
  }

  /**
   * Calculate referral reward in USDC
   * @param conversions - Number of conversions
   * @returns Reward amount in USDC
   */
  calculateReward(conversions: number): number {
    return conversions * config.referral.rewardUsdc;
  }
}

// Singleton instance
export const referralService = new ReferralService();
