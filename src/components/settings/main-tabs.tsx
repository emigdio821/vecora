import { useQueryState } from 'nuqs'
import { useCan, useCurrentUser } from '@/components/current-user-provider'
import { AccountSettingsPanel } from '@/components/settings/account-settings'
import { AppSettingsPanel } from '@/components/settings/app-settings'
import { HoaSettingsPanel } from '@/components/settings/hoa-settings'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import type { Settings } from '@/lib/db/settings'
import { m } from '@/paraglide/messages'

/**
 * This device's preferences for everyone, and the HOA's details for president
 * or admin (the server re-checks the role). Without the role there are no tabs, only
 * the device's preferences. The main admin also gets its password.
 */
export function SettingsMainTabs({ settings }: { settings: Settings }) {
  const canEditHoa = useCan({ settings: ['write'] })
  const user = useCurrentUser()
  const [tab, setTab] = useQueryState('tab', { defaultValue: 'app' })

  if (!canEditHoa) {
    return <AppSettingsPanel />
  }

  // A link to a tab this user doesn't have opens the first one.
  const tabs = user.isMainAdmin ? ['app', 'hoa', 'account'] : ['app', 'hoa']
  const current = tabs.includes(tab) ? tab : 'app'

  return (
    <Tabs
      defaultValue="app"
      value={current}
      onValueChange={(value) => {
        void setTab(value)
      }}
    >
      <TabsList>
        <TabsTab value="app">{m.settings_tab_app()}</TabsTab>
        <TabsTab value="hoa">{m.settings_tab_hoa()}</TabsTab>
        {user.isMainAdmin && <TabsTab value="account">{m.settings_tab_account()}</TabsTab>}
      </TabsList>
      <TabsPanel value="app">
        <AppSettingsPanel />
      </TabsPanel>
      {/* Kept mounted so switching tabs doesn't drop unsaved changes. */}
      <TabsPanel value="hoa" keepMounted>
        <HoaSettingsPanel settings={settings} />
      </TabsPanel>
      {user.isMainAdmin && (
        <TabsPanel value="account">
          <AccountSettingsPanel />
        </TabsPanel>
      )}
    </Tabs>
  )
}
