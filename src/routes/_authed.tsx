import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { userProfileQueryOptions } from '@/lib/ts-queries/user'
import { authMiddleware } from '@/middleware/auth'

export const Route = createFileRoute('/_authed')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    await context.queryClient.ensureQueryData(userProfileQueryOptions())
  },
  server: {
    middleware: [authMiddleware],
  },
})

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <section className="flex w-full flex-1 flex-col gap-4 p-6 xl:mx-auto xl:max-w-7xl">
          <Outlet />
        </section>
      </SidebarInset>
    </SidebarProvider>
  )
}
