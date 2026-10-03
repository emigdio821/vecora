import { IconChartLine } from '@tabler/icons-react'
import { Link, useLocation } from '@tanstack/react-router'
import type { Settings } from '@/lib/supabase/settings'
import { DEFAULT_RESIDENTIAL_LABEL } from '@/lib/validations/settings'
import { VecoraIcon } from '../shared/icons'
import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar'
import { LinkPendingIndicator } from './link-pending-indicator'

interface HeaderNavProps extends React.ComponentProps<typeof SidebarGroupContent> {
  settings: Settings
}

export function HeaderNav({ settings, ...props }: HeaderNavProps) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { setOpenMobile } = useSidebar()
  const residentialName = settings.residentialName || DEFAULT_RESIDENTIAL_LABEL

  return (
    <SidebarGroupContent className="flex flex-col gap-2" {...props}>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 p-2">
            <VecoraIcon className="size-5 text-sidebar-accent-foreground" />

            <div className="grid flex-1 text-left text-sm leading-none">
              <span className="truncate text-base font-semibold text-sidebar-accent-foreground">Vecora</span>
              <span className="truncate text-sm text-sidebar-foreground" title={residentialName}>
                {residentialName}
              </span>
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => {
              setOpenMobile(false)
            }}
            isActive={pathname === '/'}
            render={
              <Link to="/">
                <IconChartLine className="size-4" />
                <span>Inicio</span>
                <LinkPendingIndicator to="/" />
              </Link>
            }
          />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  )
}
