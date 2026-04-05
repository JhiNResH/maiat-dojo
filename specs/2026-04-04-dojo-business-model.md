# Spec: Dojo Business Model — 2026-04-04 Strategy Session

> 今天跟 JhiNResH 討論後確定的核心架構決定。不要隨便改。

---

## 一、Skill 的兩種形態

### 被動型 Skill（Context）
- 純 SKILL.md 說明書
- 一次性買斷
- Agent 把內容加進 context window 使用
- Creator 不需要懂 API，只要會寫文字
- 定價：固定價格，$0-$100

### 主動型 Skill（Capability）
- 有 execution endpoint（HTTPS API）
- Per-call 付費
- Agent 每次調用才結算
- Creator 需要部署 API（但不需要懂 x402）
- 定價：per-call，e.g. $0.01/call

---

## 二、Skill Gateway（Dojo 的核心基礎設施）

Creator 不需要懂 x402 或區塊鏈。Dojo Gateway 做這層。

```
Creator 只提供：
POST https://my-skill.vercel.app/run

Dojo 自動包裝成：
POST https://dojo.maiat.io/skills/{slug}/run
x402-payment: ...
Authorization: Bearer <dojo-issued-token>
```

- 付款在 Gateway 層處理（x402 或信用卡）
- Creator 每週收 USDC 或法幣
- Creator 0 個區塊鏈知識照樣在 Dojo 賺錢

**這是護城河，不是 NFT。**

---

## 三、Agent-Native Discovery（缺的那塊）

現在所有 skill marketplace 都是給人類瀏覽的。Dojo 要做 agent 可以自主 discover 的層。

每個 skill 有 `skill.json`（給 agent 讀）：

```json
{
  "id": "web-scraping-v2",
  "name": "Web Scraping",
  "description": "從網頁抓取資料，當需要讀取任何網址內容時使用",
  "trigger": ["scrape", "fetch url", "read website", "get page content"],
  "type": "active",
  "endpoint": "https://dojo.maiat.io/skills/web-scraping/run",
  "inputs": ["url", "selector"],
  "outputs": ["text", "html"],
  "pricing": {
    "model": "per-call",
    "price": "0.01",
    "currency": "USDC"
  },
  "trust_score": 94
}
```

SKILL.md 給人看，skill.json 給 agent 看。類比：npm 的 package.json。

**目標：agent 可以自主完成 search → trust → use → pay 整個閉環，不需要人介入。**

---

## 四、支付模型（餐廳信用模型）

### 三種支付模式

| 模式 | 對象 | 機制 |
|------|------|------|
| 預付（外帶） | 新 agent，無歷史 | 100% 先付再用 |
| x402 原子支付 | 一般 agent | 付款和執行原子綁定 |
| 信用額度（熟客） | 高 Trust Score agent | 先用後結算 |

### Stake 機制（確保付款的核心）

信用額度不靠評分，靠**質押（Stake）**：

```
質押 10 USDC → 信用額度 20 USDC（2x）
質押 + 良好記錄 → 額度倍率提升到 5x、10x
用了不付 → 沒收質押金 + Trust Score 下降
```

- 詐欺成本 = 質押金（skin in the game）
- 越誠實的 agent → stake 越少換越大額度
- 跑不掉，因為錢已鎖在合約裡

### 信用擴張路徑

```
新 agent（無歷史）→ 必須預付
質押 10 USDC     → 信用額度 20 USDC
良好記錄 30 天    → 倍率升至 3x
良好記錄 90 天    → 倍率升至 5x
Top 10% agent    → 月結，無需質押
```

---

## 五、Reputation = Purchasing Power

**最重要的架構決定：**

Maiat Trust Score 不只是「這個 agent 好不好」的評分——
**它決定這個 agent 在 Dojo 的信用額度。**

```
Trust Score 高 → 信用額度高 → 可以先用後結算
Trust Score 低 → 必須預付，甚至禁止使用
```

類比現實世界：
- 信用卡額度 = Trust Score 的函數
- 企業賒帳 = 高信譽 agent 的月結
- Diners Club 模式 = 先建小圈子信任，再擴大

這是 Dojo + Maiat Reputation 打通最強的 use case。

---

## 六、Skill 上架流程（簡化版）

1. Creator 填寫 skill metadata（名稱、描述、分類、定價）
2. 被動型：上傳 SKILL.md 內容
3. 主動型：填寫 endpoint URL
4. 基本 format check（有 description？tags 夠嗎？）→ 上架
5. 交易時才跑真正的 Evaluation（Security + Quality）
6. Evaluation 結果累積成 Trust Score

---

## 七、暫時不做的東西（Phase 1 砍掉）

- ❌ ERC-1155 NFT（Phase 1 不需要，DB 留 tokenId 欄位備用）
- ❌ 二手市場（skill 是知識不是球鞋）
- ❌ Security Evaluator（等有外部 creator 再補）
- ❌ 向量搜尋排名（等有幾千個 skill 再考慮）
- ❌ 跨平台 NFT 互通（SKILL.md 本來就是純文本，不需要鏈上）

---

## 八、競品定位

| 平台 | 定位 | 缺點 |
|------|------|------|
| ShopClawMart | 賣 .md 靜態文件 | 可以被抄，無信任層，人類才能用 |
| Virtuals | Token launch 投機 | 空殼 agent，crypto only |
| **Dojo** | Skill Trust Infrastructure + Agent-Native Marketplace | 我們 |

**ShopClawMart 是書店，Dojo 是 agent 可以自主購物的 App Store。**

---

*記錄於 2026-04-04 討論*
*參考：@0x256 和 @EudemoniaCC 的推文洞察*
