'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { logout } from '@/server-actions/auth'

/** Outside the (authed) providers, so plain state instead of a mutation. */
export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const result = await logout()

    if (result?.error) {
      setLoading(false)
      setError(result.error)
      return
    }

    router.replace('/login')
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="outline" loading={isLoading} onClick={handleClick}>
        Cerrar sesión
      </Button>
      {error && <p className="text-sm text-destructive-foreground">{error}</p>}
    </div>
  )
}
