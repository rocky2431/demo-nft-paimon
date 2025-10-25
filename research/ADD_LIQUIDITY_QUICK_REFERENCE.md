# 添加流动性快速参考卡片

> 📘 完整文档: [ADD_LIQUIDITY_RESEARCH.md](./ADD_LIQUIDITY_RESEARCH.md)

---

## 🚀 快速开始（5 分钟）

### 1. 最小可行代码

```typescript
import { ethers } from 'ethers';
import { IPancakeRouter02__factory } from '../typechain-types';

// PancakeSwap Router 地址
const ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';  // BSC Mainnet

async function addLiquidity(
  tokenA: string,
  tokenB: string,
  amountA: bigint,
  amountB: bigint,
  signer: Signer
) {
  const router = IPancakeRouter02__factory.connect(ROUTER, signer);

  // 1. Approve Token A
  const tokenAContract = new ethers.Contract(tokenA, ERC20_ABI, signer);
  await tokenAContract.approve(ROUTER, amountA);

  // 2. Approve Token B
  const tokenBContract = new ethers.Contract(tokenB, ERC20_ABI, signer);
  await tokenBContract.approve(ROUTER, amountB);

  // 3. 添加流动性
  const deadline = Math.floor(Date.now() / 1000) + 1200;  // 20 分钟
  const slippage = 0.5;  // 0.5%
  const minA = amountA * 995n / 1000n;
  const minB = amountB * 995n / 1000n;

  const tx = await router.addLiquidity(
    tokenA,
    tokenB,
    amountA,
    amountB,
    minA,
    minB,
    await signer.getAddress(),
    deadline
  );

  return await tx.wait();
}
```

---

## 📐 核心公式速查

### LP Token 计算

```typescript
// 首次添加流动性
const liquidity = sqrt(amount0 * amount1) - 1000n;

// 后续添加流动性
const liquidity = min(
  (amount0 * totalSupply) / reserve0,
  (amount1 * totalSupply) / reserve1
);

// 辅助函数：整数平方根
function sqrt(x: bigint): bigint {
  if (x < 2n) return x;
  let z = x, y = x / 2n + 1n;
  while (y < z) { z = y; y = (x / y + y) / 2n; }
  return z;
}
```

### 计算 Token B 数量

```typescript
// 根据 Token A 计算 Token B
const amountB = (amountA * reserveB) / reserveA;

// 或使用 Router 的 quote 函数
const amountB = await router.quote(amountA, reserveA, reserveB);
```

### 滑点保护

```typescript
// 计算最小接受数量
function calculateMin(amount: bigint, slippagePercent: number): bigint {
  const bps = BigInt(Math.floor(slippagePercent * 100));
  return (amount * (10000n - bps)) / 10000n;
}

// 示例
const amountMin = calculateMin(ethers.parseEther("1000"), 0.5);
// 结果: 995 tokens (0.5% 滑点)
```

---

## 🎯 合约函数签名

### PancakeSwap V2 / Uniswap V2

```solidity
// 添加 ERC20/ERC20 流动性
function addLiquidity(
    address tokenA,
    address tokenB,
    uint amountADesired,
    uint amountBDesired,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
) external returns (uint amountA, uint amountB, uint liquidity);

// 添加 ERC20/BNB 流动性
function addLiquidityETH(
    address token,
    uint amountTokenDesired,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline
) external payable returns (uint amountToken, uint amountETH, uint liquidity);

// 获取储备量
function getReserves() external view returns (
    uint112 reserve0,
    uint112 reserve1,
    uint32 blockTimestampLast
);

// 计算等价数量
function quote(uint amountA, uint reserveA, uint reserveB)
    external pure returns (uint amountB);
```

### Velodrome Finance (扩展)

```solidity
// 预览添加流动性（无需实际执行）
function quoteAddLiquidity(
    address tokenA,
    address tokenB,
    bool stable,           // 🆕 稳定池标志
    address _factory,      // 🆕 Factory 地址
    uint256 amountADesired,
    uint256 amountBDesired
) external view returns (uint256 amountA, uint256 amountB, uint256 liquidity);

// 添加流动性（Velodrome 版本）
function addLiquidity(
    address tokenA,
    address tokenB,
    bool stable,           // 🆕 稳定池标志
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
```

---

## 🔒 安全检查清单

### ✅ 必做项

- [ ] **精确授权**: 避免 `approve(MaxUint256)`，使用实际需要的数量
- [ ] **Deadline 保护**: 设置合理的过期时间（推荐 20 分钟）
- [ ] **滑点验证**: 0.1% - 5% 之间（稳定币对用 0.1-0.5%）
- [ ] **余额检查**: 提交前验证用户余额是否足够
- [ ] **错误处理**: 捕获 `EXPIRED`, `INSUFFICIENT_OUTPUT_AMOUNT` 等错误

### ⚠️ 常见陷阱

```typescript
// ❌ 错误做法
await token.approve(ROUTER, ethers.MaxUint256);  // 无限授权
const deadline = Date.now() + 86400000;          // 使用毫秒而非秒
const amountMin = 0n;                            // 无滑点保护

// ✅ 正确做法
await token.approve(ROUTER, amountDesired);      // 精确授权
const deadline = Math.floor(Date.now() / 1000) + 1200;  // Unix 时间戳
const amountMin = amountDesired * 995n / 1000n;  // 0.5% 滑点
```

---

## 🎨 UI 组件速查

### 双币输入框

```tsx
<div className="token-input">
  <input
    type="number"
    value={amountA}
    onChange={(e) => setAmountA(e.target.value)}
    placeholder="0.0"
  />
  <button className="token-selector">
    <img src={tokenA.logo} />
    <span>{tokenA.symbol}</span>
  </button>
</div>

<div className="price-ratio">
  1 {tokenA.symbol} = {(reserveB / reserveA).toFixed(6)} {tokenB.symbol}
</div>

<div className="token-input calculated">
  <input
    type="number"
    value={amountB}
    readOnly
    placeholder="0.0"
  />
  {/* ... */}
</div>
```

### 滑点设置

```tsx
const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0, 3.0];

<div className="slippage-settings">
  {SLIPPAGE_OPTIONS.map(percent => (
    <button
      className={slippage === percent ? 'active' : ''}
      onClick={() => setSlippage(percent)}
    >
      {percent}%
    </button>
  ))}
</div>
```

### 进度追踪

```tsx
enum Step {
  APPROVE_A = 'approve_a',
  APPROVE_B = 'approve_b',
  ADD_LIQUIDITY = 'add_liquidity',
  DONE = 'done',
}

<div className="progress">
  {Object.values(Step).map(s => (
    <div className={`step ${step === s ? 'active' : ''}`}>
      {step === s ? <Spinner /> : <CheckCircle />}
      <span>{STEP_LABELS[s]}</span>
    </div>
  ))}
</div>
```

---

## 🧪 测试用例模板

```typescript
describe("Add Liquidity", () => {
  it("应该计算正确的 LP Token 数量", async () => {
    const amountA = ethers.parseEther("100000");
    const amountB = ethers.parseEther("100000");

    const liquidity = sqrt(amountA * amountB) - 1000n;

    expect(liquidity).to.equal(ethers.parseEther("100000").sub(1000));
  });

  it("应该执行滑点保护", async () => {
    const amount = ethers.parseEther("1000");
    const slippage = 0.5;

    const amountMin = (amount * 995n) / 1000n;

    expect(amountMin).to.equal(ethers.parseEther("995"));
  });

  it("应该在余额不足时失败", async () => {
    const insufficientAmount = ethers.parseEther("1000000");

    await expect(
      addLiquidity(tokenA, tokenB, insufficientAmount, insufficientAmount)
    ).to.be.revertedWith("insufficient funds");
  });
});
```

---

## 📊 常见场景参数

### 稳定币对 (USDC/USDT)

```typescript
const params = {
  amountA: ethers.parseUnits("10000", 6),   // 10K USDC (6 decimals)
  amountB: ethers.parseUnits("10000", 6),   // 10K USDT (6 decimals)
  slippage: 0.1,                            // 0.1% 滑点
  deadline: now + 1200,                      // 20 分钟
  stable: true,                              // Velodrome 稳定池
};
```

### 主流币对 (ETH/USDC)

```typescript
const params = {
  amountA: ethers.parseEther("5"),          // 5 ETH
  amountB: ethers.parseUnits("10000", 6),   // 10K USDC
  slippage: 1.0,                            // 1% 滑点
  deadline: now + 1200,
  stable: false,                             // Velodrome 波动池
};
```

### 高波动性币对 (新币/USDC)

```typescript
const params = {
  amountA: ethers.parseEther("1000000"),    // 1M 新币
  amountB: ethers.parseUnits("10000", 6),   // 10K USDC
  slippage: 5.0,                            // 5% 滑点
  deadline: now + 600,                       // 10 分钟（更短）
  stable: false,
};
```

---

## 🔗 合约地址速查

### PancakeSwap (BSC)

```typescript
const PANCAKE_BSC = {
  ROUTER_MAINNET: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  ROUTER_TESTNET: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
  FACTORY_MAINNET: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  FACTORY_TESTNET: '0x6725F303b657a9451d8BA641348b6761A6CC7a17',
};
```

### Velodrome (Optimism)

```typescript
const VELODROME_OPTIMISM = {
  ROUTER_V2: '0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858',
  FACTORY: '0x25CbdDb98b35ab1FF77413456B31EC81A6B6B746',
  UNIVERSAL_ROUTER: '0xf132bdb9573867cd72f2585c338b923f973eb817',
};
```

### Uniswap V2 (Ethereum)

```typescript
const UNISWAP_V2_ETHEREUM = {
  ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  FACTORY: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
};
```

---

## 🐛 错误代码速查

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `PancakeRouter: EXPIRED` | Deadline 已过期 | 增加 deadline 时间 |
| `PancakeRouter: INSUFFICIENT_OUTPUT_AMOUNT` | 滑点保护触发 | 增加滑点容忍度 |
| `PancakeRouter: INSUFFICIENT_A_AMOUNT` | Token A 数量不足 | 调整输入数量 |
| `PancakeRouter: INSUFFICIENT_B_AMOUNT` | Token B 数量不足 | 调整输入数量 |
| `TransferHelper: TRANSFER_FROM_FAILED` | Approve 不足 | 检查 allowance |
| `insufficient funds` | 钱包余额不足 | 充值或减少数量 |
| `user rejected transaction` | 用户取消签名 | - |

---

## 📚 相关资源

- 📘 [完整研究报告](./ADD_LIQUIDITY_RESEARCH.md)
- 🔗 [PancakeSwap Docs](https://docs.pancakeswap.finance/)
- 🔗 [Uniswap V2 Docs](https://docs.uniswap.org/contracts/v2/overview)
- 🔗 [Velodrome Docs](https://docs.velodrome.finance/)
- 🛠️ [wagmi Hooks](https://wagmi.sh/)
- 🧰 [ethers.js Docs](https://docs.ethers.org/)

---

**最后更新**: 2025-10-25
**版本**: v1.0

💡 **提示**: 开发时将此文档固定在侧边栏，随时查阅！
