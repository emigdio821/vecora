import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ResidentialMainTabs } from '@/components/residential/main-tabs'
import { pageTitle } from '@/lib/metadata'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/_authed/residential')({
  // Only types the links into a tab and search; the tabs and the tables' search boxes read
  // them through nuqs.
  validateSearch: z.object({
    tab: z.enum(['houses', 'residents']).optional().catch(undefined),
    'search-houses': z.string().optional().catch(undefined),
    'search-residents': z.string().optional().catch(undefined),
  }),
  head: () => ({ meta: [{ title: pageTitle(m.common_section_residential()) }] }),
  component: ResidentialPage,
})

function ResidentialPage() {
  return (
    <>
      <h1 className="font-heading text-base font-semibold">{m.common_section_residential()}</h1>

      <ResidentialMainTabs />
    </>
  )
}
