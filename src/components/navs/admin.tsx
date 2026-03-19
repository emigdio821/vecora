import { IconHomeShield, IconLogs, IconUsersGroup } from '@tabler/icons-react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar'

export function NavAdmin({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  const location = useLocation()
  const { pathname } = location
  const { setOpenMobile } = useSidebar()
  // const { profile } = useRouteContext({ from: '/_authed' })
  // const isAdmin = useIsAdmin()

  // if (!profile || !isAdmin) {
  //   return null
  // }

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>Administración</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              isActive={pathname === '/admin/profiles'}
              render={
                <Link to="/admin/profiles">
                  <IconUsersGroup className="size-4" />
                  <span>Perfiles</span>
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              isActive={pathname === '/admin/residential'}
              render={
                <Link to="/admin/residential">
                  <IconHomeShield className="size-4" />
                  <span>Residencial</span>
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              isActive={pathname === '/admin/audit'}
              render={
                <Link to="/admin/audit">
                  <IconLogs className="size-4" />
                  <span>Auditoría</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
