'use client'

import type { EmailOtpType } from '@supabase/supabase-js'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { confirmAccessLink } from '@/server-actions/auth'

interface ConfirmAccessButtonProps {
  tokenHash: string
  type: EmailOtpType
  children: React.ReactNode
}

/**
 * The click that spends the link. Like the login form, it stays loading while
 * the action's redirect navigates away, and only stops if the action returns.
 */
export function ConfirmAccessButton({ tokenHash, type, children }: ConfirmAccessButtonProps) {
  const [isLoading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const result = await confirmAccessLink(tokenHash, type)

    if (result?.error) {
      setLoading(false)
    }
  }

  return (
    <Button
      disabled={isLoading}
      loading={isLoading}
      onClick={() => {
        void handleClick()
      }}
    >
      {children}
    </Button>
  )
}
