---
name: Token Price Oracle
description: Real-time BSC token price lookup by symbol or address.
category: DeFi
price: 0.003
icon: "💹"
tags: [price, oracle, bsc]
long_description: |
  Returns spot price, 24h change, and liquidity depth for any verified BSC
  token. Sources: PancakeSwap v3 + Binance orderbook mid.
endpoint_url: https://example.com/price
---

# Token Price Oracle

## Input
```json
{ "symbol": "CAKE" }
```

## Output
```json
{ "price_usd": 2.14, "change_24h": -0.032 }
```
