# demo-nft-paimon

**Type**: Blockchain/NFT Project
**Version**: 0.1.0
**Created**: 2025-10-24

---

## Overview

NFT project powered by Paimon.dex

<!-- Add a brief description of your NFT project here -->

---

## Features

- [ ] NFT Minting (ERC-721/ERC-1155)
- [ ] Wallet Integration (MetaMask/WalletConnect)
- [ ] Metadata Storage (IPFS/Arweave)
- [ ] Smart Contract Security
- [ ] Responsive UI (Material Design 3 compliant)

---

## Tech Stack

### Blockchain
- **Smart Contracts**: <!-- Solidity, Hardhat/Foundry -->
- **Network**: <!-- Ethereum, Polygon, Base, etc. -->
- **Token Standard**: <!-- ERC-721, ERC-1155 -->

### Frontend
- **Framework**: <!-- React, Next.js, Vue -->
- **Web3 Library**: <!-- ethers.js, viem, wagmi -->
- **UI Library**: <!-- MUI, Ant Design (required per guidelines) -->

### Infrastructure
- **Metadata Storage**: <!-- IPFS, Arweave -->
- **RPC Provider**: <!-- Alchemy, Infura, QuickNode -->

---

## Getting Started

### Prerequisites

```bash
# Node.js version
node >= 18.0.0

# Package manager
npm >= 9.0.0
# or
yarn >= 1.22.0
```

### Installation

```bash
# Clone the repository (if applicable)
git clone <repository-url>
cd demo-nft-paimon

# Install dependencies
npm install
# or
yarn install
```

### Configuration

1. Copy environment variables template:
   ```bash
   cp .env.example .env
   ```

2. Fill in required values:
   ```env
   # RPC Provider
   RPC_URL=https://...

   # Private key (for deployment - NEVER commit!)
   PRIVATE_KEY=your_private_key_here

   # Contract addresses (after deployment)
   NFT_CONTRACT_ADDRESS=
   ```

### Development

```bash
# Run local development server (frontend)
npm run dev

# Compile smart contracts
npm run compile

# Run tests
npm run test

# Deploy to testnet
npm run deploy:testnet
```

---

## Project Structure

```
demo-nft-paimon/
├── .ultra/                  # Ultra Builder Pro 3.1 project management
│   ├── config.json         # Project configuration
│   ├── tasks/              # Native task management
│   │   └── tasks.json      # Task tracking
│   └── docs/               # Documentation
│       ├── prd.md          # Product requirements
│       ├── tech.md         # Technical design
│       ├── decisions/      # Architecture decisions (ADR)
│       ├── tech-debt/      # Technical debt tracking
│       └── lessons-learned/ # Post-mortem learnings
├── contracts/              # Smart contracts (Solidity)
├── scripts/                # Deployment & utility scripts
├── test/                   # Smart contract tests
├── frontend/               # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks (Web3)
│   │   └── utils/         # Utilities
│   └── public/            # Static assets
└── README.md
```

---

## Next Steps

### 1. Define Requirements
Fill out the Product Requirements Document:
```bash
# Edit the PRD template
open .ultra/docs/prd.md
```

### 2. Generate Tasks
Once PRD is complete, generate development tasks:
```bash
/ultra-plan
```

### 3. Start Development
Begin agile development with task tracking:
```bash
/ultra-dev
```

### 4. Monitor Progress
Check project status anytime:
```bash
/ultra-status
```

---

## Documentation

- **PRD**: `.ultra/docs/prd.md` - Product requirements and features
- **Tech Design**: `.ultra/docs/tech.md` - Technical architecture
- **Decisions**: `.ultra/docs/decisions/` - Architecture decision records
- **Tech Debt**: `.ultra/docs/tech-debt/` - Technical debt tracking

---

## Testing

### Smart Contract Tests
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test test/NFT.test.js
```

### Frontend Tests
```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e
```

---

## Deployment

### Testnet Deployment
```bash
# Deploy to Sepolia/Goerli/Mumbai
npm run deploy:testnet

# Verify contract on Etherscan
npm run verify:testnet
```

### Mainnet Deployment
⚠️ **Pre-deployment checklist**:
- [ ] Smart contract audit completed
- [ ] All tests passing (coverage >95%)
- [ ] Gas optimization complete
- [ ] Emergency procedures documented
- [ ] Metadata backup verified

```bash
npm run deploy:mainnet
```

---

## Security

- Smart contract audit: **Pending** / **Completed by [Auditor]**
- Bug bounty program: **No** / **Yes - [Link]**
- Emergency contacts: [Contact info]

### Reporting Vulnerabilities
Please report security vulnerabilities to: [security@example.com]

---

## Contributing

<!-- Add contribution guidelines if this is a team project -->

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using conventional commits
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

[MIT License](LICENSE) / [Apache 2.0](LICENSE) / Other

---

## Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [ethers.js Documentation](https://docs.ethers.org/)
- [IPFS Documentation](https://docs.ipfs.tech/)

---

## Contact

- **Project Lead**: [Name]
- **Email**: [email@example.com]
- **Discord**: [Discord server invite]
- **Twitter**: [@project_handle]

---

**Built with Ultra Builder Pro 3.1** 🚀
