import { IconPigMoney, IconPresentation, IconShield, IconTool } from '@tabler/icons-react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar'

export function NavMain({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  const location = useLocation()
  const { pathname } = location

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === '/presidency'}
              render={
                <Link to="/presidency">
                  <IconPresentation className="size-4" />
                  <span>Presidencia</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === '/treasury'}
              render={
                <Link to="/treasury">
                  <IconPigMoney className="size-4" />
                  <span>Tesorería</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === '/maintenance'}
              render={
                <Link to="/maintenance">
                  <IconTool className="size-4" />
                  <span>Mantenimiento</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === '/security'}
              render={
                <Link to="/security">
                  <IconShield className="size-4" />
                  <span>Seguridad</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
