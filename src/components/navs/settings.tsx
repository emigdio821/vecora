import { IconSettings } from '@tabler/icons-react'
import { useState } from 'react'
import { SettingsDialog } from '@/components/settings/dialog/settings'
import type { Settings } from '@/lib/supabase/settings'
import { m } from '@/paraglide/messages'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar'

interface NavSettingsProps extends React.ComponentProps<typeof SidebarGroup> {
  settings: Settings
}

/** Open to everyone; the dialog shows the HOA's tab only to president or admin. */
export function NavSettings({ settings, ...props }: NavSettingsProps) {
  const [isOpen, setOpen] = useState(false)

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpen(true)
              }}
            >
              <IconSettings className="size-4" />
              <span>{m.common_section_settings()}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>

      <SettingsDialog settings={settings} open={isOpen} onOpenChange={setOpen} />
    </SidebarGroup>
  )
}
