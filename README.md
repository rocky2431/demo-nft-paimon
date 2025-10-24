# Paimon.dex

**RWA Launchpad + ve33 DEX + Treasury + HYD Synthetic Asset Protocol**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-orange.svg)](https://github.com/yourusername/paimon-dex)

---

## 🌟 Overview

Paimon.dex is an integrated DeFi protocol that combines **Real World Asset (RWA)** issuance, **ve33 DEX** liquidity provision, and **treasury-backed synthetic assets** into a unified governance flywheel.

**"面向 RWA 的发行、流动性与治理一体化协议"**

### Key Components

| Component | Description |
|-----------|-------------|
| **🚀 RWA Launchpad** | Compliant issuance platform for tokenized real-world assets |
| **💱 ve33 DEX** | Velodrome-style AMM with vote-escrowed governance |
| **🏦 Treasury System** | Collateralized vault backing HYD synthetic asset |
| **💎 HYD Token** | Low-volatility synthetic asset backed by RWA treasury holdings |
| **🎫 veNFT Governance** | Unified voting mechanism across all protocol components |
| **🪙 PAIMON Token** | Platform utility token for incentives and governance |

---

## 🎯 Core Value Proposition

- **Lower Barriers**: Mint HYD against RWA deposits instead of buying full-priced assets
- **Higher Capital Efficiency**: Use HYD in DeFi while retaining RWA exposure
- **Governance Flywheel**: ve voting controls Launchpad listings, Treasury whitelist, and DEX incentives
- **Revenue → Growth Loop**: Protocol fees → Treasury → HYD backing → ve rewards → More activity

---

## 📊 Protocol Flywheel

```
Quality RWA Projects (Launchpad)
           ↓
Users Purchase/Hold RWA
           ↓
Deposit RWA → Treasury → Mint HYD
           ↓
Lock HYD → Receive veNFT (Governance Rights)
           ↓
veNFT Voting:
  • DEX liquidity incentives
  • Launchpad project approvals
  • Treasury asset whitelist
           ↓
Increased Activity → Protocol Revenue
           ↓
Revenue Distribution:
  • 40% ve incentive pools
  • 25% Treasury risk buffer
  • 20% PAIMON buyback/burn
  • 10% HYD stabilizer
  • 5% Operations
           ↓
Reinforces Cycle ↺
```

---

## 🪙 Protocol Tokens

### HYD (Synthetic Asset)
- **Type**: Low-volatility synthetic asset (NOT a stablecoin)
- **Backing**: Treasury RWA holdings (US Treasuries, investment-grade credit, RWA revenue pools)
- **Minting**: Deposit RWA at LTV ratios (T1: 80%, T2: 65%, T3: 50%)
- **Use Cases**: DEX trading, collateral, locked into veNFT for governance

### PAIMON (Platform Token)
- **Purpose**: Ecosystem incentives, fee discounts, governance participation
- **Emissions**: Tied to ve voting results + actual trading volume (anti-farming)
- **Value Capture**: 20% of protocol revenue → buyback & burn

### veNFT (Governance NFT)
- **Mechanism**: Lock HYD for 1 week ~ 4 years → receive voting power
- **Voting Weight**: Linear decay (4 years = 2.00x, 1 year = 1.00x, 1 week = 0.05x)
- **Benefits**: Protocol fee share, incentive allocation control, whitelist voting rights

---

## 🚀 Getting Started

### Prerequisites

```bash
# Node.js & package manager
node >= 18.0.0
npm >= 9.0.0 (or yarn/pnpm)

# Recommended development tools
- Hardhat 2.x (smart contracts)
- Foundry (testing & fuzzing)
- MetaMask or compatible Web3 wallet
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/paimon-dex.git
cd paimon-dex

# Install dependencies
npm install
# or
yarn install
```

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Fill in required values
RPC_URL=https://...                    # Alchemy/Infura RPC endpoint
PRIVATE_KEY=your_private_key_here      # For deployment (NEVER commit!)
ETHERSCAN_API_KEY=your_api_key         # For contract verification
```

### Development

```bash
# Compile smart contracts
npm run compile

# Run tests
npm run test

# Run frontend development server
npm run dev

# Deploy to testnet (Sepolia/Goerli)
npm run deploy:testnet
```

---

## 📁 Project Structure

```
paimon-dex/
├── .ultra/                     # Ultra Builder Pro 3.1 project management
│   ├── config.json            # Project configuration
│   ├── tasks/
│   │   └── tasks.json         # Native task tracking
│   └── docs/
│       ├── prd.md             # 📋 Product Requirements (START HERE!)
│       ├── tech.md            # 🔧 Technical Architecture
│       ├── decisions/         # Architecture Decision Records (ADR)
│       ├── tech-debt/         # Technical debt tracking
│       └── lessons-learned/   # Post-mortem learnings
│
├── contracts/                  # Smart contracts (Solidity)
│   ├── core/
│   │   ├── HYD.sol           # Synthetic asset token
│   │   ├── PAIMON.sol        # Platform utility token
│   │   └── veNFT.sol         # Vote-escrowed NFT
│   ├── treasury/
│   │   ├── Treasury.sol      # Main vault
│   │   ├── RWAPriceOracle.sol
│   │   └── Liquidator.sol
│   ├── dex/
│   │   ├── DEX.sol           # AMM core
│   │   ├── VotingEpoch.sol   # ve33 voting
│   │   └── BribeMarket.sol
│   ├── launchpad/
│   │   └── Launchpad.sol     # RWA issuance platform
│   └── governance/
│       └── GovernanceCoordinator.sol
│
├── scripts/                    # Deployment & utility scripts
├── test/                       # Smart contract tests (Hardhat + Foundry)
├── frontend/                   # Next.js frontend application
│   ├── src/
│   │   ├── app/              # App router pages
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom Web3 hooks
│   │   └── lib/              # Utilities & configs
│   └── public/               # Static assets
├── subgraph/                   # The Graph indexer
└── README.md
```

---

## 📚 Documentation

### Essential Reading

1. **[Product Requirements Document](.ultra/docs/prd.md)** ⭐ START HERE!
   - Complete product vision, features, user stories, roadmap
   - RWA NFT presale details (Phase 1)
   - Protocol flywheel mechanics

2. **[Technical Design Document](.ultra/docs/tech.md)**
   - System architecture & smart contract design
   - Frontend stack & Material Design 3 compliance
   - Security considerations & testing strategy

3. **[Architecture Decisions](.ultra/docs/decisions/)**
   - ADR templates for documenting key technical choices

### Quick Links

- **Tokenomics**: See PRD Section 2 (HYD, PAIMON, veNFT)
- **RWA Asset Tiers**: See PRD Section 3.3 (T1/T2/T3 classifications)
- **Fee Structure**: See PRD Section 4.2 (Revenue flows)
- **Governance Voting**: See PRD Section 3.4 (veNFT mechanics)

---

## 🎬 Phase 1: RWA NFT Presale

### Overview
**3-Month Yield-Bearing Bond Certificate** with convertible options to bootstrap the protocol.

| Parameter | Value |
|-----------|-------|
| Total Supply | 5,000 NFTs |
| Price | 100 USDC per NFT |
| Duration | 90 days |
| Base Yield | 2% APR (~0.5% for 3 months) |
| Remint Yield | 0-8% APR (via ecosystem engagement) |
| Target APR | 6% (range: 2-10%) |

### Maturity Options (Choose One)

1. **Convert to veNFT**: Lock HYD (principal + yield) → Governance rights + fee share
2. **Redeem PAIMON**: Receive PAIMON tokens @ conversion rate → Ecosystem utility
3. **Cash Redemption**: Withdraw principal + accrued yield → Stable exit

**📖 Full Details**: See [PRD Section 8](.ultra/docs/prd.md#8-initial-product-offering-rwa-nft-presale-bond)

---

## 🛠 Tech Stack

### Smart Contracts
- **Language**: Solidity ^0.8.20
- **Framework**: Hardhat 2.x + Foundry
- **Testing**: Hardhat (integration), Foundry (fuzz/invariant), Echidna
- **Auditing**: Trail of Bits, OpenZeppelin, Consensys Diligence (planned)
- **Standards**: ERC-20 (HYD, PAIMON), ERC-721 (veNFT, RWA NFT)

### Frontend
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Web3**: wagmi v2 + viem (type-safe Ethereum interactions)
- **UI Library**: Material-UI (MUI) v5 with Material Design 3 compliance
- **Styling**: Tailwind CSS + MUI theming (warm color palette)
- **State**: Zustand + TanStack Query
- **i18n**: next-intl (English + Chinese)

### Infrastructure
- **Indexing**: The Graph (Subgraph for on-chain data)
- **RPC**: Alchemy / Infura
- **Oracles**: Chainlink + Custodian NAV sync
- **Analytics**: Dune Analytics, Vercel Analytics
- **Monitoring**: Forta Network, PagerDuty

---

## 🔒 Security

### Smart Contract Security
- ✅ OpenZeppelin libraries (ReentrancyGuard, AccessControl, Pausable)
- ✅ Dual-oracle pricing (Chainlink + custodian NAV)
- ✅ Deviation circuit breakers (±5% triggers pause)
- ✅ Multi-sig controls (3-of-5 for Treasury, 4-of-7 for emergency pause)
- ✅ Timelock governance (48-hour delay on parameter changes)
- ⏳ External audits planned (pre-mainnet)

### Reporting Vulnerabilities
Please report security vulnerabilities to: **security@paimondex.com**

Bug bounty program via ImmuneFi (coming soon)

---

## 🗺 Roadmap

### Phase 1: Foundation (Months 1-2) ✅ In Progress
- [x] Ultra Builder Pro 3.1 initialization
- [x] Complete PRD & Technical Design
- [ ] Smart contract POC (Treasury, HYD, veNFT, DEX core)
- [ ] Security audit RFP
- [ ] RWA NFT presale launch
- [ ] Frontend MVP (wallet, swap, Treasury deposit)

### Phase 2: Launchpad & Governance (Months 3-4)
- [ ] First RWA project issuance
- [ ] veNFT governance activation
- [ ] HYD minting/redemption live
- [ ] DEX liquidity bootstrapping
- [ ] Analytics dashboard

### Phase 3: Ecosystem Expansion (Months 5-6)
- [ ] Additional RWA asset tiers (T2/T3)
- [ ] Advanced governance (parameter proposals)
- [ ] Liquidation system activation
- [ ] Bribe marketplace
- [ ] Cross-protocol integrations

### Phase 4: Scaling (Months 7-12)
- [ ] Multi-chain deployment (Arbitrum, Base, Optimism)
- [ ] Institutional partnerships
- [ ] Mobile app
- [ ] Legal entity for custody

**Full Roadmap**: See [PRD Section 11](.ultra/docs/prd.md#11-roadmap)

---

## 🧪 Testing

### Run Smart Contract Tests

```bash
# Unit + integration tests (Hardhat)
npm run test

# Coverage report
npm run test:coverage

# Fuzz testing (Foundry)
forge test

# Invariant testing
forge test --mt invariant
```

### Run Frontend Tests

```bash
# Component tests
npm run test:unit

# E2E tests (Playwright)
npm run test:e2e

# Performance tests (Lighthouse CI)
npm run test:perf
```

**Target Coverage**: >95% for smart contracts, >80% for frontend

---

## 🚢 Deployment

### Testnet Deployment

```bash
# Deploy core contracts to Sepolia
npm run deploy:testnet

# Verify on Etherscan
npm run verify:testnet

# Initialize with test parameters
npm run initialize:testnet
```

### Mainnet Deployment Checklist

- [ ] Smart contract audits completed (2+ firms)
- [ ] All critical/high findings resolved
- [ ] Frontend security review
- [ ] Legal opinion on RWA custody structure
- [ ] Insurance coverage for Treasury (>$1M)
- [ ] Multi-sig setup tested
- [ ] Emergency procedures documented
- [ ] Community governance vote passed

**⚠️ IMPORTANT**: Mainnet deployment requires multi-sig approval and gradual rollout.

---

## 🤝 Contributing

We welcome contributions from the community! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm run test`)
5. Commit using conventional commits (`feat:`, `fix:`, `docs:`, etc.)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

**Code Quality Standards**:
- Follow SOLID principles
- Maintain >95% test coverage
- Document all public functions (NatSpec for Solidity)
- Use TypeScript strict mode

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact & Community

- **Website**: https://paimondex.com (coming soon)
- **Twitter**: [@PaimonDex](https://twitter.com/PaimonDex)
- **Discord**: [Join our community](https://discord.gg/paimondex)
- **Telegram**: [Announcements](https://t.me/paimondex)
- **Email**: contact@paimondex.com

---

## 🙏 Acknowledgments

**Inspired by**:
- **Velodrome Finance** (ve33 DEX model)
- **MakerDAO** (CDP collateral system)
- **Ondo Finance** (RWA tokenization)
- **Curve Finance** (veToken governance)

**Built with Ultra Builder Pro 3.1** 🚀

---

## ⚡ Quick Start Commands

```bash
# Development
npm run dev              # Start frontend dev server
npm run compile          # Compile smart contracts
npm run test             # Run all tests

# Deployment
npm run deploy:testnet   # Deploy to Sepolia/Goerli
npm run deploy:mainnet   # Deploy to mainnet (requires multi-sig)

# Documentation
npm run docs:generate    # Generate smart contract docs from NatSpec
npm run docs:serve       # Serve documentation locally

# Utilities
npm run format           # Format code (Prettier + Solhint)
npm run lint             # Lint code
npm run analyze          # Analyze smart contract security (Slither)
```

---

**⚠️ Disclaimer**: This project is in active development. Smart contracts have not been audited. Use at your own risk. RWA investments carry regulatory and market risks. Always do your own research (DYOR).
