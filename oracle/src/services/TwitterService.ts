/**
 * Twitter API v2 Integration Service
 * Verifies Twitter-based social tasks
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { TwitterUser, TwitterFollowResponse, TwitterTweetResponse } from '../types';

export class TwitterService {
  private api: AxiosInstance;
  private bearerToken: string;

  constructor() {
    this.bearerToken = config.twitter.bearerToken;

    // Initialize axios instance with Twitter API v2 base URL
    this.api = axios.create({
      baseURL: 'https://api.twitter.com/2',
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
      timeout: 10000,
    });

    console.log('🐦 TwitterService initialized');
  }

  /**
   * Get user information by username
   * @param username - Twitter username (without @)
   * @returns Twitter user object
   */
  async getUserByUsername(username: string): Promise<TwitterUser | null> {
    try {
      const response = await this.api.get(`/users/by/username/${username}`, {
        params: {
          'user.fields': 'id,username,name',
        },
      });

      if (!response.data?.data) {
        console.warn(`⚠️ User not found: @${username}`);
        return null;
      }

      return response.data.data as TwitterUser;
    } catch (error: any) {
      console.error('❌ Twitter API error (getUserByUsername):', error.response?.data || error.message);
      throw new Error(`Failed to fetch Twitter user: ${username}`);
    }
  }

  /**
   * Verify if a user follows a target account
   * @param userId - User's Twitter ID
   * @param targetUserId - Target account's Twitter ID (e.g., PaimonBond official account)
   * @returns True if user follows the target
   */
  async verifyFollow(userId: string, targetUserId: string): Promise<boolean> {
    try {
      // GET /2/users/:id/following/:target_user_id
      const response = await this.api.get(`/users/${userId}/following/${targetUserId}`);

      const isFollowing = response.data?.data?.following === true;

      console.log(`✅ Follow verification: User ${userId} → Target ${targetUserId}: ${isFollowing}`);
      return isFollowing;
    } catch (error: any) {
      // 404 means user doesn't follow the target
      if (error.response?.status === 404) {
        console.log(`❌ User ${userId} does NOT follow ${targetUserId}`);
        return false;
      }

      console.error('❌ Twitter API error (verifyFollow):', error.response?.data || error.message);
      throw new Error('Failed to verify Twitter follow');
    }
  }

  /**
   * Verify if a user retweeted a specific tweet
   * @param tweetId - Tweet ID to check
   * @param userId - User's Twitter ID
   * @returns True if user retweeted the tweet
   */
  async verifyRetweet(tweetId: string, userId: string): Promise<boolean> {
    try {
      // GET /2/tweets/:id/retweeted_by
      const response = await this.api.get(`/tweets/${tweetId}/retweeted_by`, {
        params: {
          max_results: 100,
        },
      });

      const retweeters = response.data?.data || [];
      const hasRetweeted = retweeters.some((user: TwitterUser) => user.id === userId);

      console.log(`✅ Retweet verification: Tweet ${tweetId} by User ${userId}: ${hasRetweeted}`);
      return hasRetweeted;
    } catch (error: any) {
      console.error('❌ Twitter API error (verifyRetweet):', error.response?.data || error.message);
      throw new Error('Failed to verify Twitter retweet');
    }
  }

  /**
   * Verify if a user liked a specific tweet
   * @param tweetId - Tweet ID to check
   * @param userId - User's Twitter ID
   * @returns True if user liked the tweet
   */
  async verifyLike(tweetId: string, userId: string): Promise<boolean> {
    try {
      // GET /2/tweets/:id/liking_users
      const response = await this.api.get(`/tweets/${tweetId}/liking_users`, {
        params: {
          max_results: 100,
        },
      });

      const likers = response.data?.data || [];
      const hasLiked = likers.some((user: TwitterUser) => user.id === userId);

      console.log(`✅ Like verification: Tweet ${tweetId} by User ${userId}: ${hasLiked}`);
      return hasLiked;
    } catch (error: any) {
      console.error('❌ Twitter API error (verifyLike):', error.response?.data || error.message);
      throw new Error('Failed to verify Twitter like');
    }
  }

  /**
   * Verify if a user mentioned a specific account in their recent tweets
   * @param userId - User's Twitter ID
   * @param mentionUsername - Username to search for (e.g., "PaimonBond")
   * @param sinceHours - Search tweets from the last N hours (default: 24)
   * @returns True if user mentioned the account
   */
  async verifyMention(userId: string, mentionUsername: string, sinceHours: number = 24): Promise<boolean> {
    try {
      // Calculate time range
      const sinceTime = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();

      // GET /2/users/:id/tweets
      const response = await this.api.get(`/users/${userId}/tweets`, {
        params: {
          max_results: 100,
          'tweet.fields': 'created_at,text',
          start_time: sinceTime,
        },
      });

      const tweets = response.data?.data || [];
      const hasMentioned = tweets.some((tweet: any) =>
        tweet.text.toLowerCase().includes(`@${mentionUsername.toLowerCase()}`)
      );

      console.log(`✅ Mention verification: User ${userId} mentioned @${mentionUsername}: ${hasMentioned}`);
      return hasMentioned;
    } catch (error: any) {
      console.error('❌ Twitter API error (verifyMention):', error.response?.data || error.message);
      throw new Error('Failed to verify Twitter mention');
    }
  }

  /**
   * Verify if a user posted a meme (tweet with media + specific hashtags)
   * @param userId - User's Twitter ID
   * @param requiredHashtags - Hashtags that must be present (e.g., ["PaimonBond", "BSC"])
   * @param sinceHours - Search tweets from the last N hours (default: 24)
   * @returns True if user posted a valid meme tweet
   */
  async verifyMeme(userId: string, requiredHashtags: string[], sinceHours: number = 24): Promise<boolean> {
    try {
      const sinceTime = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();

      // GET /2/users/:id/tweets with media fields
      const response = await this.api.get(`/users/${userId}/tweets`, {
        params: {
          max_results: 100,
          'tweet.fields': 'created_at,text,entities',
          'expansions': 'attachments.media_keys',
          'media.fields': 'type,url',
          start_time: sinceTime,
        },
      });

      const tweets = response.data?.data || [];
      const media = response.data?.includes?.media || [];

      // Check if any tweet has both:
      // 1. Media attachment (image/video)
      // 2. All required hashtags
      const hasMeme = tweets.some((tweet: any) => {
        // Check for media
        const hasMedia = tweet.attachments?.media_keys?.length > 0;
        if (!hasMedia) return false;

        // Check for required hashtags
        const tweetHashtags = (tweet.entities?.hashtags || []).map((h: any) => h.tag.toLowerCase());
        const hasAllHashtags = requiredHashtags.every((hashtag) =>
          tweetHashtags.includes(hashtag.toLowerCase())
        );

        return hasAllHashtags;
      });

      console.log(`✅ Meme verification: User ${userId} with hashtags [${requiredHashtags.join(', ')}]: ${hasMeme}`);
      return hasMeme;
    } catch (error: any) {
      console.error('❌ Twitter API error (verifyMeme):', error.response?.data || error.message);
      throw new Error('Failed to verify Twitter meme');
    }
  }

  /**
   * Get Twitter user ID from username (helper method)
   * @param username - Twitter username (without @)
   * @returns User ID or null if not found
   */
  async getUserId(username: string): Promise<string | null> {
    const user = await this.getUserByUsername(username);
    return user?.id || null;
  }
}

// Singleton instance
export const twitterService = new TwitterService();
