import type { EmailOtpType } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { confirmAccessLink } from '@/server-actions/auth'

interface ConfirmAccessButtonProps {
  tokenHash: string
  type: EmailOtpType
  children: React.ReactNode
}

/**
 * The click that spends the link. Like the login form, it stays loading until
 * the next page shows: /set-password, or /login with the invite warning.
 */
export function ConfirmAccessButton({ tokenHash, type, children }: ConfirmAccessButtonProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [isLoading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const result = await confirmAccessLink(tokenHash, type)

    // Either way the session changed (a previous one may have been closed).
    queryClient.clear()
    if (result?.error) {
      await navigate({ to: '/login', search: { error: 'invite' }, replace: true })
      return
    }
    await navigate({ to: '/set-password', replace: true })
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
