/**
 * Express Server
 * Main entry point for the Oracle service
 */

import express, { Application } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { config, validateConfig } from './config';
import routes from './routes';
import { databaseService } from './services/DatabaseService';

// Validate configuration on startup
validateConfig();

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Paimon Bond Oracle Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      verifyTask: 'POST /api/verify-task',
      generateReferral: 'POST /api/referral/generate',
      trackClick: 'POST /api/referral/click',
      referralStats: 'GET /api/referral/stats/:code',
      leaderboard: 'GET /api/referral/leaderboard',
      taskStats: 'GET /api/stats',
    },
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await databaseService.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log('\n🚀 Paimon Bond Oracle Service started');
  console.log(`   Port: ${PORT}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log('\n✅ Oracle service is ready to accept requests\n');
});

export default app;
