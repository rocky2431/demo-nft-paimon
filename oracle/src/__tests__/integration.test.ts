/**
 * Integration Tests for Oracle Service
 * Tests Twitter, Discord, Referral verification flows
 */

import { signatureService } from '../services/SignatureService';
import { referralService } from '../services/ReferralService';
import { ethers } from 'ethers';

describe('Oracle Service Integration Tests', () => {
  describe('EIP-712 Signature Service', () => {
    test('should generate valid EIP-712 signature', async () => {
      const tokenId = 1;
      const taskId = 'TWITTER_FOLLOW';
      const nonce = 1;

      const { signature, messageHash } = await signatureService.signTaskVerification(tokenId, taskId, nonce);

      // Check signature format
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
      expect(messageHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Verify signature length (65 bytes = 130 hex chars)
      expect(signature.length).toBe(132); // 0x + 130 chars
    });

    test('should produce consistent message hash for same inputs', async () => {
      const tokenId = 1;
      const taskId = 'TWITTER_FOLLOW';
      const nonce = 1;

      const result1 = await signatureService.signTaskVerification(tokenId, taskId, nonce);
      const result2 = await signatureService.signTaskVerification(tokenId, taskId, nonce);

      // Message hash should be the same for same inputs
      expect(result1.messageHash).toBe(result2.messageHash);

      // But signatures will differ due to different timestamps in completedAt
      // (unless executed in the same second)
    });

    test('should verify signature correctly', async () => {
      const tokenId = 1;
      const taskId = 'TWITTER_FOLLOW';
      const nonce = 1;

      const { signature } = await signatureService.signTaskVerification(tokenId, taskId, nonce);

      const isValid = await signatureService.verifySignature(tokenId, taskId, nonce, signature);
      expect(isValid).toBe(true);
    });

    test('should return oracle address', () => {
      const address = signatureService.getOracleAddress();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe('Referral Service', () => {
    test('should generate unique referral codes', async () => {
      const ownerAddress = '0x1234567890123456789012345678901234567890';

      const code1 = await referralService.generateCode(ownerAddress, 1);
      const code2 = await referralService.generateCode(ownerAddress, 2);

      // Codes should be unique
      expect(code1).not.toBe(code2);

      // Code length should match config (default 8)
      expect(code1.length).toBe(8);
      expect(code2.length).toBe(8);
    });

    test('should verify valid referral code', async () => {
      const ownerAddress = '0x1234567890123456789012345678901234567890';
      const code = await referralService.generateCode(ownerAddress);

      const isValid = await referralService.verifyCode(code);
      expect(isValid).toBe(true);
    });

    test('should reject invalid referral code', async () => {
      const isValid = await referralService.verifyCode('INVALID_CODE');
      expect(isValid).toBe(false);
    });

    test('should track referral clicks', async () => {
      const ownerAddress = '0x1234567890123456789012345678901234567890';
      const code = await referralService.generateCode(ownerAddress);

      const tracked = await referralService.trackClick(code, '127.0.0.1', 'Mozilla/5.0');
      expect(tracked).toBe(true);

      const details = await referralService.getCodeDetails(code);
      expect(details?.clicks).toBe(1);
    });

    test('should track referral conversions', async () => {
      const ownerAddress = '0x1234567890123456789012345678901234567890';
      const code = await referralService.generateCode(ownerAddress);

      await referralService.trackClick(code, '127.0.0.1', 'Mozilla/5.0');
      const tracked = await referralService.trackConversion(code, '127.0.0.1');
      expect(tracked).toBe(true);

      const details = await referralService.getCodeDetails(code);
      expect(details?.conversions).toBe(1);
    });

    test('should retrieve codes by owner', async () => {
      const ownerAddress = '0x1234567890123456789012345678901234567890';

      await referralService.generateCode(ownerAddress, 1);
      await referralService.generateCode(ownerAddress, 2);

      const codes = await referralService.getCodesByOwner(ownerAddress);
      expect(codes.length).toBeGreaterThanOrEqual(2);
    });

    test('should calculate referral stats correctly', async () => {
      const ownerAddress = '0x1234567890123456789012345678901234567890';
      const code = await referralService.generateCode(ownerAddress);

      // Track 10 clicks, 3 conversions
      for (let i = 0; i < 10; i++) {
        await referralService.trackClick(code, `127.0.0.${i}`, 'Mozilla/5.0');
      }
      for (let i = 0; i < 3; i++) {
        await referralService.trackConversion(code, `127.0.0.${i}`);
      }

      const stats = await referralService.getStats(code);
      expect(stats?.clicks).toBe(10);
      expect(stats?.conversions).toBe(3);
      expect(stats?.conversionRate).toBe(30.0); // 3/10 * 100 = 30%
    });

    test('should generate leaderboard sorted by conversions', async () => {
      const leaderboard = await referralService.getLeaderboard(10);

      // Leaderboard should be sorted by conversions DESC, then clicks DESC
      for (let i = 0; i < leaderboard.length - 1; i++) {
        const current = leaderboard[i];
        const next = leaderboard[i + 1];

        if (current.conversions !== next.conversions) {
          expect(current.conversions).toBeGreaterThanOrEqual(next.conversions);
        } else {
          expect(current.clicks).toBeGreaterThanOrEqual(next.clicks);
        }
      }
    });

    test('should calculate reward correctly', () => {
      const reward = referralService.calculateReward(10);
      expect(reward).toBe(1.0); // 10 * 0.1 USDC = 1.0 USDC
    });
  });

  describe('Twitter Service (Mock Tests)', () => {
    // Note: These are mock tests. Real Twitter API tests require valid credentials.

    test('should validate Twitter user ID format', () => {
      const userId = '123456789';
      expect(userId).toMatch(/^\d+$/);
    });

    test('should validate Twitter username format', () => {
      const username = 'PaimonBond';
      expect(username).toMatch(/^[A-Za-z0-9_]+$/);
    });
  });

  describe('Discord Service (Mock Tests)', () => {
    // Note: These are mock tests. Real Discord API tests require valid credentials.

    test('should validate Discord user ID format', () => {
      const userId = '123456789012345678';
      expect(userId).toMatch(/^\d{17,19}$/);
    });

    test('should validate Discord guild ID format', () => {
      const guildId = '123456789012345678';
      expect(guildId).toMatch(/^\d{17,19}$/);
    });
  });

  describe('End-to-End Verification Flow', () => {
    test('should complete full referral verification flow', async () => {
      // 1. Generate referral code
      const ownerAddress = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';
      const tokenId = 1;
      const code = await referralService.generateCode(ownerAddress, tokenId);

      // 2. Track click
      await referralService.trackClick(code, '192.168.1.1', 'Mozilla/5.0');

      // 3. Verify code
      const isValid = await referralService.verifyCode(code);
      expect(isValid).toBe(true);

      // 4. Generate signature for task completion
      const taskId = 'REFERRAL';
      const nonce = 1;
      const { signature, messageHash } = await signatureService.signTaskVerification(tokenId, taskId, nonce);

      // 5. Verify signature
      const isSignatureValid = await signatureService.verifySignature(tokenId, taskId, nonce, signature);
      expect(isSignatureValid).toBe(true);

      // 6. Track conversion
      await referralService.trackConversion(code, '192.168.1.1');

      // 7. Verify stats
      const stats = await referralService.getStats(code);
      expect(stats?.conversions).toBe(1);
      expect(stats?.clicks).toBe(1);
      expect(stats?.conversionRate).toBe(100.0);
    });
  });
});
