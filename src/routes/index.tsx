import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { authMiddleware } from '@/middleware/auth'

export const Route = createFileRoute('/')({
  component: RouteComponent,
  server: {
    middleware: [authMiddleware],
  },
})

function RouteComponent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Fetch current session
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const session = await authClient.getSession()
      return session.data
    },
  })

  // Fetch user profile
  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      return response.json()
    },
    enabled: !!session?.user,
  })

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

  if (isSessionLoading || isProfileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bienvenido a Resido</CardTitle>
          <CardDescription>Panel de administración residencial</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session?.user && (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="font-medium text-sm">Información del usuario</div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Nombre:</span>{' '}
                  <span className="font-medium">{session.user.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span className="font-medium">{session.user.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ID:</span>{' '}
                  <span className="font-mono text-xs">{session.user.id}</span>
                </div>
              </div>
            </div>
          )}

          {userProfile && (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="font-medium text-sm">Perfil</div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  <span className="font-medium">
                    {userProfile.profileType === 'owner' ? 'Propietario' : 'Usuario Externo'}
                  </span>
                </div>
                {userProfile.profile && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Nombre completo:</span>{' '}
                      <span className="font-medium">
                        {userProfile.profile.firstName} {userProfile.profile.lastName}
                      </span>
                    </div>
                    {userProfile.profile.phone && (
                      <div>
                        <span className="text-muted-foreground">Teléfono:</span>{' '}
                        <span className="font-medium">{userProfile.profile.phone}</span>
                      </div>
                    )}
                    {userProfile.profile.address && (
                      <div>
                        <span className="text-muted-foreground">Dirección:</span>{' '}
                        <span className="font-medium">{userProfile.profile.address}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {userProfile?.roles && userProfile.roles.length > 0 && (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="font-medium text-sm">Roles</div>
              <div className="space-y-2">
                {userProfile.roles.map((role: { id: string; name: string; description?: string | null }) => (
                  <div key={role.id} className="rounded-md bg-muted p-2">
                    <div className="font-medium text-sm">{role.name}</div>
                    {role.description && (
                      <div className="text-muted-foreground text-xs">{role.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleLogout} disabled={isLoading} variant="outline" className="w-full">
            {isLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
