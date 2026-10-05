import { IconSettings, IconSunMoon } from '@tabler/icons-react'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { AppearanceDialog } from '@/components/settings/dialog/appearance'
import { EditSettingsDialog } from '@/components/settings/dialog/edit-settings'
import type { Settings } from '@/lib/supabase/settings'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar'

interface NavSettingsProps extends React.ComponentProps<typeof SidebarGroup> {
  settings: Settings
}

/**
 * Appearance is per device and open to everyone. Settings writes the shared
 * settings row, so only president (or admin) sees it; RLS re-checks the role.
 */
export function NavSettings({ settings, ...props }: NavSettingsProps) {
  const canEditSettings = useHasRole('president')
  const [openDialog, setOpenDialog] = useState<'appearance' | 'settings' | null>(null)

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>Configuración</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpenDialog('appearance')
              }}
            >
              <IconSunMoon className="size-4" />
              <span>Apariencia</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {canEditSettings && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  setOpenDialog('settings')
                }}
              >
                <IconSettings className="size-4" />
                <span>Ajustes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>

      <AppearanceDialog
        open={openDialog === 'appearance'}
        onOpenChange={(open) => {
          setOpenDialog(open ? 'appearance' : null)
        }}
      />
      {canEditSettings && (
        <EditSettingsDialog
          settings={settings}
          open={openDialog === 'settings'}
          onOpenChange={(open) => {
            setOpenDialog(open ? 'settings' : null)
          }}
        />
      )}
    </SidebarGroup>
  )
}
