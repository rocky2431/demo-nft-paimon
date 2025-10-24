import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable Yul IR-based code generation for better optimization
    },
  },
  networks: {
    // BSC Testnet (ChainID: 97)
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 10000000000, // 10 Gwei
    },
    // BSC Mainnet (ChainID: 56)
    bsc: {
      url: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 3000000000, // 3 Gwei
    },
    // Hardhat local network
    hardhat: {
      chainId: 31337,
      forking: process.env.FORK_MAINNET === "true"
        ? {
            url: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/",
            blockNumber: process.env.FORK_BLOCK_NUMBER
              ? parseInt(process.env.FORK_BLOCK_NUMBER)
              : undefined,
          }
        : undefined,
    },
  },
  // BscScan API configuration for contract verification
  etherscan: {
    apiKey: {
      bsc: process.env.BSCSCAN_API_KEY || "", // BSC Mainnet
      bscTestnet: process.env.BSCSCAN_API_KEY || "", // BSC Testnet
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: process.env.REPORT_GAS_FILE || undefined,
    noColors: !!process.env.REPORT_GAS_FILE,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 60000, // 60 seconds for tests
  },
};

export default config;
