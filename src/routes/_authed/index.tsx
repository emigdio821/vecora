import { IconRefresh } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { userProfileQueryOptions } from '@/lib/ts-queries/user'

export const Route = createFileRoute('/_authed/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: profile, isLoading: profileLoading, error, refetch } = useQuery(userProfileQueryOptions())

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Cargando...</div>
      </div>
    )
  }

  if (error || !profile)
    return (
      <Button onClick={() => refetch()} size="lg">
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">Refetch profile</span>
        </div>
        <IconRefresh className="ml-auto size-4" />
      </Button>
    )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logged in user</CardTitle>
        <CardDescription>User information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      </CardContent>
    </Card>
  )
}
