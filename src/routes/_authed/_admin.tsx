import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { isAdminUser } from '@/server-fns/admin'

export const Route = createFileRoute('/_authed/_admin')({
  component: RouteComponent,
  beforeLoad: async () => {
    const isAdmin = await isAdminUser()

    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
})

function RouteComponent() {
  return <Outlet />
}
