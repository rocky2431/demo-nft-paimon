# Paimon 协议 RWA 债券凭证 NFT（优化版）

> 基于真实债券资产的收益凭证 + ve33 DEX 治理入口

---

## 1. 产品定位

### 1.1 核心定位
- **性质**：RWA 债券收益权代币化凭证
- **底层资产**：已投资的 90 天期债券（50 万 USDC 本金）
- **目标**：为散户提供小额参与 RWA 债券的机会

### 1.2 资产披露
- **债券类型**：[具体类型，如：美国国债 ETF / 稳定币理财产品]
- **托管机构**：[托管方名称]
- **购买时间**：[具体日期]
- **到期时间**：[具体日期]（购买后 90 天）
- **本金规模**：500,000 USDC
- **预期收益**：[债券年化收益率]%

---

## 2. NFT 发行参数

### 2.1 基本参数
- **发行量**：5,000 枚
- **单价**：100 USDC
- **募集总额**：500,000 USDC
- **募集用途**：归还团队垫付的债券购买本金

### 2.2 收益结构（简化版）
**删除 Remint 机制**（原因：简化产品，快速上线）

#### 固定收益
- **收益金额**：5 USDC / NFT（固定）
- **年化收益率**：5% APY × (90/365) = **5 USDC**
- **收益来源**：债券到期还本还息的利息部分
- **总收益支出**：5,000 NFT × 5 USDC = **25,000 USDC**

#### 收益发放时间
- NFT 到期时一次性结算（T+90 天）
- 前提：底层债券已到期并收回本息

---

## 3. 时间线

```
T-30天: 团队用 50 万 USDC 购买债券（90天期）
T+0天:  NFT Presale 开放，募集 50 万 USDC
T+1天:  募集完成，归还团队垫付款
T+60天: 底层债券到期，收回本金 + 利息
T+90天: NFT 到期，用户可选择结算路径
T+97天: 宽限期结束，未操作自动执行默认路径
```

---

## 4. 到期结算（二选一，简化版）

**删除 PAIMON 兑换选项**（原因：代币未流通，简化逻辑）

### 选项 1：转为 veNFT（推荐）

**兑换规则**
- 输入：本金 100 USDC + 收益 5 USDC = **105 USDC**
- 输出：按 1:1 兑换为 **105 HYD** → 锁定为 **veNFT**
- 锁期选择：3 个月 / 6 个月 / 12 个月 / 24 个月 / 48 个月
- 投票权重：按 ve33 标准（锁 4 年 = 1.0x，锁 3 月 = 0.0625x）

**用户权益**
- ✅ 治理权：参与 Gauge 投票，决定 DEX 流动性激励分配
- ✅ 费用分红：获得 70% 的 DEX swap 费用（0.175% of volume）
- ✅ 贿赂收益：接收其他协议的投票激励
- ✅ 增值潜力：HYD 二级市场价格上涨收益

**前提条件**
- ⚠️ 需等待 ve33 DEX 主网上线（预计 T+60 天）
- ⚠️ 锁定期内无法提前解锁

### 选项 2：现金赎回

**赎回规则**
- 赎回金额：本金 100 USDC + 收益 5 USDC = **105 USDC**
- 赎回手续费：**0%**（鼓励持有，简化逻辑）
- 到账时间：7 个工作日（等待底层债券清算）

**适用人群**
- 保守型投资者
- 需要流动性的用户
- 不愿参与 DeFi 治理

### 默认路径（宽限期超时）

**自动执行逻辑**
```solidity
if (block.timestamp > maturityDate + 7 days) {
    // 默认：现金赎回（最保守，避免强制锁定）
    executeRedemption(tokenId);
}
```

**宽限期**：到期后 7 天
**默认选择**：现金赎回 105 USDC（避免强制用户锁定 HYD）

---

## 5. 用户流程

### 5.1 购买 NFT（T+0 天）
```
1. 连接钱包 → MetaMask / Trust Wallet
2. 选择数量 → 1-500 枚（单地址上限）
3. 授权 USDC → approve(RWAPresaleNFT, amount)
4. 支付铸造 → mint(quantity)
5. 接收 NFT → 查看 tokenId 和元数据
```

### 5.2 持有期（T+1 ~ T+89 天）
```
1. 查看收益 → 实时显示累计固定收益（5 USDC）
2. 追踪债券 → 查看底层债券状态（链接到托管方）
3. 接收通知 → 到期前 7 天邮件/Discord 提醒
```

### 5.3 到期结算（T+90 ~ T+97 天）
```
1. 选择路径 → veNFT 转换 OR 现金赎回
2. 确认交易 → 链上执行（Gas 费用 ~0.001 BNB）
3. 接收资产 → veNFT 或 USDC 到账
```

---

## 6. 智能合约架构（简化版）

### 6.1 核心合约

**Contract 1: RWABondNFT.sol**（主合约）
```solidity
// 核心功能
- mint(uint256 quantity) payable                 // 铸造 NFT
- baseYield(uint256 tokenId) view returns(uint256) // 固定 5 USDC
- maturityDate(uint256 tokenId) view returns(uint256) // T+90天
- isMatured(uint256 tokenId) view returns(bool)
```

**Contract 2: SettlementRouter.sol**（结算路由）
```solidity
// 结算选项
- convertToVeNFT(uint256 tokenId, uint256 lockDuration) // 选项1
- redeemCash(uint256 tokenId)                           // 选项2
- executeDefaultPath(uint256 tokenId)                   // 超时默认
```

**删除的合约**（简化）
- ❌ RemintController.sol（无 Remint 机制）
- ❌ YieldCalculator.sol（固定收益，无需复杂计算）

### 6.2 与现有合约集成

**VotingEscrow.sol** - 新增函数
```solidity
// 允许 SettlementRouter 创建锁定
function createLockFromBondNFT(
    address user,
    uint256 hydAmount,    // 105 HYD
    uint256 lockDuration  // 3m-48m
) external onlySettlementRouter returns (uint256 veNFTId);
```

**Treasury.sol** - 新增函数
```solidity
// 接收 NFT 销售款
function receiveBondSales(uint256 amount) external onlyBondNFT;

// 支付现金赎回
function fulfillRedemption(address user, uint256 amount) external onlySettlementRouter;
```

**HYD.sol** - 新增权限
```solidity
// SettlementRouter 需要能够铸造 HYD（用于 veNFT 转换）
// 方案：给 SettlementRouter 授权从 Treasury 转账 HYD
```

---

## 7. 风险披露与合规

### 7.1 投资风险
⚠️ **债券违约风险**
- 底层债券发行方可能违约
- 缓解措施：选择 AAA 级债券 / 美国国债

⚠️ **流动性风险**
- NFT 到期前无二级市场（不可转让）
- 缓解措施：到期时间短（90天）

⚠️ **HYD 价格风险**（选项1）
- 转 veNFT 后，HYD 二级价格可能下跌
- 缓解措施：PSM 维持 1:1 锚定（±2%）

### 7.2 合规披露
✅ **资产托管证明**
- 托管方：[具体机构]
- 托管协议：[链接]
- 审计报告：[每月更新]

✅ **收益来源透明**
- 债券票面利率：[X]%
- NFT 分配收益：5 USDC/NFT
- 协议留存：[Y]%（用于 Treasury 运营）

✅ **监管合规**
- 适用司法辖区：[具体区域]
- KYC 要求：[是否需要]
- 税务申报：用户自行负责

---

## 8. 关键参数表

| 参数 | 数值 | 说明 |
|-----|------|-----|
| **发行参数** | | |
| 总量 | 5,000 枚 | 不可增发 |
| 单价 | 100 USDC | 固定价格 |
| 单地址上限 | 500 枚 | 防止巨鲸垄断 |
| 募集总额 | 500,000 USDC | = 债券本金 |
| **收益参数** | | |
| 固定收益 | 5 USDC / NFT | 不受 Remint 影响 |
| 年化收益率 | ~5% APY | 90天折算 |
| 总收益支出 | 25,000 USDC | 5,000 × 5 |
| **时间参数** | | |
| NFT 期限 | 90 天 | = 债券期限 |
| 宽限期 | 7 天 | 到期后可操作窗口 |
| 债券到期 | T+60 天 | 需早于 NFT 到期 |
| **结算参数** | | |
| veNFT 兑换率 | 1 USDC = 1 HYD | PSM 锚定 |
| 现金赎回费 | 0% | 无手续费 |
| 默认路径 | 现金赎回 | 最保守选择 |

---

## 9. 前端 UI 设计要求

### 9.1 铸造页面（/presale/mint）
**必需元素**
- [ ] 债券资产展示卡（托管方、到期时间、预期收益）
- [ ] 数量选择器（1-500 滑块）
- [ ] 实时计算：总成本 = 数量 × 100 USDC
- [ ] 两步授权流程：1) Approve USDC  2) Mint NFT
- [ ] 铸造进度条 + 成功确认页

**信息披露**
- ⚠️ 风险提示："底层债券可能违约，您可能损失本金"
- ⚠️ 锁定期提示："NFT 90 天内不可转让"
- ✅ 合规声明："已阅读并同意 [服务条款]"

### 9.2 持有仪表盘（/presale/dashboard）
**展示内容**
- [ ] NFT 持有数量 + 总投资额
- [ ] 固定收益累计：5 USDC × 数量
- [ ] 债券状态追踪：
  - 到期倒计时
  - 托管方链接
  - 最新审计报告
- [ ] 到期选项预览：veNFT vs 现金赎回对比

**交互功能**
- [ ] 查看 NFT 元数据（OpenSea 兼容）
- [ ] 接收到期提醒（邮箱/Discord）

### 9.3 结算页面（/presale/settle）
**选项对比表**

| 维度 | veNFT 转换 | 现金赎回 |
|-----|-----------|---------|
| 获得资产 | 105 HYD（锁定） | 105 USDC |
| 流动性 | 锁定期内不可提取 | 7日到账 |
| 收益来源 | DEX 费用分红 + 贿赂 | 无 |
| 风险 | HYD 价格波动 | 无 |
| 适合人群 | DeFi 参与者 | 保守投资者 |

**交互流程**
1. 选择路径（单选）
2. 如果选 veNFT：选择锁期（3m-48m 滑块）
3. 预览收益估算
4. 一键执行（Gas 费预估）
5. 确认页面（Tx Hash + 到账提示）

---

## 10. 开发任务调整

### 10.1 删除的任务（简化）
- ❌ PRESALE-002: RemintController（无 Remint 机制）
- ❌ PRESALE-004: YieldCalculator（固定收益，无需库）
- ❌ PRESALE-008: Yield Dashboard 中的 Remint 进度条

### 10.2 简化的任务
**PRESALE-001: RWA Bond NFT Contract**
- 复杂度：8 → **5**（删除 Remint 逻辑）
- 天数：4 → **2 天**

**PRESALE-003: Settlement Router**
- 复杂度：9 → **6**（只需 2 个选项，不是 3 个）
- 天数：5 → **3 天**

**PRESALE-006: Testing**
- 天数：10 → **5 天**（功能减少一半）

**总开发周期**：
- 原计划：**4 周**（PRESALE-001 to 009）
- 优化后：**2 周**（简化版）

---

## 11. 上线时间线（优化版）

```
Week 1: 智能合约开发 + 测试
  Day 1-2: RWABondNFT.sol
  Day 3-4: SettlementRouter.sol
  Day 5-6: Treasury/VotingEscrow 集成
  Day 7: 单元测试（>90% 覆盖率）

Week 2: 前端开发 + 部署
  Day 1-3: 铸造 UI + 仪表盘
  Day 4-5: 结算 UI
  Day 6: 测试网部署 + 测试
  Day 7: 主网部署

Week 3: NFT Presale 开放
  Day 1-7: 募集 50 万 USDC

Week 13: NFT 到期，用户结算
```

**对比原计划**：
- 原计划：Week 7-10（4周开发）
- 优化后：Week 1-2（**2周开发**）
- **提前 6 周上线** ✅

---

## 12. 成功指标

### 12.1 募资指标
- ✅ 募集 50 万 USDC（100% 完成）
- ✅ 参与地址 >100（去中心化）
- ✅ 平均持有 100 NFT/地址

### 12.2 技术指标
- ✅ 智能合约通过审计（0 Critical/High）
- ✅ Gas 优化：Mint <120K gas, Settle <150K gas
- ✅ 测试覆盖率 >90%

### 12.3 业务指标
- ✅ 到期时 >50% 用户选择转 veNFT（表明对协议的信心）
- ✅ 债券按时还本还息（0 违约）
- ✅ 用户满意度 >4.5/5

---

## 13. FAQ

**Q1: 债券如果违约怎么办？**
A: 我们选择 AAA 级债券 / 美国国债，违约概率极低。如发生违约，将按实际收回金额按比例分配给用户。

**Q2: NFT 可以转让吗？**
A: 不可以。NFT 在到期前锁定不可转让，防止二级市场投机。

**Q3: 为什么删除 Remint 机制？**
A: 简化产品，快速上线。未来版本可能引入 Remint，但需要 ve33 DEX 先上线。

**Q4: 如果 ve33 DEX 延期上线怎么办？**
A: 用户仍可选择现金赎回 105 USDC。veNFT 转换需等待 DEX 上线。

**Q5: 收益 5 USDC 如何确定？**
A: 基于债券票面利率和 90 天期限计算。实际收益以债券到期结算为准。

---

**Last Updated**: 2025-10-26
**Status**: ✅ 优化完成，建议采纳
**Next Action**: 确认方案后，更新任务计划并开始开发

---

## 附录：与 ve33 DEX 的协同设计

### A1. 为什么鼓励用户转 veNFT？

**协议角度**
- ✅ 增加 HYD 锁定量 → 减少流通供应 → 支撑价格
- ✅ 提升治理参与度 → 更去中心化
- ✅ 锁定流动性提供者 → 稳定 DEX TVL

**用户角度**
- ✅ 持续收益：DEX 费用分红（年化可能 >5%）
- ✅ 贿赂收益：其他协议的投票激励
- ✅ 治理权：参与协议决策

### A2. veNFT 转换激励设计

**Bonus 奖励**（可选）
- 如果 >70% 用户选择转 veNFT
- 额外空投：10 PAIMON / veNFT
- 来源：Treasury PAIMON 储备

**社交证明**
- 实时展示转换率：
  - "已有 65% 用户选择转 veNFT"
  - "成为早期治理参与者"

### A3. 后续产品迭代

**Version 2.0**（ve33 DEX 上线后）
- 引入 Remint 机制
- 新增 PAIMON 兑换选项
- 延长期限至 180 天
- 提供 NFT 二级市场（OpenSea）
