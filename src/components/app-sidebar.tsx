import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import { NavAdmin } from './navs/admin'
import { HeaderNav } from './navs/header'
import { NavMain } from './navs/main'
import { NavUser } from './navs/user'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <HeaderNav />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavAdmin />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
