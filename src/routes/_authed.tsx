import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppSidebar } from '@/components/sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { authMiddleware } from '@/middleware/auth'

export const Route = createFileRoute('/_authed')({
  component: RouteComponent,
  server: {
    middleware: [authMiddleware],
  },
})

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <section className="flex w-full flex-1 flex-col gap-4 p-4 xl:mx-auto xl:max-w-7xl">
          <Outlet />
        </section>
      </SidebarInset>
    </SidebarProvider>
  )
}
