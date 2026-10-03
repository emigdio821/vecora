import { createFileRoute } from '@tanstack/react-router'
import { FeeStatusCard } from '@/components/dashboard/fee-status-card'
import { NoticesCard } from '@/components/dashboard/notices-card'
import { PaymentRequestsCard } from '@/components/dashboard/payment-requests-card'
import { TreasuryCard } from '@/components/dashboard/treasury-card'
import { pageTitle } from '@/lib/metadata'

export const Route = createFileRoute('/_authed/')({
  head: () => ({ meta: [{ title: pageTitle('Inicio') }] }),
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <h1 className="font-heading text-base font-semibold">Inicio</h1>

      <TreasuryCard />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <FeeStatusCard />
        <PaymentRequestsCard />
      </div>

      <NoticesCard />
    </>
  )
}
