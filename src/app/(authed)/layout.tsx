import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { AppProviders } from '@/components/providers'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function AuthedLayout({ children }: LayoutProps<'/'>) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <section className="flex w-full flex-1 flex-col gap-4 p-4 sm:p-6 xl:mx-auto xl:max-w-7xl">
          <AppProviders>{children}</AppProviders>
        </section>
      </SidebarInset>
    </SidebarProvider>
  )
}
