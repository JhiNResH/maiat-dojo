/**
 * Standalone E2E test for the Phase 2 on-chain anchor.
 * Calls anchorExecution("echo-test", true, resultHash, maxPriceUSDC) → prints tx hashes.
 * Requires .env.local with DOJO_RELAYER_PRIVATE_KEY + BSC_RPC_URL.
 */
import { keccak256, toBytes } from 'viem';
import { anchorExecution } from '../src/lib/swap-router.js';

async function main() {
  const slug = process.argv[2] ?? 'echo-test';
  const maxPriceMicroUsdc = BigInt(process.argv[3] ?? '10000');
  const skillId = keccak256(toBytes(slug));
  const resultHash = keccak256(toBytes(`demo-payload-${Date.now()}`));

  console.log(`Anchoring "${slug}" skillId=${skillId} maxPriceMicroUsdc=${maxPriceMicroUsdc}`);
  const r = await anchorExecution(skillId, true, resultHash, maxPriceMicroUsdc);
  console.log(JSON.stringify(r, null, 2));
  if (!r.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
