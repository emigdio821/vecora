'use client'

import { HeartHandshakeIcon, MapPinHouseIcon, PiggyBankIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>Secciones</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              isActive={pathname === '/treasury'}
              render={
                <Link href="/treasury">
                  <PiggyBankIcon className="size-4" />
                  <span>Tesorería</span>
                </Link>
              }
            />
          </SidebarMenuItem>

          {/* <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              isActive={pathname === '/presidency'}
              render={
                <Link href="/presidency">
                  <GavelIcon className="size-4" />
                  <span>Presidencia</span>
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              isActive={pathname === '/maintenance'}
              render={
                <Link href="/maintenance">
                  <WrenchIcon className="size-4" />
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
                <Link href="/security">
                  <SirenIcon className="size-4" />
                  <span>Seguridad</span>
                </Link>
              }
            />
          </SidebarMenuItem> */}

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              isActive={pathname === '/hoa-board'}
              render={
                <Link href="/hoa-board">
                  <HeartHandshakeIcon className="size-4" />
                  <span>Mesa directiva</span>
                </Link>
              }
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              isActive={pathname === '/residential'}
              render={
                <Link href="/residential">
                  <MapPinHouseIcon className="size-4" />
                  <span>Residencial</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
