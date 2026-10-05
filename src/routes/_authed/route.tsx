import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { CurrentUserProvider } from '@/components/current-user-provider'
import { SetupDialog } from '@/components/setup-dialog'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { WelcomeDialog } from '@/components/welcome-dialog'
import { settingsQueryOptions } from '@/tanstack-queries/session'

export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context }) => {
    const { user } = context
    if (!user) throw redirect({ to: '/login' })

    // Board members only: an account whose roles were all revoked still has a
    // valid session, so the gate has to live here as well as in login().
    if (user.roles.length === 0) throw redirect({ to: '/no-access' })

    // Arrived through an access link: choose a password before seeing anything else.
    if (user.mustSetPassword) throw redirect({ to: '/set-password' })

    return { user }
  },
  loader: ({ context }) => context.queryClient.query(settingsQueryOptions),
  component: AuthedLayout,
})

function AuthedLayout() {
  const { user } = Route.useRouteContext()
  // The settings dialogs invalidate this query after saving.
  const { data: settings } = useSuspenseQuery(settingsQueryOptions)

  return (
    <CurrentUserProvider user={user}>
      <SidebarProvider>
        <AppSidebar user={user} settings={settings} />
        <SidebarInset>
          <AppHeader />
          <section className="mx-auto flex w-full flex-1 flex-col gap-4 p-4 md:max-w-lg lg:max-w-3xl xl:max-w-5xl 2xl:max-w-7xl">
            <Outlet />
          </section>
        </SidebarInset>
      </SidebarProvider>
      {/* The main admin sets up the HOA first; the welcome comes after. */}
      {user.isMainAdmin && !settings.isConfigured ? <SetupDialog settings={settings} /> : <WelcomeDialog />}
    </CurrentUserProvider>
  )
}
