'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useAccount,
} from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { SKILL_NFT_ABI, USDC_ABI, getContracts, ACTIVE_CHAIN } from '@/lib/contracts'

interface BuySkillButtonProps {
  skillId: string
  price: number      // price in USD (e.g. 1.00)
  skillName: string
}

type Status = 'idle' | 'approving' | 'buying' | 'confirming' | 'done' | 'error'

export default function BuySkillButton({ skillId, price, skillName }: BuySkillButtonProps) {
  const { ready, authenticated, login } = usePrivy()
  const { address } = useAccount()
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [txStep, setTxStep] = useState<'approve' | 'buy'>('approve')

  const contracts = getContracts()
  const priceRaw = parseUnits(price.toString(), 6) // USDC has 6 decimals

  // Check USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.usdc,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, contracts.skillNft] : undefined,
    query: { enabled: !!address },
  })

  // Check USDC balance
  const { data: balance } = useReadContract({
    address: contracts.usdc,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Check if already owns this skill
  const { data: owned } = useReadContract({
    address: contracts.skillNft,
    abi: SKILL_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address, BigInt(skillId)] : undefined,
    query: { enabled: !!address },
  })

  const needsApproval = allowance !== undefined && allowance < priceRaw
  const hasBalance = balance !== undefined && balance >= priceRaw
  const alreadyOwned = owned !== undefined && owned > BigInt(0)

  // Write contracts
  const {
    writeContract: writeApprove,
    data: approveHash,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract()

  const {
    writeContract: writeBuy,
    data: buyHash,
    error: buyError,
    reset: resetBuy,
  } = useWriteContract()

  // Wait for approve tx
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Wait for buy tx
  const { isSuccess: buyConfirmed } = useWaitForTransactionReceipt({
    hash: buyHash,
  })

  // After approve confirms → trigger buy
  useEffect(() => {
    if (approveConfirmed && status === 'approving') {
      refetchAllowance()
      handleBuyStep()
    }
  }, [approveConfirmed])

  // After buy confirms → done
  useEffect(() => {
    if (buyConfirmed && status === 'buying') {
      setStatus('done')
    }
  }, [buyConfirmed])

  // Handle errors
  useEffect(() => {
    const err = approveError || buyError
    if (err) {
      setStatus('error')
      setErrorMsg(err.message?.slice(0, 120) || 'Transaction failed')
    }
  }, [approveError, buyError])

  const handleBuyStep = () => {
    setStatus('buying')
    setTxStep('buy')
    writeBuy({
      address: contracts.skillNft,
      abi: SKILL_NFT_ABI,
      functionName: 'buySkill',
      args: [BigInt(skillId), address!],
    })
  }

  const handleClick = async () => {
    if (!authenticated) {
      login()
      return
    }

    if (alreadyOwned) return
    if (!hasBalance) {
      setStatus('error')
      setErrorMsg(`Insufficient USDC. Need ${price} USDC.`)
      return
    }

    resetApprove()
    resetBuy()
    setErrorMsg('')

    if (needsApproval) {
      // Step 1: Approve USDC
      setStatus('approving')
      setTxStep('approve')
      writeApprove({
        address: contracts.usdc,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [contracts.skillNft, priceRaw],
      })
    } else {
      // Already approved — go straight to buy
      handleBuyStep()
    }
  }

  const explorerBase = ACTIVE_CHAIN === 'baseSepolia'
    ? 'https://sepolia.basescan.org'
    : 'https://basescan.org'

  const activeHash = buyHash || approveHash

  // Button text
  const buttonText = () => {
    if (!authenticated) return 'Connect Wallet to Buy'
    if (alreadyOwned) return '✓ Already Equipped'
    if (!hasBalance && address) return `Need ${price} USDC`
    if (status === 'approving') return 'Approving USDC...'
    if (status === 'buying') return 'Buying Skill...'
    if (status === 'done') return '✓ Equipped!'
    if (status === 'error') return 'Try Again'
    return `Buy for $${price.toFixed(2)}`
  }

  const isDisabled =
    status === 'approving' ||
    status === 'buying' ||
    alreadyOwned ||
    (!hasBalance && !!address)

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`w-full font-mono text-sm uppercase tracking-widest py-3 transition-colors ${
          alreadyOwned || status === 'done'
            ? 'bg-green-800 text-[#f0ece2] cursor-default'
            : isDisabled
            ? 'bg-[#1a1a1a]/50 text-[#f0ece2] cursor-wait'
            : status === 'error'
            ? 'bg-[#8b0000] text-[#f0ece2] hover:bg-[#1a1a1a]'
            : 'bg-[#8b0000] text-[#f0ece2] hover:bg-[#1a1a1a]'
        }`}
      >
        {buttonText()}
      </button>

      {/* Progress indicator for two-step flow */}
      {(status === 'approving' || status === 'buying') && (
        <div className="flex justify-center gap-2 mt-2">
          <span className={`font-mono text-[10px] ${txStep === 'approve' ? 'text-[#8b0000]' : 'text-[#1a1a1a]/30'}`}>
            ① Approve
          </span>
          <span className="font-mono text-[10px] text-[#1a1a1a]/30">→</span>
          <span className={`font-mono text-[10px] ${txStep === 'buy' ? 'text-[#8b0000]' : 'text-[#1a1a1a]/30'}`}>
            ② Buy
          </span>
        </div>
      )}

      {status === 'error' && (
        <p className="font-mono text-[10px] text-red-600 text-center mt-2">
          {errorMsg}
        </p>
      )}

      {status === 'done' && activeHash && (
        <a
          href={`${explorerBase}/tx/${activeHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-mono text-[10px] text-[#8b0000] text-center mt-2 hover:underline"
        >
          View on BaseScan →
        </a>
      )}

      {/* Balance info */}
      {authenticated && address && balance !== undefined && (
        <p className="font-mono text-[10px] text-[#1a1a1a]/40 text-center mt-2">
          Balance: {formatUnits(balance, 6)} USDC
        </p>
      )}

      {!authenticated && (
        <p className="font-mono text-[10px] text-[#1a1a1a]/40 text-center mt-2">
          Login required to purchase
        </p>
      )}
    </div>
  )
}
