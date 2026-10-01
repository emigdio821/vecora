import { Link, useLocation } from '@tanstack/react-router'
import { HistoryIcon } from 'lucide-react'
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

/** Rendered by the sidebar only for admins; the pages check the role again. */
export function NavAdmin({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>Administración</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpenMobile(false)
              }}
              isActive={pathname === '/logs'}
              render={
                <Link to="/logs">
                  <HistoryIcon className="size-4" />
                  <span>Historial</span>
                  <LinkPendingIndicator to="/logs" />
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
