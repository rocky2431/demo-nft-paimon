# Paimon Bond Oracle Service

Off-chain oracle service for verifying social tasks (Twitter, Discord, Referral) and generating cryptographic signatures for on-chain Bond NFT reminting.

## Features

- **Twitter Verification**: Verify follows, retweets, likes, mentions, and memes
- **Discord Verification**: Verify server membership, roles, and activity
- **Referral Tracking**: Generate unique referral codes and track clicks/conversions
- **EIP-712 Signatures**: Generate typed data signatures for on-chain verification
- **PostgreSQL Database**: Persistent storage for task completions and referrals
- **Rate Limiting**: Anti-spam protection with configurable limits
- **RESTful API**: Clean HTTP endpoints for all operations

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 14+
- **Blockchain**: ethers.js v6 for EIP-712 signing
- **APIs**: Twitter API v2, Discord API v10
- **Testing**: Jest + ts-jest

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Twitter API v2 credentials (Bearer Token)
- Discord Bot Token
- Oracle wallet private key (for EIP-712 signing)

## Installation

### 1. Clone and Install Dependencies

```bash
cd oracle
npm install
```

### 2. Set Up Database

Create PostgreSQL database:

```bash
createdb paimon_oracle
```

Run schema migration:

```bash
psql -d paimon_oracle -f database/schema.sql
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/paimon_oracle
DB_HOST=localhost
DB_PORT=5432
DB_NAME=paimon_oracle
DB_USER=postgres
DB_PASSWORD=your_password

# Twitter API v2
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret

# Discord API
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_GUILD_ID=your_server_id

# Oracle Wallet (EIP-712 Signing)
ORACLE_PRIVATE_KEY=0x...
ORACLE_ADDRESS=0x...

# Smart Contracts
REMINT_CONTROLLER_ADDRESS_TESTNET=0x...
REMINT_CONTROLLER_ADDRESS_MAINNET=0x...

# Chain IDs
CHAIN_ID_TESTNET=97
CHAIN_ID_MAINNET=56

# CORS
CORS_ORIGIN=http://localhost:3000,https://paimon.xyz
```

## Usage

### Development Mode

Run with hot reload:

```bash
npm run dev
```

### Production Mode

Build and run:

```bash
npm run build
npm start
```

### Run Tests

```bash
npm test
```

## API Endpoints

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "service": "Paimon Bond Oracle"
}
```

---

### Verify Task

Verify a social task and generate EIP-712 signature.

```http
POST /api/verify-task
```

**Request Body:**
```json
{
  "tokenId": 1,
  "taskId": "TWITTER_FOLLOW",
  "userAddress": "0x1234567890123456789012345678901234567890",
  "proof": {
    "type": "twitter",
    "twitterUserId": "123456789",
    "twitterUsername": "alice"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "signature": "0x...",
  "nonce": 1,
  "message": "Task verified successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Task verification failed"
}
```

---

### Generate Referral Code

```http
POST /api/referral/generate
```

**Request Body:**
```json
{
  "ownerAddress": "0x1234567890123456789012345678901234567890",
  "tokenId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "AbCd1234"
  }
}
```

---

### Track Referral Click

```http
POST /api/referral/click
```

**Request Body:**
```json
{
  "code": "AbCd1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Click tracked"
}
```

---

### Get Referral Stats

```http
GET /api/referral/stats/:code
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "AbCd1234",
    "clicks": 100,
    "conversions": 25,
    "conversionRate": 25.0
  }
}
```

---

### Get Referral Leaderboard

```http
GET /api/referral/leaderboard?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "AbCd1234",
      "ownerAddress": "0x...",
      "clicks": 100,
      "conversions": 25,
      "createdAt": "2024-01-15T12:00:00.000Z"
    }
  ]
}
```

---

### Get Task Statistics

```http
GET /api/stats
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "task_type": "TWITTER_FOLLOW",
      "total_completions": 1500,
      "unique_users": 800
    },
    {
      "task_type": "DISCORD_JOIN",
      "total_completions": 1200,
      "unique_users": 600
    }
  ]
}
```

## Task Types

### Twitter Tasks
- `TWITTER_FOLLOW` - Follow @PaimonBond
- `TWITTER_RETWEET` - Retweet a specific tweet
- `TWITTER_LIKE` - Like a specific tweet
- `TWITTER_MENTION` - Mention @PaimonBond in a tweet
- `TWITTER_MEME` - Post a meme with hashtags

### Discord Tasks
- `DISCORD_JOIN` - Join the Discord server
- `DISCORD_ROLE` - Obtain a specific role
- `DISCORD_MESSAGE` - Be active for N days

### Referral Tasks
- `REFERRAL` - Use a valid referral code

## EIP-712 Signature Schema

The oracle generates EIP-712 typed data signatures with the following structure:

```typescript
domain = {
  name: "PaimonBondNFT",
  version: "1",
  chainId: 56 or 97,
  verifyingContract: "0x..." // RemintController address
}

message = {
  tokenId: uint256,
  taskId: bytes32,
  completedAt: uint256,
  nonce: uint256
}
```

## Security Considerations

1. **Private Key Protection**: Store `ORACLE_PRIVATE_KEY` securely (e.g., AWS Secrets Manager)
2. **Rate Limiting**: Default 100 requests per 15 minutes per IP
3. **CORS Configuration**: Whitelist only trusted frontend domains
4. **Database Security**: Use strong passwords and restrict network access
5. **API Key Rotation**: Rotate Twitter/Discord API keys regularly

## Development

### Project Structure

```
oracle/
├── src/
│   ├── config/           # Configuration loader
│   ├── controllers/      # Request handlers
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   │   ├── SignatureService.ts
│   │   ├── TwitterService.ts
│   │   ├── DiscordService.ts
│   │   ├── ReferralService.ts
│   │   └── DatabaseService.ts
│   ├── types/            # TypeScript types
│   ├── __tests__/        # Integration tests
│   └── server.ts         # Express app entry point
├── database/
│   └── schema.sql        # PostgreSQL schema
├── .env.example          # Environment variables template
├── package.json
└── tsconfig.json
```

### Adding New Task Types

1. Add task type to `src/types/index.ts`:
   ```typescript
   export enum TaskType {
     NEW_TASK = 'NEW_TASK',
   }
   ```

2. Create verification method in appropriate service
3. Add handler in `VerificationController.ts`
4. Add test case in `integration.test.ts`

## Deployment

### Docker Deployment (Recommended)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t paimon-oracle .
docker run -p 3001:3001 --env-file .env paimon-oracle
```

### AWS EC2 Deployment

1. Launch Ubuntu 22.04 instance
2. Install Node.js 18+ and PostgreSQL
3. Clone repository and install dependencies
4. Set up `.env` file
5. Run database migration
6. Use PM2 for process management:

```bash
npm install -g pm2
pm2 start dist/server.js --name paimon-oracle
pm2 save
pm2 startup
```

### Monitoring

- **Logs**: Use `pm2 logs` or CloudWatch Logs
- **Metrics**: Monitor API response times and error rates
- **Database**: Monitor connection pool usage and query performance

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -d paimon_oracle -c "SELECT NOW()"
```

### Twitter API Rate Limits

Twitter API v2 has rate limits:
- **User lookup**: 300 requests per 15 minutes
- **Followers**: 15 requests per 15 minutes

Implement caching to reduce API calls.

### Discord Bot Not Responding

Ensure bot has required permissions:
- View Channels
- View Server Members
- Read Message History

## License

MIT

## Support

For issues and questions:
- GitHub Issues: https://github.com/paimon-bond/oracle/issues
- Discord: https://discord.gg/paimonbond
