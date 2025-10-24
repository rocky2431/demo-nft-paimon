#!/usr/bin/env node

/**
 * Environment Setup Verification Script
 * Tests that Hardhat + Foundry development environment is correctly configured
 *
 * This script validates:
 * - package.json with required dependencies
 * - hardhat.config.ts with BSC network configuration
 * - foundry.toml with testing configuration
 * - Basic command availability
 *
 * Exit codes:
 * 0 - All checks passed
 * 1 - One or more checks failed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let passedChecks = 0;
let failedChecks = 0;

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function checkPass(name) {
  log(`✓ ${name}`, GREEN);
  passedChecks++;
}

function checkFail(name, reason) {
  log(`✗ ${name}`, RED);
  log(`  Reason: ${reason}`, YELLOW);
  failedChecks++;
}

console.log('\n=== Paimon.dex Development Environment Verification ===\n');

// Check 1: package.json exists and has required dependencies
try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    checkFail('package.json exists', 'File not found');
  } else {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const requiredDevDeps = [
      'hardhat',
      '@nomicfoundation/hardhat-toolbox',
      '@nomicfoundation/hardhat-verify',
      'dotenv'
    ];

    const missingDeps = requiredDevDeps.filter(dep =>
      !packageJson.devDependencies || !packageJson.devDependencies[dep]
    );

    if (missingDeps.length > 0) {
      checkFail('package.json has required dependencies', `Missing: ${missingDeps.join(', ')}`);
    } else {
      checkPass('package.json exists with required dependencies');
    }
  }
} catch (error) {
  checkFail('package.json readable', error.message);
}

// Check 2: hardhat.config.ts exists and configured for BSC
try {
  const hardhatConfigPath = path.join(process.cwd(), 'hardhat.config.ts');
  if (!fs.existsSync(hardhatConfigPath)) {
    checkFail('hardhat.config.ts exists', 'File not found');
  } else {
    const configContent = fs.readFileSync(hardhatConfigPath, 'utf8');

    // Check for BSC testnet configuration
    const hasBscTestnet = configContent.includes('bscTestnet') && configContent.includes('97');
    // Check for BSC mainnet configuration
    const hasBscMainnet = configContent.includes('bsc') && configContent.includes('56');
    // Check for etherscan API key config (case-insensitive for bscscan)
    const hasEtherscanConfig = configContent.includes('apiKey') && configContent.toLowerCase().includes('bscscan');

    if (!hasBscTestnet) {
      checkFail('hardhat.config.ts has BSC Testnet (chainId 97)', 'Configuration not found');
    } else {
      checkPass('hardhat.config.ts has BSC Testnet configuration');
    }

    if (!hasBscMainnet) {
      checkFail('hardhat.config.ts has BSC Mainnet (chainId 56)', 'Configuration not found');
    } else {
      checkPass('hardhat.config.ts has BSC Mainnet configuration');
    }

    if (!hasEtherscanConfig) {
      checkFail('hardhat.config.ts has BscScan API config', 'Configuration not found');
    } else {
      checkPass('hardhat.config.ts has BscScan API configuration');
    }
  }
} catch (error) {
  checkFail('hardhat.config.ts readable', error.message);
}

// Check 3: foundry.toml exists
try {
  const foundryConfigPath = path.join(process.cwd(), 'foundry.toml');
  if (!fs.existsSync(foundryConfigPath)) {
    checkFail('foundry.toml exists', 'File not found');
  } else {
    const configContent = fs.readFileSync(foundryConfigPath, 'utf8');

    // Check for important Foundry settings
    const hasSrcConfig = configContent.includes('src') || configContent.includes('contracts');
    const hasTestConfig = configContent.includes('test');

    if (!hasSrcConfig || !hasTestConfig) {
      checkFail('foundry.toml has src/test paths', 'Configuration incomplete');
    } else {
      checkPass('foundry.toml exists with proper configuration');
    }
  }
} catch (error) {
  checkFail('foundry.toml readable', error.message);
}

// Check 4: .env.example exists
try {
  const envExamplePath = path.join(process.cwd(), '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    checkFail('.env.example exists', 'File not found');
  } else {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');

    const requiredVars = ['PRIVATE_KEY', 'BSCSCAN_API_KEY', 'BSC_RPC_URL'];
    const missingVars = requiredVars.filter(varName => !envContent.includes(varName));

    if (missingVars.length > 0) {
      checkFail('.env.example has required variables', `Missing: ${missingVars.join(', ')}`);
    } else {
      checkPass('.env.example exists with required variables');
    }
  }
} catch (error) {
  checkFail('.env.example readable', error.message);
}

// Check 5: node_modules exists (dependencies installed)
try {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    checkFail('node_modules exists (npm install run)', 'Directory not found');
  } else {
    checkPass('node_modules exists (dependencies installed)');
  }
} catch (error) {
  checkFail('node_modules check', error.message);
}

// Check 6: Forge command available (OPTIONAL)
try {
  execSync('forge --version', { stdio: 'pipe' });
  checkPass('forge command available (optional)');
} catch (error) {
  log(`⚠ forge command not available (optional)`, YELLOW);
  log(`  Note: Foundry is optional - Hardhat is the primary tool`, YELLOW);
}

// Check 7: contracts directory structure
try {
  const contractsDirPath = path.join(process.cwd(), 'contracts');
  if (!fs.existsSync(contractsDirPath)) {
    checkFail('contracts/ directory exists', 'Directory not found');
  } else {
    checkPass('contracts/ directory exists');
  }
} catch (error) {
  checkFail('contracts/ directory check', error.message);
}

// Check 8: test directory structure
try {
  const testDirPath = path.join(process.cwd(), 'test');
  if (!fs.existsSync(testDirPath)) {
    checkFail('test/ directory exists', 'Directory not found');
  } else {
    checkPass('test/ directory exists');
  }
} catch (error) {
  checkFail('test/ directory check', error.message);
}

// Summary
console.log('\n=== Verification Summary ===');
log(`Passed: ${passedChecks}`, GREEN);
log(`Failed: ${failedChecks}`, RED);
console.log('===========================\n');

if (failedChecks > 0) {
  log('❌ Environment setup verification FAILED', RED);
  log('Run the setup process to fix these issues.', YELLOW);
  process.exit(1);
} else {
  log('✅ Environment setup verification PASSED', GREEN);
  log('Development environment is ready!', GREEN);
  process.exit(0);
}
