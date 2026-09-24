import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import type { CurrentUser } from '@/lib/supabase/current-user'
// import { NavAdmin } from './navs/admin'
import { HeaderNav } from './navs/header'
import { NavMain } from './navs/main'
import { NavUser } from './navs/user'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: CurrentUser
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <HeaderNav />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        {/* <NavAdmin /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
