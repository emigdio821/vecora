import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { userProfileQueryOptions } from '@/api/tanstack-queries/user'

export const Route = createFileRoute('/_authed/admin')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const profile = await context.queryClient.ensureQueryData(userProfileQueryOptions())
    const role = profile.user.role

    if (!role || role !== 'admin') {
      throw redirect({ to: '/' })
    }
  },
})

function RouteComponent() {
  return <Outlet />
}
