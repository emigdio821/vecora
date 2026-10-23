import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import type { Settings } from '@/lib/db/settings'
import type { CurrentUser } from '@/lib/supabase/current-user'
import { HeaderNav } from './navs/header'
import { NavMain } from './navs/main'
import { NavReports } from './navs/reports'
import { NavSettings } from './navs/settings'
import { NavUser } from './navs/user'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: CurrentUser
  settings: Settings
}

export function AppSidebar({ user, settings, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <HeaderNav settings={settings} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain isAdmin={user.roles.includes('admin')} />
        <NavReports />
        <NavSettings className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
