import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { m } from '@/paraglide/messages'
import { logout } from '@/server-actions/auth'

/** For /no-access, outside the sidebar; plain state instead of a mutation. */
export function LogoutButton() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
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

    queryClient.clear()
    await navigate({ to: '/login', replace: true })
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="outline" loading={isLoading} onClick={handleClick}>
        {m.auth_logout()}
      </Button>
      {error && <p className="text-sm text-destructive-foreground">{error}</p>}
    </div>
  )
}
