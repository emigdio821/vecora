import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SettingsMainTabs } from '@/components/settings/main-tabs'
import { pageTitle } from '@/lib/metadata'
import { m } from '@/paraglide/messages'
import { settingsQueryOptions } from '@/tanstack-queries/session'

// Open to everyone; the tabs past "Aplicación" depend on the role.
export const Route = createFileRoute('/_authed/settings')({
  // Only types the links into a tab; the page reads it through nuqs.
  validateSearch: z.object({
    tab: z.enum(['app', 'hoa', 'account']).optional().catch(undefined),
  }),
  head: () => ({ meta: [{ title: pageTitle(m.common_section_settings()) }] }),
  component: SettingsPage,
})

function SettingsPage() {
  // Loaded by the authed layout.
  const { data: settings } = useSuspenseQuery(settingsQueryOptions)

  return (
    <>
      <h1 className="font-heading text-base font-semibold">{m.common_section_settings()}</h1>

      <SettingsMainTabs settings={settings} />
    </>
  )
}
