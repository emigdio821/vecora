import { IconGavel, IconHomeShield, IconPigMoney, IconShield, IconTool } from '@tabler/icons-react'
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

export function NavMain({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  const location = useLocation()
  const { pathname } = location
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>Secciones</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              isActive={pathname === '/presidency'}
              render={
                <Link to="/presidency">
                  <IconGavel className="size-4" />
                  <span>Presidencia</span>
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              isActive={pathname === '/treasury'}
              render={
                <Link to="/treasury">
                  <IconPigMoney className="size-4" />
                  <span>Tesorería</span>
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              isActive={pathname === '/maintenance'}
              render={
                <Link to="/maintenance">
                  <IconTool className="size-4" />
                  <span>Mantenimiento</span>
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              isActive={pathname === '/security'}
              render={
                <Link to="/security">
                  <IconShield className="size-4" />
                  <span>Seguridad</span>
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              isActive={pathname === '/hoa-board'}
              render={
                <Link to="/hoa-board">
                  <IconHomeShield className="size-4" />
                  <span>Mesa directiva</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
