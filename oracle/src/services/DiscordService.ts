/**
 * Discord API Integration Service
 * Verifies Discord-based social tasks
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { DiscordGuildMember, DiscordRole } from '../types';

export class DiscordService {
  private api: AxiosInstance;
  private botToken: string;
  private guildId: string;

  constructor() {
    this.botToken = config.discord.botToken;
    this.guildId = config.discord.guildId;

    // Initialize axios instance with Discord API v10 base URL
    this.api = axios.create({
      baseURL: 'https://discord.com/api/v10',
      headers: {
        Authorization: `Bot ${this.botToken}`,
      },
      timeout: 10000,
    });

    console.log('💬 DiscordService initialized');
    console.log(`   Guild ID: ${this.guildId}`);
  }

  /**
   * Verify if a user is a member of the Discord server
   * @param userId - Discord user ID
   * @returns True if user is a member of the guild
   */
  async verifyMembership(userId: string): Promise<boolean> {
    try {
      // GET /guilds/{guild.id}/members/{user.id}
      const response = await this.api.get(`/guilds/${this.guildId}/members/${userId}`);

      const isMember = !!response.data;

      console.log(`✅ Discord membership verification: User ${userId} in Guild ${this.guildId}: ${isMember}`);
      return isMember;
    } catch (error: any) {
      // 404 means user is not a member
      if (error.response?.status === 404) {
        console.log(`❌ User ${userId} is NOT a member of Guild ${this.guildId}`);
        return false;
      }

      console.error('❌ Discord API error (verifyMembership):', error.response?.data || error.message);
      throw new Error('Failed to verify Discord membership');
    }
  }

  /**
   * Verify if a user has a specific role in the Discord server
   * @param userId - Discord user ID
   * @param roleId - Role ID to check
   * @returns True if user has the specified role
   */
  async verifyRole(userId: string, roleId: string): Promise<boolean> {
    try {
      // GET /guilds/{guild.id}/members/{user.id}
      const response = await this.api.get(`/guilds/${this.guildId}/members/${userId}`);

      const member: DiscordGuildMember = response.data;
      const hasRole = member.roles?.includes(roleId) || false;

      console.log(`✅ Discord role verification: User ${userId} has Role ${roleId}: ${hasRole}`);
      return hasRole;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`❌ User ${userId} is not a member or role not found`);
        return false;
      }

      console.error('❌ Discord API error (verifyRole):', error.response?.data || error.message);
      throw new Error('Failed to verify Discord role');
    }
  }

  /**
   * Get member information
   * @param userId - Discord user ID
   * @returns Member object or null if not found
   */
  async getMember(userId: string): Promise<DiscordGuildMember | null> {
    try {
      const response = await this.api.get(`/guilds/${this.guildId}/members/${userId}`);
      return response.data as DiscordGuildMember;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`⚠️ Discord member not found: ${userId}`);
        return null;
      }

      console.error('❌ Discord API error (getMember):', error.response?.data || error.message);
      throw new Error('Failed to fetch Discord member');
    }
  }

  /**
   * Get all roles in the guild
   * @returns Array of guild roles
   */
  async getGuildRoles(): Promise<DiscordRole[]> {
    try {
      const response = await this.api.get(`/guilds/${this.guildId}/roles`);
      return response.data as DiscordRole[];
    } catch (error: any) {
      console.error('❌ Discord API error (getGuildRoles):', error.response?.data || error.message);
      throw new Error('Failed to fetch guild roles');
    }
  }

  /**
   * Verify if a user has sent messages in the server (by checking member join date)
   * Note: This is a simplified verification. For true message verification,
   * you'd need to track messages via Discord bot events.
   * @param userId - Discord user ID
   * @param minDaysActive - Minimum days since joining (default: 1)
   * @returns True if user has been active for at least minDaysActive days
   */
  async verifyActivity(userId: string, minDaysActive: number = 1): Promise<boolean> {
    try {
      const member = await this.getMember(userId);
      if (!member) return false;

      const joinedAt = new Date(member.joined_at);
      const now = new Date();
      const daysSinceJoin = (now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24);

      const isActive = daysSinceJoin >= minDaysActive;

      console.log(`✅ Discord activity verification: User ${userId} active for ${daysSinceJoin.toFixed(1)} days: ${isActive}`);
      return isActive;
    } catch (error: any) {
      console.error('❌ Discord API error (verifyActivity):', error.response?.data || error.message);
      throw new Error('Failed to verify Discord activity');
    }
  }

  /**
   * Verify if a user shared/reacted to a message (requires message ID and channel ID)
   * @param messageId - Message ID to check
   * @param channelId - Channel ID where the message is located
   * @param userId - Discord user ID
   * @param emojiId - Emoji ID or unicode emoji (e.g., "👍", or custom emoji ID)
   * @returns True if user reacted with the specified emoji
   */
  async verifyReaction(
    messageId: string,
    channelId: string,
    userId: string,
    emojiId: string
  ): Promise<boolean> {
    try {
      // GET /channels/{channel.id}/messages/{message.id}/reactions/{emoji}
      // Encode emoji for URL
      const encodedEmoji = encodeURIComponent(emojiId);
      const response = await this.api.get(
        `/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}`,
        {
          params: {
            limit: 100,
          },
        }
      );

      const reactors = response.data || [];
      const hasReacted = reactors.some((user: any) => user.id === userId);

      console.log(`✅ Discord reaction verification: Message ${messageId} by User ${userId}: ${hasReacted}`);
      return hasReacted;
    } catch (error: any) {
      console.error('❌ Discord API error (verifyReaction):', error.response?.data || error.message);
      throw new Error('Failed to verify Discord reaction');
    }
  }
}

// Singleton instance
export const discordService = new DiscordService();
