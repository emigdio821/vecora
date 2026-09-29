'use client'

import type { EmailOtpType } from '@supabase/supabase-js'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { confirmAccessLink } from '@/server-actions/auth'

interface ConfirmAccessButtonProps {
  tokenHash: string
  type: EmailOtpType
  children: React.ReactNode
}

/** The click that spends the link; the action redirects either way. */
export function ConfirmAccessButton({ tokenHash, type, children }: ConfirmAccessButtonProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      disabled={isPending}
      loading={isPending}
      onClick={() => {
        startTransition(async () => {
          await confirmAccessLink(tokenHash, type)
        })
      }}
    >
      {children}
    </Button>
  )
}
