import { IconBellCog, IconBellPlus } from '@tabler/icons-react'
import { Link, useLocation } from '@tanstack/react-router'
import { useState } from 'react'
import { CreateNotificationSheet } from '../shared/sheets/create-notification'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar'

export function NavNotifications({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  const [isCreateNotificationSheetOpen, setCreateNotificationSheetOpen] = useState(false)
  const location = useLocation()
  const { pathname } = location

  return (
    <>
      <CreateNotificationSheet
        state={{
          isOpen: isCreateNotificationSheetOpen,
          onOpenChange: setCreateNotificationSheetOpen,
        }}
      />

      <SidebarGroup {...props}>
        <SidebarGroupLabel>Notificaciones</SidebarGroupLabel>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setCreateNotificationSheetOpen(true)}>
                <IconBellPlus className="size-4" />
                Crear
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === '/notifications'}
                render={
                  <Link to="/notifications">
                    <IconBellCog className="size-4" />
                    <span>Administrar</span>
                  </Link>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
