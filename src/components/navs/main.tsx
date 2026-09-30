'use client'

import {
  GavelIcon,
  HeartHandshakeIcon,
  MapPinHouseIcon,
  PiggyBankIcon,
  SirenIcon,
  WrenchIcon,
} from 'lucide-react'
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
import { LinkPendingIndicator } from './link-pending-indicator'

export function NavMain({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>Áreas</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpenMobile(false)
              }}
              isActive={pathname === '/treasury'}
              render={
                <Link href="/treasury">
                  <PiggyBankIcon className="size-4" />
                  <span>Tesorería</span>
                  <LinkPendingIndicator />
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
                <Link href="/presidency">
                  <GavelIcon className="size-4" />
                  <span>Presidencia</span>
                  <LinkPendingIndicator />
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
                <Link href="/maintenance">
                  <WrenchIcon className="size-4" />
                  <span>Mantenimiento</span>
                  <LinkPendingIndicator />
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
                <Link href="/security">
                  <SirenIcon className="size-4" />
                  <span>Seguridad</span>
                  <LinkPendingIndicator />
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
                <Link href="/hoa-board">
                  <HeartHandshakeIcon className="size-4" />
                  <span>Mesa directiva</span>
                  <LinkPendingIndicator />
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
                <Link href="/residential">
                  <MapPinHouseIcon className="size-4" />
                  <span>Residencial</span>
                  <LinkPendingIndicator />
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
