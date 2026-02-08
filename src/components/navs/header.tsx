import { IconHomeStats } from '@tabler/icons-react'
import { Link, useLocation } from '@tanstack/react-router'
import { ResidoIcon } from '../icons'
import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar'

export function HeaderNav({ ...props }: React.ComponentProps<typeof SidebarGroupContent>) {
  const location = useLocation()
  const { pathname } = location
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroupContent className="flex flex-col gap-2" {...props}>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            render={
              <Link to="/" onClick={() => setOpenMobile(false)}>
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
            onClick={() => setOpenMobile(false)}
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
    </SidebarGroupContent>
  )
}
