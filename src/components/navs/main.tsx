import {
  IconBuildingCommunity,
  IconGavel,
  IconHeartHandshake,
  IconPigMoney,
  IconTool,
  IconUrgent,
} from '@tabler/icons-react'
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
import { LinkPendingIndicator } from './link-pending-indicator'

export function NavMain({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>Secciones</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpenMobile(false)
              }}
              isActive={pathname === '/treasury'}
              render={
                <Link to="/treasury">
                  <IconPigMoney className="size-4" />
                  <span>Tesorería</span>
                  <LinkPendingIndicator to="/treasury" />
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpenMobile(false)
              }}
              isActive={pathname === '/presidency'}
              render={
                <Link to="/presidency">
                  <IconGavel className="size-4" />
                  <span>Presidencia</span>
                  <LinkPendingIndicator to="/presidency" />
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpenMobile(false)
              }}
              isActive={pathname === '/maintenance'}
              render={
                <Link to="/maintenance">
                  <IconTool className="size-4" />
                  <span>Mantenimiento</span>
                  <LinkPendingIndicator to="/maintenance" />
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpenMobile(false)
              }}
              isActive={pathname === '/security'}
              render={
                <Link to="/security">
                  <IconUrgent className="size-4" />
                  <span>Seguridad</span>
                  <LinkPendingIndicator to="/security" />
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpenMobile(false)
              }}
              isActive={pathname === '/hoa-board'}
              render={
                <Link to="/hoa-board">
                  <IconHeartHandshake className="size-4" />
                  <span>Mesa directiva</span>
                  <LinkPendingIndicator to="/hoa-board" />
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpenMobile(false)
              }}
              isActive={pathname === '/residential'}
              render={
                <Link to="/residential">
                  <IconBuildingCommunity className="size-4" />
                  <span>Residencial</span>
                  <LinkPendingIndicator to="/residential" />
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
