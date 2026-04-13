'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseEventLogs, type Log } from 'viem';
import { usePrivy } from '@privy-io/react-auth';
import { ACP_ABI, USDC_ABI, getContracts } from '@/lib/contracts';

export type EscrowStep =
  | 'idle'
  | 'preparing'
  | 'approving'
  | 'creating_job'
  | 'setting_budget'
  | 'funding'
  | 'confirming'
  | 'done'
  | 'error';

interface EscrowResult {
  sessionId: string;
  budgetTotal: number;
  gatewayUrl: string;
  expiresAt: string;
  onchainJobId: string;
}

interface PrepareResponse {
  chainId: number;
  acpAddress: `0x${string}`;
  usdcAddress: `0x${string}`;
  evaluatorAddress: `0x${string}`;
  hookAddress: `0x${string}`;
  provider: `0x${string}`;
  budgetUsdc: string;
  expiredAt: number;
  description: string;
  pricePerCall: number;
  gatewaySlug: string;
}

export function useEscrowFund() {
  const { address } = useAccount();
  const { getAccessToken, user } = usePrivy();
  const [step, setStep] = useState<EscrowStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EscrowResult | null>(null);
  const [txCount, setTxCount] = useState(0);
  const [totalTxs, setTotalTxs] = useState(4);

  const { writeContractAsync } = useWriteContract();

  // Read USDC balance for display
  const contracts = getContracts();
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: contracts.usdc,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const fund = useCallback(async (params: {
    agentId: string;
    skillId: string;
    budgetTotal: number;
    gatewaySlug: string;
  }) => {
    if (!address || !user) {
      setError('Wallet not connected');
      setStep('error');
      return;
    }

    setStep('preparing');
    setError(null);
    setTxCount(0);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      // 1. Call prepare endpoint
      const prepRes = await fetch('/api/sessions/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          privyId: user.id,
          agentId: params.agentId,
          skillId: params.skillId,
          budgetTotal: params.budgetTotal,
        }),
      });
      const prep: PrepareResponse = await prepRes.json();
      if (!prepRes.ok) throw new Error((prep as { error?: string }).error || 'Prepare failed');

      const budgetWei = BigInt(prep.budgetUsdc);

      // 2. Approve USDC (always approve on testnet — idempotent, costs only gas)
      setStep('approving');
      const approveTx = await writeContractAsync({
        address: prep.usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [prep.acpAddress, budgetWei],
      });
      // Wait for approve confirmation
      await waitForTx(approveTx);
      setTxCount(1);

      // 3. createJob — agent becomes job.client
      setStep('creating_job');
      const createJobTx = await writeContractAsync({
        address: prep.acpAddress,
        abi: ACP_ABI,
        functionName: 'createJob',
        args: [
          prep.provider,
          prep.evaluatorAddress,
          BigInt(prep.expiredAt),
          prep.description,
          prep.hookAddress as `0x${string}`,
        ],
      });
      const createReceipt = await waitForTx(createJobTx);
      setTxCount(2);

      // Extract jobId from JobCreated event
      const jobLogs = parseEventLogs({
        abi: ACP_ABI,
        eventName: 'JobCreated',
        logs: createReceipt.logs,
      });
      const jobId = jobLogs[0]?.args.jobId;
      if (!jobId) throw new Error('JobCreated event not found in tx receipt');

      // 4. setBudget
      setStep('setting_budget');
      const setBudgetTx = await writeContractAsync({
        address: prep.acpAddress,
        abi: ACP_ABI,
        functionName: 'setBudget',
        args: [jobId, budgetWei, '0x'],
      });
      await waitForTx(setBudgetTx);
      setTxCount(3);

      // 5. fund
      setStep('funding');
      const fundTx = await writeContractAsync({
        address: prep.acpAddress,
        abi: ACP_ABI,
        functionName: 'fund',
        args: [jobId, budgetWei, '0x'],
      });
      await waitForTx(fundTx);
      setTxCount(4);

      // 6. Confirm with backend
      setStep('confirming');
      const confirmRes = await fetch('/api/sessions/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          privyId: user.id,
          agentId: params.agentId,
          skillId: params.skillId,
          onchainJobId: jobId.toString(),
          budgetTotal: params.budgetTotal,
        }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error || 'Confirm failed');

      setResult({
        sessionId: confirmData.session.id,
        budgetTotal: confirmData.session.budgetTotal,
        gatewayUrl: `/api/gateway/skills/${params.gatewaySlug}/run`,
        expiresAt: confirmData.session.expiresAt,
        onchainJobId: jobId.toString(),
      });
      setStep('done');
      refetchBalance();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      console.error('[useEscrowFund]', message);
      setError(message);
      setStep('error');
    }
  }, [address, user, getAccessToken, writeContractAsync, refetchBalance]);

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setResult(null);
    setTxCount(0);
  }, []);

  return {
    step,
    error,
    result,
    txCount,
    totalTxs,
    usdcBalance,
    fund,
    reset,
    walletAddress: address,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Poll for tx receipt via raw RPC. Returns logs compatible with viem's parseEventLogs. */
async function waitForTx(hash: `0x${string}`): Promise<{ logs: Log[] }> {
  const rpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545';
  const maxAttempts = 30;
  const interval = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [hash],
        id: 1,
      }),
    });
    const data = await res.json();
    if (data.result) {
      if (data.result.status === '0x0') {
        throw new Error(`Transaction reverted: ${hash}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const logs: Log[] = (data.result.logs || []).map((log: any) => ({
        address: log.address as `0x${string}`,
        topics: log.topics as `0x${string}`[],
        data: (log.data || '0x') as `0x${string}`,
        blockHash: log.blockHash as `0x${string}`,
        blockNumber: BigInt(log.blockNumber),
        logIndex: Number(log.logIndex),
        transactionHash: log.transactionHash as `0x${string}`,
        transactionIndex: Number(log.transactionIndex),
        removed: log.removed ?? false,
      }));
      return { logs };
    }
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`Transaction not confirmed after ${maxAttempts * interval / 1000}s: ${hash}`);
}
