'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { SKILL_REGISTRY_ABI, CONTRACTS } from '@/lib/contracts'

interface BuySkillButtonProps {
  skillId: string
  price: number
  skillName: string
}

export default function BuySkillButton({ skillId, price, skillName }: BuySkillButtonProps) {
  const { ready, authenticated, login, user } = usePrivy()
  const [status, setStatus] = useState<'idle' | 'buying' | 'confirming' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Contract not deployed yet — show coming soon
  const contractDeployed = CONTRACTS.base.skillRegistry !== '0x0000000000000000000000000000000000000000'

  const handleBuy = async () => {
    if (!authenticated) {
      login()
      return
    }

    if (!contractDeployed) {
      setStatus('error')
      setErrorMsg('Contract not deployed yet — coming soon!')
      return
    }

    try {
      setStatus('buying')
      setErrorMsg('')

      writeContract({
        address: CONTRACTS.base.skillRegistry,
        abi: SKILL_REGISTRY_ABI,
        functionName: 'buySkill',
        args: [BigInt(skillId)],
        value: parseEther(price.toString()),
      })

      setStatus('confirming')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err?.message?.slice(0, 100) || 'Transaction failed')
    }
  }

  if (isSuccess && status !== 'done') {
    setStatus('done')
  }

  return (
    <div>
      <button
        onClick={handleBuy}
        disabled={status === 'buying' || status === 'confirming'}
        className={`w-full font-mono text-sm uppercase tracking-widest py-3 transition-colors ${
          status === 'done'
            ? 'bg-green-800 text-[#f0ece2] cursor-default'
            : status === 'buying' || status === 'confirming'
            ? 'bg-[#1a1a1a]/50 text-[#f0ece2] cursor-wait'
            : 'bg-[#8b0000] text-[#f0ece2] hover:bg-[#1a1a1a]'
        }`}
      >
        {!authenticated
          ? 'Connect Wallet to Buy'
          : status === 'done'
          ? '✓ Equipped!'
          : status === 'confirming'
          ? 'Confirming...'
          : status === 'buying'
          ? 'Sign Transaction...'
          : 'Equip This Skill'}
      </button>

      {status === 'error' && (
        <p className="font-mono text-[10px] text-red-600 text-center mt-2">
          {errorMsg}
        </p>
      )}

      {status === 'done' && hash && (
        <a
          href={`https://basescan.org/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-mono text-[10px] text-[#8b0000] text-center mt-2 hover:underline"
        >
          View on BaseScan →
        </a>
      )}

      {!authenticated && (
        <p className="font-mono text-[10px] text-[#1a1a1a]/40 text-center mt-2">
          Login required to purchase
        </p>
      )}

      {authenticated && !contractDeployed && status === 'idle' && (
        <p className="font-mono text-[10px] text-amber-600 text-center mt-2">
          On-chain purchases coming soon — testnet deployment in progress
        </p>
      )}
    </div>
  )
}
