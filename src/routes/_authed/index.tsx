import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { userProfileQueryOptions } from '@/lib/ts-queries/user'
import { authMiddleware } from '@/middleware/auth'

export const Route = createFileRoute('/_authed/')({
  component: RouteComponent,
  server: {
    middleware: [authMiddleware],
  },
})

function RouteComponent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { data: profile, isLoading: profileLoading } = useQuery(userProfileQueryOptions())

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await authClient.signOut()
      router.navigate({ to: '/login' })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Cargando...</div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bienvenido a Resido</CardTitle>
        <CardDescription>Panel de administración residencial</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <pre>{JSON.stringify(profile, null, 2)}</pre>
        <Button onClick={handleLogout} disabled={isLoading} variant="outline" className="w-full">
          {isLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </Button>
      </CardContent>
    </Card>
  )
}
