/**
 * Verification Controller
 * Handles task verification requests and signature generation
 */

import { Request, Response } from 'express';
import { signatureService } from '../services/SignatureService';
import { twitterService } from '../services/TwitterService';
import { discordService } from '../services/DiscordService';
import { referralService } from '../services/ReferralService';
import { databaseService } from '../services/DatabaseService';
import { VerificationRequest, VerificationResponse, TaskType, TwitterProof, DiscordProof, ReferralProof } from '../types';

export class VerificationController {
  /**
   * POST /api/verify-task
   * Main endpoint for task verification
   */
  async verifyTask(req: Request, res: Response): Promise<void> {
    try {
      const request: VerificationRequest = req.body;

      // Validate request
      if (!request.tokenId || !request.taskId || !request.proof || !request.userAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: tokenId, taskId, proof, userAddress',
        } as VerificationResponse);
        return;
      }

      // Check if task already completed
      const alreadyCompleted = await databaseService.isTaskCompleted(request.tokenId, request.taskId);
      if (alreadyCompleted) {
        res.status(409).json({
          success: false,
          error: 'Task already completed for this token',
        } as VerificationResponse);
        return;
      }

      // Verify task based on proof type
      let verified = false;
      let taskType: TaskType;

      switch (request.proof.type) {
        case 'twitter':
          verified = await this.verifyTwitterTask(request.taskId, request.proof as TwitterProof);
          taskType = this.getTwitterTaskType(request.taskId);
          break;

        case 'discord':
          verified = await this.verifyDiscordTask(request.taskId, request.proof as DiscordProof);
          taskType = this.getDiscordTaskType(request.taskId);
          break;

        case 'referral':
          verified = await this.verifyReferralTask(request.proof as ReferralProof);
          taskType = TaskType.REFERRAL;
          break;

        default:
          res.status(400).json({
            success: false,
            error: 'Invalid proof type',
          } as VerificationResponse);
          return;
      }

      if (!verified) {
        res.status(403).json({
          success: false,
          error: 'Task verification failed',
        } as VerificationResponse);
        return;
      }

      // Get next nonce
      const nonce = await databaseService.getNextNonce(request.tokenId);

      // Generate EIP-712 signature
      const { signature, messageHash } = await signatureService.signTaskVerification(
        request.tokenId,
        request.taskId,
        nonce
      );

      // Save task completion to database
      await databaseService.saveTaskCompletion(
        request.tokenId,
        request.taskId,
        request.userAddress,
        taskType,
        request.proof as any,
        signature,
        nonce
      );

      // Save signature to audit log
      await databaseService.saveSignature(request.tokenId, request.taskId, messageHash, signature, nonce);

      // Return success response
      res.status(200).json({
        success: true,
        signature,
        nonce,
        message: 'Task verified successfully',
      } as VerificationResponse);
    } catch (error: any) {
      console.error('❌ Verification error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as VerificationResponse);
    }
  }

  /**
   * Verify Twitter-based tasks
   */
  private async verifyTwitterTask(taskId: string, proof: TwitterProof): Promise<boolean> {
    const { twitterUserId } = proof;

    if (taskId === 'TWITTER_FOLLOW') {
      // Verify user follows @PaimonBond (replace with actual account ID)
      const targetUserId = '123456789'; // TODO: Replace with actual @PaimonBond Twitter ID
      return await twitterService.verifyFollow(twitterUserId, targetUserId);
    }

    if (taskId === 'TWITTER_RETWEET' && proof.tweetId) {
      return await twitterService.verifyRetweet(proof.tweetId, twitterUserId);
    }

    if (taskId === 'TWITTER_LIKE' && proof.tweetId) {
      return await twitterService.verifyLike(proof.tweetId, twitterUserId);
    }

    if (taskId === 'TWITTER_MENTION') {
      return await twitterService.verifyMention(twitterUserId, 'PaimonBond');
    }

    if (taskId === 'TWITTER_MEME') {
      return await twitterService.verifyMeme(twitterUserId, ['PaimonBond', 'BSC']);
    }

    return false;
  }

  /**
   * Verify Discord-based tasks
   */
  private async verifyDiscordTask(taskId: string, proof: DiscordProof): Promise<boolean> {
    const { discordUserId, guildId, roleId } = proof;

    if (taskId === 'DISCORD_JOIN') {
      return await discordService.verifyMembership(discordUserId);
    }

    if (taskId === 'DISCORD_ROLE' && roleId) {
      return await discordService.verifyRole(discordUserId, roleId);
    }

    if (taskId === 'DISCORD_MESSAGE') {
      return await discordService.verifyActivity(discordUserId, 1);
    }

    return false;
  }

  /**
   * Verify referral tasks
   */
  private async verifyReferralTask(proof: ReferralProof): Promise<boolean> {
    const { referralCode } = proof;
    return await referralService.verifyCode(referralCode);
  }

  /**
   * Get TaskType from Twitter task ID
   */
  private getTwitterTaskType(taskId: string): TaskType {
    if (taskId === 'TWITTER_FOLLOW') return TaskType.TWITTER_FOLLOW;
    if (taskId === 'TWITTER_RETWEET') return TaskType.TWITTER_RETWEET;
    if (taskId === 'TWITTER_LIKE') return TaskType.TWITTER_LIKE;
    if (taskId === 'TWITTER_MENTION') return TaskType.TWITTER_MENTION;
    if (taskId === 'TWITTER_MEME') return TaskType.TWITTER_MEME;
    return TaskType.TWITTER_FOLLOW;
  }

  /**
   * Get TaskType from Discord task ID
   */
  private getDiscordTaskType(taskId: string): TaskType {
    if (taskId === 'DISCORD_JOIN') return TaskType.DISCORD_JOIN;
    if (taskId === 'DISCORD_ROLE') return TaskType.DISCORD_ROLE;
    if (taskId === 'DISCORD_MESSAGE') return TaskType.DISCORD_MESSAGE;
    return TaskType.DISCORD_JOIN;
  }

  /**
   * POST /api/referral/generate
   * Generate a new referral code
   */
  async generateReferralCode(req: Request, res: Response): Promise<void> {
    try {
      const { ownerAddress, tokenId } = req.body;

      if (!ownerAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing ownerAddress',
        });
        return;
      }

      const code = await referralService.generateCode(ownerAddress, tokenId);
      await databaseService.saveReferralCode(code, ownerAddress, tokenId);

      res.status(201).json({
        success: true,
        data: { code },
      });
    } catch (error: any) {
      console.error('❌ Referral generation error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate referral code',
      });
    }
  }

  /**
   * POST /api/referral/click
   * Track a referral click
   */
  async trackReferralClick(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.body;
      const ip = req.ip || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      if (!code) {
        res.status(400).json({
          success: false,
          error: 'Missing code',
        });
        return;
      }

      await referralService.trackClick(code, ip, userAgent);
      await databaseService.trackReferralClick(code, ip, userAgent);

      res.status(200).json({
        success: true,
        message: 'Click tracked',
      });
    } catch (error: any) {
      console.error('❌ Click tracking error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to track click',
      });
    }
  }

  /**
   * GET /api/referral/stats/:code
   * Get referral code statistics
   */
  async getReferralStats(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      const stats = await referralService.getStats(code);
      if (!stats) {
        res.status(404).json({
          success: false,
          error: 'Referral code not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('❌ Stats retrieval error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get stats',
      });
    }
  }

  /**
   * GET /api/referral/leaderboard
   * Get referral leaderboard
   */
  async getReferralLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await databaseService.getReferralLeaderboard(limit);

      res.status(200).json({
        success: true,
        data: leaderboard,
      });
    } catch (error: any) {
      console.error('❌ Leaderboard retrieval error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get leaderboard',
      });
    }
  }

  /**
   * GET /api/stats
   * Get task completion statistics
   */
  async getTaskStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await databaseService.getTaskStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('❌ Stats retrieval error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get stats',
      });
    }
  }
}

// Singleton instance
export const verificationController = new VerificationController();
