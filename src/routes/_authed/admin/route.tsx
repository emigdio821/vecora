import { createFileRoute, Outlet } from '@tanstack/react-router'
// import { Role } from '@/types/rbac'

export const Route = createFileRoute('/_authed/admin')({
  component: RouteComponent,
  // beforeLoad: async ({ context }) => {
  //   const profile = context.profile
  //   const role = profile?.user.role

  //   if (!role || (role !== Role.SUPER_ADMIN && role !== Role.ADMIN)) {
  //     throw redirect({ to: '/' })
  //   }
  // },
})

function RouteComponent() {
  return <Outlet />
}
