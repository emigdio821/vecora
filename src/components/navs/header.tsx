'use client'

import { ChartLineIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ResidoIcon } from '../shared/icons'
import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar'

export function HeaderNav({ ...props }: React.ComponentProps<typeof SidebarGroupContent>) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroupContent className="flex flex-col gap-2" {...props}>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 p-2">
            <ResidoIcon className="size-5 text-sidebar-accent-foreground" />

            <div className="grid flex-1 text-left text-sm leading-none">
              <span className="truncate text-base font-semibold text-sidebar-accent-foreground">Resido</span>
              <span className="truncate text-sm text-sidebar-foreground">Manejo residencial</span>
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
