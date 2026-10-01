import { createFileRoute } from '@tanstack/react-router'
import { TreasuryMainTabs } from '@/components/treasury/main-tabs'
import { pageTitle } from '@/lib/metadata'

export const Route = createFileRoute('/_authed/treasury')({
  head: () => ({ meta: [{ title: pageTitle('Tesorería') }] }),
  component: TreasuryPage,
})

function TreasuryPage() {
  return (
    <>
      <h1 className="font-heading text-base font-semibold">Tesorería</h1>

      <TreasuryMainTabs />
    </>
  )
}
