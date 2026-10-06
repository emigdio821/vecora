import { createFileRoute } from '@tanstack/react-router'
import { TreasuryMainTabs } from '@/components/treasury/main-tabs'
import { pageTitle } from '@/lib/metadata'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/_authed/treasury')({
  head: () => ({ meta: [{ title: pageTitle(m.common_section_treasury()) }] }),
  component: TreasuryPage,
})

function TreasuryPage() {
  return (
    <>
      <h1 className="font-heading text-base font-semibold">{m.common_section_treasury()}</h1>

      <TreasuryMainTabs />
    </>
  )
}
