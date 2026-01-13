import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { userProfileQueryOptions } from '@/lib/ts-queries/user'

export const Route = createFileRoute('/_authed/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: profile, isLoading: profileLoading } = useQuery(userProfileQueryOptions())

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Cargando...</div>
      </div>
    )
  }

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
