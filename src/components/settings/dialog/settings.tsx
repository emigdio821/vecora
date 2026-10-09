import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { AppSettingsPanel } from '@/components/settings/dialog/app-settings'
import { HoaSettingsPanel } from '@/components/settings/dialog/hoa-settings'
import {
  ResponsiveDialog,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogPopup,
  ResponsiveDialogTitle,
} from '@/components/shared/responsive-dialog'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import { toastManager } from '@/components/ui/toast'
import type { Settings } from '@/lib/supabase/settings'
import type { SettingsInput } from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'
import { updateSettings } from '@/server-actions/settings'
import { SETTINGS_QUERY_KEY } from '@/tanstack-queries/settings'

type SettingsTab = 'app' | 'hoa'

interface SettingsDialogProps {
  settings: Settings
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Everything configurable: this device's preferences for everyone, and the
 * HOA's details for president or admin (RLS re-checks the role). Without the
 * role there are no tabs, only the device's preferences. A drawer on mobile.
 */
export function SettingsDialog({ settings, open, onOpenChange }: SettingsDialogProps) {
  const canEditHoa = useHasRole('president')
  const [tab, setTab] = useState<SettingsTab>('app')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: SettingsInput) => {
      const result = await updateSettings(values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] })
      toastManager.add({ type: 'success', title: m.settings_saved() })
      onOpenChange(false)
    },
  })

  const handleOpenChange = (nextOpen: boolean, eventDetails: { cancel: () => void }) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        // Clears `success`, which keeps the form busy while the dialog closes.
        if (!isOpen) {
          mutation.reset()
        }
      }}
    >
      <ResponsiveDialogPopup>
        {canEditHoa ? (
          <Tabs
            className="min-h-0 flex-1 gap-0"
            value={tab}
            onValueChange={(value: SettingsTab) => {
              setTab(value)
            }}
          >
            <SettingsHeader
              description={tab === 'app' ? m.settings_app_description() : m.settings_dialog_description()}
            >
              <TabsList className="mt-2">
                <TabsTab value="app">{m.settings_tab_app()}</TabsTab>
                <TabsTab value="hoa">{m.settings_tab_hoa()}</TabsTab>
              </TabsList>
            </SettingsHeader>

            <TabsPanel value="app" className="flex min-h-0 flex-col">
              <AppSettingsPanel />
            </TabsPanel>
            {/* Kept mounted so switching tabs doesn't drop unsaved changes. */}
            <TabsPanel value="hoa" keepMounted className="flex min-h-0 flex-col">
              <HoaSettingsPanel settings={settings} mutation={mutation} />
            </TabsPanel>
          </Tabs>
        ) : (
          <>
            <SettingsHeader description={m.settings_app_description()} />
            <AppSettingsPanel />
          </>
        )}
      </ResponsiveDialogPopup>
    </ResponsiveDialog>
  )
}

function SettingsHeader({ description, children }: { description: string; children?: React.ReactNode }) {
  return (
    <ResponsiveDialogHeader>
      <ResponsiveDialogTitle>{m.common_section_settings()}</ResponsiveDialogTitle>
      <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>
      {children}
    </ResponsiveDialogHeader>
  )
}
