# Technical Design Document

**Project**: Paimon.dex
**Version**: 0.1.0 (HYD v1)
**Last Updated**: 2025-10-24

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend DApp                             │
│  (React/Next.js + wagmi/viem + Material UI 3)                   │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             ▼                                    ▼
┌────────────────────────┐          ┌────────────────────────────┐
│  Subgraph/Indexer      │          │   Smart Contracts Layer    │
│  (The Graph)           │◄─────────┤   (Solidity + Hardhat)     │
└────────────────────────┘          └──────────┬─────────────────┘
                                               │
        ┌──────────────────────────────────────┼──────────────────────────────┐
        │                                      │                              │
        ▼                                      ▼                              ▼
┌───────────────┐                  ┌────────────────────┐       ┌───────────────────┐
│ RWA Launchpad │                  │   ve33 DEX         │       │  Treasury System  │
│ - Project     │                  │   - AMM Pools      │       │  - RWA Deposits   │
│   Vetting     │                  │   - Voting Epochs  │       │  - HYD Minting    │
│ - Issuance    │                  │   - Fee Split      │       │  - Liquidations   │
│ - veNFT Vote  │                  │   - Bribes         │       │  - Risk Oracle    │
└───────┬───────┘                  └──────────┬─────────┘       └─────────┬─────────┘
        │                                     │                           │
        └─────────────────┐                   │                           │
                          ▼                   ▼                           ▼
                  ┌───────────────────────────────────────────────────────────┐
                  │           veNFT Governance Coordinator                    │
                  │  - Voting Power Calculation                               │
                  │  - Incentive Distribution                                 │
                  │  - Whitelist Management                                   │
                  └───────────────────────────────────────────────────────────┘
                                              │
                  ┌───────────────────────────┼───────────────────────────┐
                  ▼                           ▼                           ▼
        ┌─────────────────┐        ┌──────────────────┐      ┌────────────────────┐
        │  HYD Token      │        │  PAIMON Token    │      │  veNFT (ERC-721)   │
        │  (ERC-20)       │        │  (ERC-20)        │      │  - Lock HYD        │
        └─────────────────┘        └──────────────────┘      │  - Voting Power    │
                                                              │  - Fee Share       │
                                                              └────────────────────┘
```

### 1.2 Component Overview

| Component | Responsibility | Key Contracts |
|-----------|---------------|---------------|
| **RWA Launchpad** | RWA project issuance, veNFT whitelist voting | `Launchpad.sol`, `ProjectRegistry.sol` |
| **ve33 DEX** | AMM swaps, liquidity pools, ve voting on incentives | `DEX.sol`, `LiquidityPool.sol`, `VotingEpoch.sol` |
| **Treasury** | RWA collateral management, HYD minting/redemption | `Treasury.sol`, `RWAVault.sol`, `Liquidator.sol` |
| **veNFT Governance** | Unified governance, voting power, fee distribution | `veNFT.sol`, `GovernanceCoordinator.sol` |
| **Tokens** | HYD (synthetic), PAIMON (utility), veNFT (governance) | `HYD.sol`, `PAIMON.sol`, `veNFT.sol` |
| **Oracles** | RWA pricing, NAV sync, risk parameters | `RWAPriceOracle.sol`, `NAVAggregator.sol` |

---

## 2. Smart Contract Design

### 2.1 Contract Architecture (Solidity)

#### 2.1.1 Core Token Contracts

**HYD.sol** (ERC-20 Synthetic Asset)
```solidity
// Key Functions
function mint(address to, uint256 amount) external onlyTreasury
function burn(address from, uint256 amount) external onlyTreasury
function transfer(address to, uint256 amount) external returns (bool)

// Access Control
- Only Treasury can mint/burn
- Pausable in emergencies
```

**PAIMON.sol** (ERC-20 Utility Token)
```solidity
// Key Functions
function mint(address to, uint256 amount) external onlyMinter
function burn(uint256 amount) external
function approve(address spender, uint256 amount) external returns (bool)

// Emissions
- Tied to ve voting results
- Buyback & burn from protocol revenue
```

**veNFT.sol** (ERC-721 Vote-Escrowed NFT)
```solidity
// State Variables
struct LockInfo {
    uint256 hydAmount;
    uint256 unlockTime;
    uint256 votingPower;
}
mapping(uint256 => LockInfo) public locks;

// Key Functions
function createLock(uint256 amount, uint256 duration) external returns (uint256 tokenId)
function increaseLock(uint256 tokenId, uint256 additionalAmount) external
function increaseUnlockTime(uint256 tokenId, uint256 newUnlockTime) external
function withdraw(uint256 tokenId) external
function votingPower(uint256 tokenId) external view returns (uint256)

// Voting Power Formula
votingPower = hydAmount * (unlockTime - block.timestamp) / MAX_LOCK_TIME * weightMultiplier
// weightMultiplier: 0.05x (1 week) to 2.00x (4 years)
```

#### 2.1.2 Treasury System

**Treasury.sol** (Main Vault)
```solidity
// State Variables
struct Position {
    address rwaAsset;
    uint256 rwaAmount;
    uint256 hydMinted;
    uint256 collateralRatio; // In basis points (e.g., 8000 = 80%)
}
mapping(address => mapping(address => Position)) public positions; // user => rwa => position

struct AssetTier {
    uint8 tier; // 1, 2, or 3
    uint256 ltvRatio; // 8000 (80%), 6500 (65%), 5000 (50%)
    uint256 mintDiscount; // 200 (2%), 500 (5%), 800 (8%) in basis points
    uint256 singleAssetLimit; // Max per asset type
}
mapping(address => AssetTier) public assetTiers;

// Key Functions
function deposit(address rwaAsset, uint256 amount) external returns (uint256 hydMinted)
function redeem(address rwaAsset, uint256 hydAmount) external returns (uint256 rwaReturned)
function liquidate(address user, address rwaAsset) external
function updateAssetTier(address rwaAsset, AssetTier memory tier) external onlyGovernance

// HYD Minting Formula
hydMinted = (rwaValue * ltvRatio * (10000 - mintDiscount)) / 10000^2
// Example: $1000 RWA, T1 (80% LTV, 2% discount)
// hydMinted = 1000 * 0.80 * 0.98 = 784 HYD
```

**RWAPriceOracle.sol** (Price Feeds)
```solidity
// State Variables
struct PriceSource {
    address chainlinkFeed;
    address custodianNAV; // Off-chain NAV sync
    uint256 lastUpdate;
    uint256 deviationThreshold; // ±5% trigger
}
mapping(address => PriceSource) public priceSources;

// Key Functions
function getPrice(address rwaAsset) external view returns (uint256 price, uint256 timestamp)
function updateNAV(address rwaAsset, uint256 nav) external onlyTrustedOracle
function checkDeviation(address rwaAsset) external view returns (bool exceeded)

// Safety Mechanisms
- Dual-source pricing (on-chain + custodian NAV)
- Deviation circuit breaker (±5% triggers pause)
- Stale price protection (reject >24h old data)
```

**Liquidator.sol** (Undercollateralized Position Handler)
```solidity
// Constants
uint256 public constant LIQUIDATION_THRESHOLD = 11500; // 115%
uint256 public constant LIQUIDATION_PENALTY = 500; // 5%

// Key Functions
function liquidate(address user, address rwaAsset) external returns (uint256 penalty)
function isLiquidatable(address user, address rwaAsset) public view returns (bool)

// Liquidation Logic
// if (rwaValue / hydDebt < 1.15) → Liquidate
// Seize collateral, burn user's HYD, distribute 5% penalty to liquidator + protocol
```

#### 2.1.3 ve33 DEX

**DEX.sol** (AMM Core)
```solidity
// State Variables
struct Pool {
    address token0;
    address token1;
    uint256 reserve0;
    uint256 reserve1;
    uint256 totalLiquidity;
    bool isStable; // Curve type: false = x*y=k, true = stable swap
}
mapping(bytes32 => Pool) public pools; // poolId => Pool

// Key Functions
function swap(address tokenIn, address tokenOut, uint256 amountIn) external returns (uint256 amountOut)
function addLiquidity(address token0, address token1, uint256 amount0, uint256 amount1) external
function removeLiquidity(bytes32 poolId, uint256 liquidity) external
function calculateSwapOutput(bytes32 poolId, address tokenIn, uint256 amountIn) public view returns (uint256)

// Fee Structure
uint256 public constant SWAP_FEE = 25; // 0.25% (in basis points)
// Split: 70% to veNFT voters, 30% to Treasury
```

**VotingEpoch.sol** (ve33 Incentive Voting)
```solidity
// State Variables
struct Epoch {
    uint256 startTime;
    uint256 endTime;
    uint256 totalVotingPower;
    mapping(bytes32 => uint256) poolVotes; // poolId => votes
}
mapping(uint256 => Epoch) public epochs; // epochId => Epoch

// Key Functions
function vote(uint256 veNFTId, bytes32[] memory poolIds, uint256[] memory weights) external
function claimIncentives(uint256 veNFTId) external returns (uint256 paimonReward, uint256 feeShare)

// Incentive Distribution Formula
poolIncentive = totalPAIMONEmissions * (poolVotes / totalVotes)
// Fee share distributed proportionally to veNFT holders who voted for that pool
```

**BribeMarket.sol** (Third-Party Incentives)
```solidity
// State Variables
struct Bribe {
    address token;
    uint256 amount;
    bytes32 poolId;
    uint256 epochId;
}
mapping(uint256 => Bribe[]) public bribes; // epochId => Bribe[]

// Key Functions
function addBribe(bytes32 poolId, uint256 epochId, address token, uint256 amount) external
function claimBribes(uint256 veNFTId, uint256 epochId) external returns (address[] memory tokens, uint256[] memory amounts)
```

#### 2.1.4 RWA Launchpad

**Launchpad.sol** (Project Issuance Platform)
```solidity
// State Variables
struct Project {
    address projectToken;
    uint256 targetRaise;
    uint256 totalRaised;
    uint256 startTime;
    uint256 endTime;
    bool approved; // veNFT vote result
    string metadataURI; // IPFS link to disclosure docs
}
mapping(uint256 => Project) public projects; // projectId => Project

// Key Functions
function submitProject(address token, uint256 target, uint256 duration, string memory metadataURI) external returns (uint256 projectId)
function voteOnProject(uint256 projectId, uint256 veNFTId, bool approve) external
function participate(uint256 projectId, uint256 usdcAmount) external returns (uint256 tokensReceived)

// Issuance Fee
uint256 public constant ISSUANCE_FEE = 100; // 1.0% (in basis points)
// Split: 70% to Treasury, 30% to ve fee pool
```

#### 2.1.5 Governance Coordinator

**GovernanceCoordinator.sol** (Unified Governance)
```solidity
// Voting Scenarios
enum VotingType {
    DEX_INCENTIVES,      // Weekly epoch votes
    LAUNCHPAD_WHITELIST, // Project approval
    TREASURY_WHITELIST,  // RWA asset approval
    PARAMETER_CHANGE     // Fee adjustments, LTV changes
}

struct Proposal {
    VotingType voteType;
    uint256 startTime;
    uint256 endTime;
    uint256 totalVotes;
    bool executed;
    bytes proposalData; // ABI-encoded proposal details
}
mapping(uint256 => Proposal) public proposals;

// Key Functions
function createProposal(VotingType voteType, bytes memory proposalData) external returns (uint256 proposalId)
function castVote(uint256 proposalId, uint256 veNFTId, bool support) external
function executeProposal(uint256 proposalId) external
```

---

## 3. Frontend Architecture

### 3.1 Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Framework** | Next.js 14 (App Router) | SSR/SSG for SEO, React Server Components, built-in routing |
| **Web3** | wagmi v2 + viem | Type-safe Ethereum interactions, React hooks |
| **UI Library** | Material-UI (MUI) v5 | Material Design 3 compliance, warm color customization |
| **State Management** | Zustand + TanStack Query | Lightweight state + server state caching |
| **Styling** | Tailwind CSS + MUI theming | Utility-first + component theming |
| **Charts** | Recharts | Responsive charts for analytics dashboards |
| **i18n** | next-intl | English + Chinese bilingual support |

### 3.2 Key Pages/Routes

```
/                          → Landing page (protocol overview, stats)
/launchpad                 → RWA project listings
/launchpad/:projectId      → Individual project details
/dex                       → Swap interface
/dex/pools                 → Liquidity pools overview
/dex/pools/:poolId         → Pool details & LP management
/treasury                  → Deposit RWA, mint/redeem HYD
/treasury/positions        → User's open positions & health
/governance                → veNFT lock/vote interface
/governance/proposals      → Active & historical proposals
/governance/bribes         → Bribe marketplace
/analytics                 → Protocol metrics, TVL, volume charts
/nft-presale               → RWA NFT presale (Phase 1)
```

### 3.3 Component Hierarchy

```
App
├── Layout
│   ├── Header (WalletConnect, Network selector, i18n toggle)
│   ├── Sidebar (Navigation menu)
│   └── Footer
├── Pages
│   ├── Launchpad
│   │   ├── ProjectCard (RWA project summary)
│   │   ├── ProjectDetails (Full disclosure, participate button)
│   │   └── VotingInterface (veNFT holders only)
│   ├── DEX
│   │   ├── SwapInterface (Token selection, slippage, preview)
│   │   ├── PoolList (All pools, APRs, TVL)
│   │   └── LiquidityManager (Add/remove liquidity)
│   ├── Treasury
│   │   ├── DepositInterface (Select RWA, deposit, mint HYD)
│   │   ├── RedeemInterface (Burn HYD, redeem RWA)
│   │   └── PositionHealth (Collateralization ratio, liquidation risk)
│   ├── Governance
│   │   ├── LockInterface (Create veNFT, increase lock)
│   │   ├── VotingDashboard (Active proposals, voting power)
│   │   └── FeeClaimInterface (Claim trading fees + bribes)
│   └── Analytics
│       ├── TVLChart (Historical TVL by component)
│       ├── VolumeChart (Daily/weekly trading volume)
│       └── RevenueBreakdown (Protocol fees by source)
└── Shared Components
    ├── ConnectButton (WalletConnect integration)
    ├── TransactionModal (Pending/success/error states)
    ├── Tooltip (Educational explanations)
    └── LoadingSpinner
```

### 3.4 Material Design 3 Compliance

**Color Palette** (Warm tones only, no blue/purple):
```javascript
// theme.ts
const theme = createTheme({
  palette: {
    primary: {
      main: '#D84315', // Deep Orange
      light: '#FF6E40',
      dark: '#BF360C',
    },
    secondary: {
      main: '#F57C00', // Amber
      light: '#FFB74D',
      dark: '#E65100',
    },
    background: {
      default: '#FFF8E1', // Cream
      paper: '#FFFFFF',
    },
    text: {
      primary: '#3E2723', // Dark Brown
      secondary: '#6D4C41',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});
```

---

## 4. Data Models

### 4.1 On-Chain Data Structures

**Treasury Position** (indexed by The Graph)
```graphql
type Position @entity {
  id: ID! # user-rwaAsset
  user: Bytes!
  rwaAsset: Bytes!
  rwaAmount: BigInt!
  hydMinted: BigInt!
  collateralRatio: BigInt! # In basis points
  lastUpdate: BigInt! # Timestamp
  isLiquidated: Boolean!
}
```

**veNFT Lock**
```graphql
type VeNFT @entity {
  id: ID! # tokenId
  owner: Bytes!
  hydLocked: BigInt!
  unlockTime: BigInt!
  votingPower: BigInt!
  createdAt: BigInt!
  withdrawnAt: BigInt # null if still active
}
```

**Launchpad Project**
```graphql
type LaunchpadProject @entity {
  id: ID! # projectId
  projectToken: Bytes!
  targetRaise: BigInt!
  totalRaised: BigInt!
  startTime: BigInt!
  endTime: BigInt!
  approved: Boolean!
  metadataURI: String!
  participants: [Participant!]! @derivedFrom(field: "project")
}

type Participant @entity {
  id: ID! # user-projectId
  user: Bytes!
  project: LaunchpadProject!
  usdcContributed: BigInt!
  tokensReceived: BigInt!
}
```

**DEX Pool**
```graphql
type Pool @entity {
  id: ID! # poolId (keccak256 hash of token pair)
  token0: Bytes!
  token1: Bytes!
  reserve0: BigInt!
  reserve1: BigInt!
  totalLiquidity: BigInt!
  isStable: Boolean!
  volumeUSD24h: BigDecimal!
  feesUSD24h: BigDecimal!
  apr: BigDecimal! # Calculated from fees + incentives
}
```

### 4.2 Off-Chain Database Schema (PostgreSQL)

**RWA Metadata** (compliance documents, not on-chain)
```sql
CREATE TABLE rwa_assets (
  address VARCHAR(42) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  tier INT CHECK (tier IN (1, 2, 3)),
  asset_type VARCHAR(50), -- 'treasury_bond', 'real_estate', 'receivables'
  valuation_method TEXT,
  custody_provider VARCHAR(255),
  last_audit_date DATE,
  disclosure_url TEXT, -- IPFS/Arweave link
  created_at TIMESTAMP DEFAULT NOW()
);
```

**User KYC Status** (if required for Launchpad)
```sql
CREATE TABLE user_kyc (
  wallet_address VARCHAR(42) PRIMARY KEY,
  kyc_provider VARCHAR(50), -- 'Synaps', 'Onfido', etc.
  verification_status VARCHAR(20), -- 'pending', 'approved', 'rejected'
  jurisdiction VARCHAR(2), -- ISO country code
  verified_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

---

## 5. API Design

### 5.1 Subgraph Endpoints (The Graph)

**Query: User's Treasury Positions**
```graphql
query GetUserPositions($user: Bytes!) {
  positions(where: { user: $user, isLiquidated: false }) {
    id
    rwaAsset
    rwaAmount
    hydMinted
    collateralRatio
    lastUpdate
  }
}
```

**Query: Active veNFTs**
```graphql
query GetVeNFTs($owner: Bytes!) {
  veNFTs(where: { owner: $owner, withdrawnAt: null }) {
    id
    hydLocked
    unlockTime
    votingPower
  }
}
```

**Query: Pool Analytics**
```graphql
query GetPoolStats($poolId: ID!) {
  pool(id: $poolId) {
    token0
    token1
    reserve0
    reserve1
    volumeUSD24h
    feesUSD24h
    apr
  }
}
```

### 5.2 Backend API (Next.js API Routes)

**GET /api/config/params** (Governance Parameters)
```typescript
// Returns current protocol parameters
interface ConfigResponse {
  treasury: {
    t1LTV: number; // 8000 = 80%
    t2LTV: number;
    t3LTV: number;
    mintFee: number; // 30 = 0.30%
    redeemFee: number;
  };
  dex: {
    swapFee: number; // 25 = 0.25%
    feeToVoters: number; // 70%
    feeToTreasury: number; // 30%
  };
  launchpad: {
    issuanceFee: number; // 100 = 1.0%
  };
}
```

**GET /api/analytics/tvl** (Historical TVL)
```typescript
interface TVLDataPoint {
  timestamp: number;
  tvlUSD: number;
  components: {
    treasury: number;
    dex: number;
    launchpad: number;
  };
}
```

**GET /api/rwa/:address/metadata** (RWA Asset Details)
```typescript
interface RWAMetadata {
  address: string;
  name: string;
  tier: 1 | 2 | 3;
  assetType: string;
  valuationMethod: string;
  custodyProvider: string;
  lastAuditDate: string;
  disclosureURL: string; // IPFS link
}
```

---

## 6. Security Considerations

### 6.1 Smart Contract Security

| Risk | Mitigation Strategy |
|------|-------------------|
| **Reentrancy** | OpenZeppelin `ReentrancyGuard` on all external functions |
| **Oracle Manipulation** | Dual-source pricing (Chainlink + custodian NAV), deviation circuit breaker |
| **Flash Loan Attacks** | Voting power snapshot at epoch start (cannot manipulate mid-epoch) |
| **Governance Attacks** | Timelock (48-hour delay), multi-sig veto power, gradual parameter changes |
| **Integer Overflow** | Solidity >=0.8.0 (built-in overflow checks) |
| **Access Control** | OpenZeppelin `AccessControl` with role-based permissions |

### 6.2 Frontend Security

- **RPC Security**: Use authenticated endpoints (Alchemy/Infura API keys), rate limiting
- **Transaction Simulation**: Use Tenderly API to preview transaction outcomes before signing
- **Phishing Protection**: Verify contract addresses on every interaction, display ENS names
- **XSS Prevention**: Sanitize all user inputs, use Content Security Policy headers
- **Wallet Security**: Recommend hardware wallets for large positions, warn on risky transactions

### 6.3 Operational Security

- **Multi-Sig**: 3-of-5 for Treasury funds, 4-of-7 for governance emergency pause
- **Key Management**: Hardware wallets (Ledger/Trezor) for all multi-sig signers
- **Monitoring**: Real-time alerts for unusual activity (large withdrawals, oracle deviations)
- **Incident Response**: Documented playbook for emergency pause, vulnerability disclosure process

---

## 7. Testing Strategy

### 7.1 Smart Contract Testing

**Unit Tests** (Hardhat + Foundry)
- Test each function in isolation
- Edge cases: zero amounts, max uint256, boundary conditions
- Access control: only authorized roles can call privileged functions
- Target: >95% code coverage

**Integration Tests**
- Full user flows: deposit RWA → mint HYD → lock veNFT → vote → claim rewards
- Multi-contract interactions: DEX swap using HYD, Launchpad purchase → Treasury deposit
- Liquidation scenarios: simulate price drops, verify liquidator receives penalty

**Fuzz Testing** (Echidna/Foundry Invariant Tests)
- Invariants: Total HYD supply ≤ Total RWA collateral value × Max LTV
- Property-based: Random deposit/redeem sequences should never brick the system

**Gas Optimization Tests**
- Benchmark gas costs for common operations (swap, deposit, vote)
- Optimize: batch operations, minimize storage writes, use events instead of storage

### 7.2 Frontend Testing

**Component Tests** (Vitest + React Testing Library)
- Isolated component rendering
- User interactions (button clicks, form inputs)
- Edge cases: disconnected wallet, wrong network

**E2E Tests** (Playwright)
- Critical paths: Connect wallet → Swap tokens → See transaction success
- Governance flow: Create veNFT → Vote on proposal → Claim rewards
- Mobile responsiveness testing

**Performance Tests**
- Lighthouse CI: LCP <2.5s, FID <100ms, CLS <0.1
- Bundle size analysis: <500kb initial JS bundle
- Lazy loading: Route-based code splitting

---

## 8. Deployment Plan

### 8.1 Testnet Deployment (Sepolia/Goerli)

**Phase 1: Core Contracts** (Week 1-2)
```bash
# Deploy sequence
1. HYD.sol
2. PAIMON.sol
3. veNFT.sol
4. Treasury.sol (with mock RWA tokens for testing)
5. DEX.sol + initial pools
6. Launchpad.sol
7. GovernanceCoordinator.sol
```

**Phase 2: Frontend MVP** (Week 3-4)
- Wallet connection (MetaMask, WalletConnect)
- Basic swap interface
- Treasury deposit/mint (using testnet mock RWA)
- veNFT lock interface

**Phase 3: Testing & Iteration** (Week 5-6)
- Community beta testing
- Bug bounty program (ImmuneFi)
- Load testing (simulate 100+ concurrent users)

### 8.2 Mainnet Deployment

**Pre-Deployment Checklist**:
- [ ] Smart contract audit completed (2+ firms)
- [ ] All critical/high findings resolved
- [ ] Frontend security review (penetration testing)
- [ ] Legal opinion on RWA custody structure
- [ ] Insurance coverage for Treasury funds (>$1M)
- [ ] Multi-sig setup tested (3-of-5 minimum)
- [ ] Emergency pause procedures documented

**Deployment Sequence**:
1. Deploy core contracts (HYD, PAIMON, veNFT, Treasury)
2. Initialize with conservative parameters (lower LTV ratios initially)
3. Deploy DEX with restricted pools (whitelist initial pairs)
4. Gradual rollout: Launchpad → veNFT governance → Full DEX
5. Monitor for 48 hours before enabling high-risk features

**Blockchain Selection** (TBD):
- **Option 1**: Ethereum Mainnet (max security, higher gas costs)
- **Option 2**: Arbitrum/Optimism (lower fees, growing DeFi ecosystem)
- **Option 3**: Base (Coinbase L2, institutional-friendly)

---

## 9. Monitoring & Maintenance

### 9.1 Metrics to Track

**Smart Contract Metrics** (Dune Analytics dashboards)
- TVL by component (Treasury, DEX pools, Launchpad)
- HYD supply vs. collateral backing ratio
- Liquidation events (frequency, penalty amounts)
- veNFT voting participation rate
- Protocol revenue by source (fees, yield)

**Frontend Metrics** (Vercel Analytics + PostHog)
- Core Web Vitals (LCP, FID, CLS)
- User retention (D1, D7, D30)
- Transaction success rate
- Most-used features (heatmaps)

**Security Metrics** (Forta Network alerts)
- Large withdrawals (>$100K) from Treasury
- Oracle price deviations (>±5%)
- Unusual voting patterns (whale concentration)
- Smart contract function call anomalies

### 9.2 Alerting & Incident Response

**Critical Alerts** (PagerDuty integration):
- Oracle offline >10 minutes
- Treasury collateral ratio <120% (near liquidation threshold)
- Smart contract pausable triggered
- Multisig transaction pending review

**Incident Response Playbook**:
1. **Oracle Failure**: Activate emergency pause → Switch to backup oracle → Resume after validation
2. **Smart Contract Exploit**: Emergency pause → Assess impact → Prepare governance vote for remedy
3. **Frontend Compromise**: Take down frontend → Investigate breach → Redeploy from verified source

---

## 10. Future Enhancements (Post-v1)

### 10.1 Technical Roadmap

**Q2 2025**: Advanced risk management
- [ ] Dynamic LTV adjustment based on volatility
- [ ] Portfolio-level risk scoring (correlations between RWA types)
- [ ] Insurance fund integration (Nexus Mutual, etc.)

**Q3 2025**: Cross-chain expansion
- [ ] LayerZero/Wormhole bridge for HYD
- [ ] Multi-chain DEX deployment (Arbitrum, Base, Optimism)
- [ ] Unified liquidity (cross-chain swaps)

**Q4 2025**: Institutional features
- [ ] On-chain credit scoring for RWA borrowers
- [ ] Private pools for accredited investors (KYC-gated)
- [ ] API for institutional custody integration

**2026**: Advanced DeFi primitives
- [ ] HYD lending markets (Aave/Compound integration)
- [ ] RWA-backed options/futures
- [ ] Yield optimization vaults (auto-compounding veNFT strategies)

---

## 11. Open Technical Questions

1. **Oracle Architecture**: Should we use Chainlink Functions for custom NAV feeds, or build a custom oracle with multi-sig validation?
2. **Liquidation Bots**: Incentivize public liquidators vs. run protocol-owned bots?
3. **veNFT Transferability**: Should veNFTs be tradable (ERC-721 marketplace) or soulbound?
4. **HYD Peg Mechanism**: Implement active rebalancing (protocol-owned liquidity) or rely on arbitrage?
5. **Gas Optimization**: Is it worth implementing EIP-1559 gas optimization strategies, or accept variable costs?
6. **Scalability**: Should we use zkSync/StarkNet for future L3 deployment, or stick with Optimistic Rollups?

---

## 12. Appendix

### 12.1 Technical Standards
- **Solidity Version**: ^0.8.20 (latest stable)
- **Development Framework**: Hardhat 2.x + Foundry
- **Testing**: Hardhat (integration) + Foundry (fuzz/invariant)
- **Auditing**: Trail of Bits, OpenZeppelin, Consensys Diligence (minimum 2)
- **Linting**: Solhint, Slither (static analysis)
- **Frontend**: Next.js 14, TypeScript 5.x, wagmi v2

### 12.2 Related Documents
- **Product Requirements**: `.ultra/docs/prd.md`
- **Architecture Decisions**: `.ultra/docs/decisions/` (ADRs)
- **API Documentation**: Autogenerated from Swagger/OpenAPI specs
- **Smart Contract Docs**: NatSpec comments → Docgen

---

**Document Status**: Draft v0.1
**Next Review**: After smart contract POC completion
**Technical Owner**: Lead Solidity Engineer + Frontend Architect
