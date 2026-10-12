import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PresidencyMainTabs } from '@/components/presidency/main-tabs'
import { pageTitle } from '@/lib/metadata'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/_authed/presidency')({
  // Only types the links into a tab and its filters; the page reads them through nuqs.
  validateSearch: z.object({
    tab: z.enum(['periods', 'reservations', 'amenities']).optional().catch(undefined),
    'search-reservations': z.string().optional().catch(undefined),
    area: z.string().optional().catch(undefined),
  }),
  head: () => ({ meta: [{ title: pageTitle(m.common_section_presidency()) }] }),
  component: PresidencyPage,
})

function PresidencyPage() {
  return (
    <>
      <h1 className="font-heading text-base font-semibold">{m.common_section_presidency()}</h1>

      <PresidencyMainTabs />
    </>
  )
}
