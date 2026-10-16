import { IconSettings } from '@tabler/icons-react'
import { Link, useLocation } from '@tanstack/react-router'
import { m } from '@/paraglide/messages'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar'
import { LinkPendingIndicator } from './link-pending-indicator'

/** Open to everyone; the page shows the HOA's tab only to president or admin. */
export function NavSettings({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpenMobile(false)
              }}
              isActive={pathname === '/settings'}
              render={
                <Link to="/settings">
                  <IconSettings className="size-4" />
                  <span>{m.common_section_settings()}</span>
                  <LinkPendingIndicator to="/settings" />
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
