import type { Metadata } from 'next'
import { TreasuryMainTabs } from '@/components/treasury/main-tabs'

export const metadata: Metadata = {
  title: 'Tesorería',
}

export default function TreasuryPage() {
  return (
    <>
      <h1 className="font-heading text-base font-semibold">Tesorería</h1>

      <TreasuryMainTabs />
    </>
  )
}
