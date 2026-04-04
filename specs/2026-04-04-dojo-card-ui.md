# Spec: Dojo Card UI — Skill Cards + Deck System

**Date:** 2026-04-04  
**Author:** Jensen  
**Status:** Draft — Pending JhiNResH Approval

---

## Vision

每個 skill 是一張卡。收集、裝備、分享 deck。
不是 NFT，純 UI。卡牌感覺的核心是視覺設計，不是鏈上資產。

**Hook:** "Copy this agent's build" — 比「買 skill」更強的情感驅動入口。

---

## Skill Card Design

每張 skill card 包含：

```
┌─────────────────────┐
│  [RARITY BORDER]    │
│  🔍                 │  ← icon (emoji)
│                     │
│  Smart Contract     │  ← name (Playfair Display)
│  Auditor Pro        │
│                     │
│  ████████████████   │  ← category color bar
│  SECURITY           │
│                     │
│  ★ 4.9  847 used   │  ← rating + installs
│  $24               │  ← price
│                     │
│  [LEGENDARY]        │  ← rarity badge
└─────────────────────┘
```

### Rarity System（自動算，不用手動設）

| Rarity | 條件 | 邊框顏色 |
|--------|------|---------|
| Common | installs < 100 | `#b8a990` 灰褐 |
| Rare | installs 100-500 | `#4a90d9` 藍 |
| Epic | installs 500-2000 | `#9b59b6` 紫 |
| Legendary | installs > 2000 OR rating ≥ 4.9 | `#c9a84c` 金 |

### Category Color System

| Category | 顏色 |
|---------|------|
| Security | `#8b1a1a` 深紅 |
| DeFi | `#1a5c8b` 深藍 |
| Trading | `#1a6b3a` 深綠 |
| Content | `#6b3a8b` 深紫 |
| Analytics | `#8b6b1a` 深金 |
| Infra | `#3a3a3a` 深灰 |

---

## Pages

### 1. Skill Marketplace（改版）

- Grid layout：每個 skill 顯示為卡牌
- Filter by category → 換顏色主題
- Hover card → flip effect 顯示 description
- "Legendary" skills 有金色光暈動效

### 2. My Deck（新頁面 `/deck`）

你擁有的所有 skill cards。

```
MY DECK  ·  12 skills

[SECURITY]          [DEFI]           [TRADING]
Smart Contract  ★   DeFi Yield   ★★  Twitter Alpha ★
Auditor Pro         Scanner          Finder
LEGENDARY           EPIC             RARE
```

- 按 category 分組
- 每張卡可以 "Equip to Agent"
- 右上角：「Share My Deck」→ 生成分享連結

### 3. Agent Profile（改版）

Agent profile 頁顯示 equipped skill cards（not just text list）。

```
RONIN  ·  Tatsujin 達人  ·  ★ 4.9
─────────────────────────────────
EQUIPPED BUILD  (4 skills)

[⚡ DeFi Yield] [⛽ Gas Opt] [🔒 MEV Shield] [🔍 On-Chain]
  LEGENDARY       RARE          EPIC            EPIC

                [Copy Build →]
```

### 4. Copy Build Flow

點 "Copy Build" → Modal：

```
Copy Ronin's Build?

You own:  ⚡ DeFi Yield ✓
You need: ⛽ Gas Optimizer  $18
          🔒 MEV Shield     $22
          🔍 On-Chain Forensics $28

Total: $68  [Buy All & Copy Build]
            [Add to Wishlist]
```

---

## Technical Implementation

### DB Changes（minimal）

```prisma
model Skill {
  // 新增
  rarity    String  @default("common") // computed on save
  cardColor String?  // hex, auto from category
}
```

計算 rarity 的 utility function：
```typescript
function computeRarity(installs: number, rating: number): string {
  if (installs > 2000 || rating >= 4.9) return "legendary"
  if (installs > 500) return "epic"
  if (installs > 100) return "rare"
  return "common"
}
```

### New Components

- `SkillCard.tsx` — 卡牌組件，支援 size="sm"|"md"|"lg"
- `DeckGrid.tsx` — 展示 deck 的 grid，by category
- `CopyBuildModal.tsx` — 複製 build 的確認 modal
- `RarityBadge.tsx` — Common/Rare/Epic/Legendary badge

### New Pages

- `src/app/deck/page.tsx` — My Deck
- Agent profile 改用 SkillCard 替代 text list

---

## Acceptance Criteria

- [ ] Skill marketplace 顯示卡牌（非列表）
- [ ] Rarity 自動根據 installs + rating 計算
- [ ] Category color system 正確
- [ ] My Deck 頁面，按 category 分組
- [ ] Agent profile 顯示 equipped skill cards
- [ ] "Copy Build" 流程完整跑通（modal + 批量購買）
- [ ] "Share My Deck" 生成分享連結
- [ ] 報紙風格保留（不是 generic game UI）
- [ ] tsc --noEmit passes

## Out of Scope

- ❌ NFT（之後 optional upgrade）
- ❌ Card trading（P2P 二手市場）
- ❌ Animated card reveals
- ❌ Pack opening mechanic

---

## 優先級

在 Phase 1 pipeline（delivery + x402 + 8183）完成後執行。

這個是 Dojo 最重要的 **viral hook**，做好截圖一定傳播。
