import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import type { CurrentUser } from '@/lib/supabase/current-user'
import type { Settings } from '@/lib/supabase/settings'
import { NavAdmin } from './navs/admin'
import { HeaderNav } from './navs/header'
import { NavMain } from './navs/main'
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
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        {user.roles.includes('admin') && <NavAdmin />}
        <NavSettings settings={settings} />
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
