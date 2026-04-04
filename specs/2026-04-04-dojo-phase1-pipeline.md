# Spec: Dojo Phase 1 — Pipeline (Delivery + x402 + 8183)

**Date:** 2026-04-04  
**Author:** Jensen  
**Status:** Draft — Pending JhiNResH Approval

---

## Goal

讓第一筆真實 skill 交易完整跑通：

```
上架 skill → 付錢 → 拿到內容 → 記錄在鏈上（xlayer）
```

## Out of Scope

- ❌ Hosted execution（幫用戶跑 skill）
- ❌ ERC-1155 / ERC-6551
- ❌ TrustGateHook（Phase 2）
- ❌ BNB Chain（Phase 2）
- ❌ Skill 上架（Phase 1 最後做）

## Target User

有自己 agent 的人（OpenClaw / Eliza），需要買 skill 裝備它。買完自己回去裝。

---

## Step 1 — Skill Delivery

**Goal:** 買完之後能拿到 skill 內容。

### Schema 變更

```prisma
model Skill {
  // 新增
  fileContent   String?   // 實際 skill 內容（.md 或 instruction）
  fileType      String?   // "markdown" | "json" | "text"
  isGated       Boolean   @default(true)  // 付款後才能拿
}
```

### API

```
GET /api/skills/[id]/content
- 需要 auth（Privy）
- 檢查 Purchase 記錄
- 有買過 → 回傳 fileContent
- 沒買過 → 401
```

### UI

- Skill page 買完後出現 "Download Skill" 按鈕
- 點了 call `/api/skills/[id]/content`，下載 .md 檔案
- 同時顯示安裝說明（"Copy and paste into your OpenClaw agent"）

### Acceptance Criteria

- [ ] 未購買用戶無法取得 fileContent
- [ ] 購買後可以下載
- [ ] 下載內容是真實可用的 skill instruction
- [ ] tsc --noEmit passes

---

## Step 2 — x402 Payment

**Goal:** 用 x402 micropayment 替代現在的 USDC on-chain flow。

### 整合

使用 `okx-x402-payment`（`okx/onchainos-skills`）：
- TEE-signed x402 authorization
- USDC on xlayer
- 每筆 $0.05 per call（或 skill 定價）

### Flow

```
用戶點 Buy
  → frontend 發起 x402 payment request
  → okx-x402-payment 處理授權
  → 付款成功 → 寫 Purchase 記錄
  → 解鎖 skill content
```

### API 變更

`POST /api/skills/[id]/buy` 接受 x402 payment proof：

```typescript
body: {
  x402Proof: string  // signed payment authorization
  amount: number
  currency: "USDC"
  chain: "xlayer"
}
```

### Acceptance Criteria

- [ ] 用戶用 USDC 付款成功
- [ ] Purchase 記錄寫入 DB
- [ ] 失敗時不解鎖內容
- [ ] Creator 收到 85%（10% platform，5% reputation pool）
- [ ] tsc --noEmit passes

---

## Step 3 — ERC-8183 on X Layer

**Goal:** 每筆購買寫一條 8183 job record 到 xlayer mainnet。

### Hooks（Phase 1）

| Hook | 用途 |
|------|------|
| FundTransferHook | 付款 escrow + 85/10/5 split |
| AttestationHook | job 完成 → 記錄結果 |
| MutualAttestationHook | 雙向評價（buyer + seller） |
| CompositeRouterHook | 串聯以上三個 |

### 合約部署

目標鏈：**X Layer Mainnet**（Polygon CDK，EVM 兼容）

```
DojoJobRegistry.sol
  - createJob(skillId, buyerId, sellerId, amount)
  - completeJob(jobId, result)
  - hooks: [FundTransferHook, AttestationHook, CompositeRouterHook]
```

### Flow

```
買家付款成功（x402）
  → backend call DojoJobRegistry.createJob()
  → FundTransferHook 鎖住款項
  → skill content delivered
  → backend call DojoJobRegistry.completeJob()
  → FundTransferHook 釋放款項（85/10/5）
  → AttestationHook 寫記錄
  → DB 更新 Purchase.onchainJobId
```

### Acceptance Criteria

- [ ] xlayer testnet 先跑通
- [ ] xlayer mainnet 部署
- [ ] 每筆購買有 onchain job record（可在 xlayer explorer 查）
- [ ] job record 包含：skillId, buyerAddr, sellerAddr, amount, timestamp
- [ ] 56 個現有 tests 不 break

---

## 執行順序

```
Week 1: Step 1（Skill Delivery）
Week 2: Step 2（x402 Payment）
Week 3: Step 3（8183 on xlayer testnet）
Week 4: Step 3（xlayer mainnet）+ 第一批 skill 上架
```

## 成功標準

> 在 xlayer mainnet 上有第一筆真實的 8183 job record，來自真實用戶付費購買真實 skill。

不是 mock，不是 seed data，不是測試帳號。

---

## Post-Merge TODOs（Mainnet 前必須修）

### P1 — buy/route.ts: privyId consistency check
**位置:** `src/app/api/skills/[id]/buy/route.ts`
**問題:** JWT 驗過了，但 `body.privyId` 沒有跟 JWT claims 的 privyId 做比對，理論上可以不一致。
**修法:** 加一行：
```typescript
if (body.privyId !== authResult.userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```
**優先級:** Mainnet 前必修，testnet 可接受。

### P2 — DojoJobRegistry: jobExists mapping
**位置:** `contracts/src/DojoJobRegistry.sol`
**問題:** `createdAt == 0` 作為 job 存在的 sentinel，fragile。
**修法:** 加 `mapping(uint256 => bool) public jobExists`，createJob 時設 true。
**優先級:** Phase 2。
