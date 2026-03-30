'use client'

import { type ReactNode } from 'react'
import { PrivyProvider as Privy } from '@privy-io/react-auth'

export function PrivyProvider({ children }: { children: ReactNode }) {
  const appId = (process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '').trim()

  if (!appId) {
    console.warn('Privy App ID missing — auth disabled.')
    return <>{children}</>
  }

  return (
    <Privy
      appId={appId}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#1a1a1a',
        },
        loginMethods: ['email', 'google', 'apple', 'wallet'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </Privy>
  )
}
