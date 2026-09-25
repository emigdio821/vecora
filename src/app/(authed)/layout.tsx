import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { AppProviders } from '@/components/providers'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getCurrentUser } from '@/lib/supabase/current-user'

export default async function AuthedLayout({ children }: LayoutProps<'/'>) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Board members only: an account whose roles were all revoked still has a
  // valid session, so the gate has to live here as well as in login().
  if (user.roles.length === 0) {
    redirect('/no-access')
  }

  return (
    <AppProviders>
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <AppHeader />
          <section className="mx-auto flex w-full flex-1 flex-col gap-4 p-4 md:max-w-lg lg:max-w-3xl xl:max-w-5xl 2xl:max-w-7xl">
            {children}
          </section>
        </SidebarInset>
      </SidebarProvider>
    </AppProviders>
  )
}
