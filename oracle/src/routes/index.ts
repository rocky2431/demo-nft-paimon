/**
 * API Routes
 * Defines all HTTP endpoints for the Oracle service
 */

import { Router } from 'express';
import { verificationController } from '../controllers/VerificationController';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Paimon Bond Oracle',
  });
});

// Task verification endpoint
router.post('/verify-task', (req, res) => verificationController.verifyTask(req, res));

// Referral endpoints
router.post('/referral/generate', (req, res) => verificationController.generateReferralCode(req, res));
router.post('/referral/click', (req, res) => verificationController.trackReferralClick(req, res));
router.get('/referral/stats/:code', (req, res) => verificationController.getReferralStats(req, res));
router.get('/referral/leaderboard', (req, res) => verificationController.getReferralLeaderboard(req, res));

// Statistics endpoint
router.get('/stats', (req, res) => verificationController.getTaskStats(req, res));

export default router;
