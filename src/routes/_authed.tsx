import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getServerSession } from '@/api/server-functions/session'
import { userProfileQueryOptions } from '@/api/tanstack-queries/user'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export const Route = createFileRoute('/_authed')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const session = await getServerSession()

    if (!session) {
      context.queryClient.clear()
      throw redirect({ to: '/login' })
    }

    const profile = await context.queryClient.ensureQueryData(userProfileQueryOptions())

    if (!profile) {
      context.queryClient.clear()
      throw redirect({ to: '/login' })
    }

    return { profile }
  },
})

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <section className="flex w-full flex-1 flex-col gap-4 p-4 sm:p-6 xl:mx-auto xl:max-w-7xl">
          <Outlet />
        </section>
      </SidebarInset>
    </SidebarProvider>
  )
}
