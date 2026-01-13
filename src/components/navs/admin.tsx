import { IconUserShield } from '@tabler/icons-react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar'

export function NavAdmin({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  const location = useLocation()
  const { pathname } = location

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === '/admin-panel'}
              render={
                <Link to="/administration">
                  <IconUserShield className="size-4" />
                  <span>Administración</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
