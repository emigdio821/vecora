import { IconHomeStats } from '@tabler/icons-react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { ResidoIcon } from './icons'
import { NavAdmin } from './navs/admin'
import { NavMain } from './navs/main'
import { NavUser } from './navs/user'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const { pathname } = location

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link to="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary">
                    <ResidoIcon className="size-4 text-sidebar-primary-foreground" />
                  </div>

                  <div className="grid flex-1 text-left text-sm leading-none">
                    <span className="truncate font-medium text-base text-sidebar-accent-foreground">
                      Resido
                    </span>
                    <span className="truncate text-sidebar-foreground text-xs">Manejo residencial</span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === '/'}
              render={
                <Link to="/">
                  <IconHomeStats className="size-4" />
                  <span>Inicio</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavAdmin />
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
