'use client'

import { ChartLineIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Settings } from '@/lib/supabase/settings'
import { DEFAULT_RESIDENTIAL_LABEL } from '@/lib/validations/settings'
import { StoaIcon } from '../shared/icons'
import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar'

interface HeaderNavProps extends React.ComponentProps<typeof SidebarGroupContent> {
  settings: Settings
}

export function HeaderNav({ settings, ...props }: HeaderNavProps) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const residentialName = settings.residentialName || DEFAULT_RESIDENTIAL_LABEL

  return (
    <SidebarGroupContent className="flex flex-col gap-2" {...props}>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 p-2">
            <StoaIcon className="size-5 text-sidebar-accent-foreground" />

            <div className="grid flex-1 text-left text-sm leading-none">
              <span className="truncate text-base font-semibold text-sidebar-accent-foreground">Stoa</span>
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
              <Link href="/">
                <ChartLineIcon className="size-4" />
                <span>Inicio</span>
              </Link>
            }
          />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  )
}
