import type { Metadata } from 'next'
import { FeeStatusCard } from '@/components/dashboard/fee-status-card'
import { NoticesCard } from '@/components/dashboard/notices-card'
import { PeriodSummaryCards } from '@/components/dashboard/period-summary-cards'

export const metadata: Metadata = {
  title: 'Inicio',
}

export default function HomePage() {
  return (
    <>
      <h1 className="font-heading text-base font-semibold">Inicio</h1>

      <PeriodSummaryCards />

      {/* items-start: each card keeps its own height instead of matching its neighbor. */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <FeeStatusCard />
        <NoticesCard />
      </div>
    </>
  )
}
