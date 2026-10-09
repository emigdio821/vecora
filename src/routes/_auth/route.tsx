import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppFooter } from '@/components/app-footer'
import { VecoraIcon } from '@/components/shared/icons'

/** The bare chrome of the pages outside the app: brand on top, footer below. Each page keeps its own guard. */
export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center">
      <div className="flex w-full flex-col items-center gap-4 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <VecoraIcon className="size-4 text-primary" />
          <span className="text-base font-semibold text-foreground">Vecora</span>
        </div>

        <Outlet />
      </div>

      <AppFooter />
    </main>
  )
}
