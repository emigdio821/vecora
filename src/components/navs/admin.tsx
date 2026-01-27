import { IconHomeShield, IconLogs, IconUsersGroup } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'
import { userProfileQueryOptions } from '@/api/tanstack-queries/user'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar'

export function NavAdmin({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  const location = useLocation()
  const { pathname } = location
  const { data: profile, isLoading } = useQuery(userProfileQueryOptions())

  if (isLoading || !profile?.roles?.includes('admin')) {
    return null
  }

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>Administración</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === '/admin/users'}
              render={
                <Link to="/admin/users">
                  <IconUsersGroup className="size-4" />
                  <span>Usuarios</span>
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
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
