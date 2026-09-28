import type { Metadata } from 'next'
import { FeeStatusCard } from '@/components/dashboard/fee-status-card'
import { NoticesCard } from '@/components/dashboard/notices-card'
import { PaymentRequestsCard } from '@/components/dashboard/payment-requests-card'
import { PeriodSummaryCards } from '@/components/dashboard/period-summary-cards'
import { ReportsCard } from '@/components/dashboard/reports-card'

export const metadata: Metadata = {
  title: 'Inicio',
}

export default function HomePage() {
  return (
    <>
      <h1 className="font-heading text-base font-semibold">Inicio</h1>

      <section aria-labelledby="reports-heading" className="flex flex-col gap-4">
        <h2 id="reports-heading" className="font-heading text-sm font-semibold text-muted-foreground">
          Reportes
        </h2>
        <ReportsCard />
      </section>

      <section aria-labelledby="summary-heading" className="flex flex-col gap-4">
        <h2 id="summary-heading" className="font-heading text-sm font-semibold text-muted-foreground">
          Resumen general
        </h2>
        <PeriodSummaryCards />

        {/* items-start: each card keeps its own height instead of matching its neighbor. */}
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <FeeStatusCard />
          <PaymentRequestsCard />
          <NoticesCard />
        </div>
      </section>
    </>
  )
}
