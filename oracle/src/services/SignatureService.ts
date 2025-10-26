/**
 * EIP-712 Signature Service
 * Generates typed signatures for social task verification
 */

import { ethers } from 'ethers';
import { config } from '../config';
import { EIP712Domain, TaskVerificationMessage, EIP712TypedData } from '../types';

export class SignatureService {
  private wallet: ethers.Wallet;
  private chainId: number;
  private verifyingContract: string;

  constructor(chainId: number = config.chainIds.testnet) {
    // Initialize wallet from private key
    this.wallet = new ethers.Wallet(config.oracle.privateKey);
    this.chainId = chainId;

    // Get contract address based on chain ID
    this.verifyingContract =
      chainId === config.chainIds.mainnet
        ? config.contracts.remintControllerMainnet
        : config.contracts.remintControllerTestnet;

    console.log(`🔐 SignatureService initialized`);
    console.log(`   Chain ID: ${this.chainId}`);
    console.log(`   Oracle Address: ${this.wallet.address}`);
    console.log(`   Verifying Contract: ${this.verifyingContract}`);
  }

  /**
   * Get EIP-712 Domain
   */
  private getDomain(): EIP712Domain {
    return {
      name: 'PaimonBondNFT',
      version: '1',
      chainId: this.chainId,
      verifyingContract: this.verifyingContract,
    };
  }

  /**
   * Get EIP-712 Types
   */
  private getTypes() {
    return {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      TaskVerification: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'taskId', type: 'bytes32' },
        { name: 'completedAt', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
      ],
    };
  }

  /**
   * Sign task verification
   * @param tokenId - Bond NFT token ID
   * @param taskId - Task identifier (as bytes32)
   * @param nonce - Unique nonce for replay protection
   * @returns EIP-712 signature
   */
  async signTaskVerification(
    tokenId: number,
    taskId: string,
    nonce: number
  ): Promise<{ signature: string; messageHash: string }> {
    const completedAt = Math.floor(Date.now() / 1000); // Unix timestamp

    // Convert taskId to bytes32 if it's a string
    const taskIdBytes32 = ethers.id(taskId); // keccak256 hash of taskId string

    const domain = this.getDomain();
    const types = this.getTypes();

    const message: TaskVerificationMessage = {
      tokenId,
      taskId: taskIdBytes32,
      completedAt,
      nonce,
    };

    const typedData: EIP712TypedData = {
      types,
      primaryType: 'TaskVerification',
      domain,
      message,
    };

    // Sign using ethers v6 TypedDataEncoder
    const signature = await this.wallet.signTypedData(domain, { TaskVerification: types.TaskVerification }, message);

    // Calculate message hash for logging/verification
    const messageHash = ethers.TypedDataEncoder.hash(
      domain,
      { TaskVerification: types.TaskVerification },
      message
    );

    console.log(`📝 Signed task verification:`);
    console.log(`   Token ID: ${tokenId}`);
    console.log(`   Task ID: ${taskId} → ${taskIdBytes32}`);
    console.log(`   Nonce: ${nonce}`);
    console.log(`   Message Hash: ${messageHash}`);
    console.log(`   Signature: ${signature}`);

    return { signature, messageHash };
  }

  /**
   * Verify signature (for testing)
   */
  async verifySignature(
    tokenId: number,
    taskId: string,
    nonce: number,
    signature: string
  ): Promise<boolean> {
    try {
      const completedAt = Math.floor(Date.now() / 1000);
      const taskIdBytes32 = ethers.id(taskId);

      const domain = this.getDomain();
      const types = this.getTypes();

      const message: TaskVerificationMessage = {
        tokenId,
        taskId: taskIdBytes32,
        completedAt,
        nonce,
      };

      // Recover signer address
      const recoveredAddress = ethers.verifyTypedData(
        domain,
        { TaskVerification: types.TaskVerification },
        message,
        signature
      );

      const isValid = recoveredAddress.toLowerCase() === this.wallet.address.toLowerCase();

      console.log(`✅ Signature verification: ${isValid ? 'VALID' : 'INVALID'}`);
      console.log(`   Expected: ${this.wallet.address}`);
      console.log(`   Recovered: ${recoveredAddress}`);

      return isValid;
    } catch (error) {
      console.error('❌ Signature verification error:', error);
      return false;
    }
  }

  /**
   * Get oracle address
   */
  getOracleAddress(): string {
    return this.wallet.address;
  }
}

// Singleton instance
export const signatureService = new SignatureService();
