/**
 * Database Service
 * PostgreSQL connection and query layer
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../config';
import { TaskCompletion, ReferralCode, TaskType } from '../types';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    // Initialize PostgreSQL connection pool
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection on initialization
    this.testConnection();

    console.log('💾 DatabaseService initialized');
    console.log(`   Host: ${config.database.host}:${config.database.port}`);
    console.log(`   Database: ${config.database.name}`);
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connection successful');
    } catch (error: any) {
      console.error('❌ Database connection failed:', error.message);
      throw new Error('Failed to connect to PostgreSQL database');
    }
  }

  /**
   * Save task completion to database
   */
  async saveTaskCompletion(
    tokenId: number,
    taskId: string,
    userAddress: string,
    taskType: TaskType,
    proofData: Record<string, any>,
    signature: string,
    nonce: number
  ): Promise<void> {
    const query = `
      INSERT INTO task_completions (
        token_id, task_id, user_address, task_type, proof_data, signature, nonce, verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (token_id, task_id) DO NOTHING
    `;

    const values = [tokenId, taskId, userAddress, taskType, JSON.stringify(proofData), signature, nonce, true];

    try {
      await this.pool.query(query, values);
      console.log(`✅ Task completion saved: Token ${tokenId}, Task ${taskId}`);
    } catch (error: any) {
      console.error('❌ Database error (saveTaskCompletion):', error.message);
      throw new Error('Failed to save task completion');
    }
  }

  /**
   * Check if a task has already been completed
   */
  async isTaskCompleted(tokenId: number, taskId: string): Promise<boolean> {
    const query = 'SELECT id FROM task_completions WHERE token_id = $1 AND task_id = $2 LIMIT 1';

    try {
      const result = await this.pool.query(query, [tokenId, taskId]);
      return result.rows.length > 0;
    } catch (error: any) {
      console.error('❌ Database error (isTaskCompleted):', error.message);
      throw new Error('Failed to check task completion');
    }
  }

  /**
   * Get next nonce for a token
   */
  async getNextNonce(tokenId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM task_completions WHERE token_id = $1';

    try {
      const result = await this.pool.query(query, [tokenId]);
      const count = parseInt(result.rows[0].count, 10);
      return count + 1;
    } catch (error: any) {
      console.error('❌ Database error (getNextNonce):', error.message);
      throw new Error('Failed to get next nonce');
    }
  }

  /**
   * Save referral code to database
   */
  async saveReferralCode(code: string, ownerAddress: string, tokenId?: number): Promise<void> {
    const query = `
      INSERT INTO referral_codes (code, owner_address, token_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (code) DO NOTHING
    `;

    try {
      await this.pool.query(query, [code, ownerAddress, tokenId || null]);
      console.log(`✅ Referral code saved: ${code}`);
    } catch (error: any) {
      console.error('❌ Database error (saveReferralCode):', error.message);
      throw new Error('Failed to save referral code');
    }
  }

  /**
   * Track referral click
   */
  async trackReferralClick(code: string, ip: string, userAgent: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Insert click record
      await client.query(
        'INSERT INTO referral_clicks (referral_code, ip_address, user_agent) VALUES ($1, $2, $3)',
        [code, ip, userAgent]
      );

      // Increment clicks counter
      await client.query('UPDATE referral_codes SET clicks = clicks + 1 WHERE code = $1', [code]);

      await client.query('COMMIT');
      console.log(`📊 Referral click tracked: ${code}`);
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('❌ Database error (trackReferralClick):', error.message);
      throw new Error('Failed to track referral click');
    } finally {
      client.release();
    }
  }

  /**
   * Track referral conversion
   */
  async trackReferralConversion(code: string, ip: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Mark most recent click as converted
      await client.query(
        `UPDATE referral_clicks
         SET converted = TRUE, converted_at = NOW()
         WHERE referral_code = $1 AND ip_address = $2 AND converted = FALSE
         ORDER BY clicked_at DESC
         LIMIT 1`,
        [code, ip]
      );

      // Increment conversions counter
      await client.query('UPDATE referral_codes SET conversions = conversions + 1 WHERE code = $1', [code]);

      await client.query('COMMIT');
      console.log(`🎯 Referral conversion tracked: ${code}`);
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('❌ Database error (trackReferralConversion):', error.message);
      throw new Error('Failed to track referral conversion');
    } finally {
      client.release();
    }
  }

  /**
   * Get referral code details
   */
  async getReferralCode(code: string): Promise<ReferralCode | null> {
    const query = 'SELECT * FROM referral_codes WHERE code = $1';

    try {
      const result = await this.pool.query(query, [code]);
      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        code: row.code,
        ownerAddress: row.owner_address,
        tokenId: row.token_id,
        createdAt: row.created_at,
        clicks: row.clicks,
        conversions: row.conversions,
      };
    } catch (error: any) {
      console.error('❌ Database error (getReferralCode):', error.message);
      throw new Error('Failed to get referral code');
    }
  }

  /**
   * Save oracle signature to audit log
   */
  async saveSignature(
    tokenId: number,
    taskId: string,
    messageHash: string,
    signature: string,
    nonce: number
  ): Promise<void> {
    const query = `
      INSERT INTO oracle_signatures (token_id, task_id, message_hash, signature, nonce)
      VALUES ($1, $2, $3, $4, $5)
    `;

    try {
      await this.pool.query(query, [tokenId, taskId, messageHash, signature, nonce]);
      console.log(`📝 Signature logged: Token ${tokenId}, Task ${taskId}`);
    } catch (error: any) {
      console.error('❌ Database error (saveSignature):', error.message);
      // Don't throw - signature logging is non-critical
    }
  }

  /**
   * Get task completion statistics
   */
  async getTaskStats(): Promise<any> {
    const query = `
      SELECT
        task_type,
        COUNT(*) as total_completions,
        COUNT(DISTINCT user_address) as unique_users
      FROM task_completions
      GROUP BY task_type
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error: any) {
      console.error('❌ Database error (getTaskStats):', error.message);
      throw new Error('Failed to get task statistics');
    }
  }

  /**
   * Get referral leaderboard
   */
  async getReferralLeaderboard(limit: number = 100): Promise<ReferralCode[]> {
    const query = `
      SELECT * FROM referral_codes
      ORDER BY conversions DESC, clicks DESC
      LIMIT $1
    `;

    try {
      const result = await this.pool.query(query, [limit]);
      return result.rows.map((row) => ({
        id: row.id,
        code: row.code,
        ownerAddress: row.owner_address,
        tokenId: row.token_id,
        createdAt: row.created_at,
        clicks: row.clicks,
        conversions: row.conversions,
      }));
    } catch (error: any) {
      console.error('❌ Database error (getReferralLeaderboard):', error.message);
      throw new Error('Failed to get referral leaderboard');
    }
  }

  /**
   * Close database connection pool (for graceful shutdown)
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('💾 Database connection pool closed');
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
