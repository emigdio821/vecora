import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { CurrentUserProvider } from '@/components/current-user-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { FirstVisitWelcomeDialog } from '@/components/welcome-dialog'
import { createClient } from '@/lib/supabase/client'
import { loginHrefForCurrentPage } from '@/lib/utils'
import { settingsQueryOptions } from '@/tanstack-queries/session'

export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context, location }) => {
    const { user } = context
    // A shared link opened while signed out comes back here after signing in.
    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href === '/' ? undefined : location.href },
      })
    }

    // Board members only: an account whose roles were all revoked still has a
    // valid session, so the gate has to live here as well as in login().
    if (user.roles.length === 0) throw redirect({ to: '/no-access' })

    // Arrived through an access link, or still on the default password: choose
    // a password before seeing anything else.
    if (user.mustSetPassword || user.mustChangePassword) throw redirect({ to: '/set-password' })

    return { user }
  },
  loader: ({ context }) => context.queryClient.query(settingsQueryOptions),
  component: AuthedLayout,
})

function AuthedLayout() {
  const { user } = Route.useRouteContext()
  // The settings page invalidates this query after saving.
  const { data: settings } = useSuspenseQuery(settingsQueryOptions)

  // Reads go from the browser straight to Supabase, past the server functions'
  // auth middleware. When the session can't be refreshed (expired, or signed
  // out elsewhere) the client signs out; show the login page, not load errors.
  useEffect(() => {
    const { data } = createClient().auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') window.location.assign(loginHrefForCurrentPage())
    })
    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  return (
    <CurrentUserProvider user={user}>
      <SidebarProvider>
        <AppSidebar user={user} settings={settings} />
        {/* min-w-0: a flex item grows to fit wide content; this way wide tables scroll inside instead. */}
        <SidebarInset className="min-w-0">
          <AppHeader />
          <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4">
            <Outlet />
          </section>
        </SidebarInset>
      </SidebarProvider>
      <FirstVisitWelcomeDialog />
    </CurrentUserProvider>
  )
}
