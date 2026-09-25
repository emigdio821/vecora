import type { Metadata } from 'next'
import { PresidencyMainTabs } from '@/components/presidency/main-tabs'

export const metadata: Metadata = {
  title: 'Presidencia',
}

export default function PresidencyPage() {
  return (
    <>
      <h1 className="font-heading text-base font-semibold">Presidencia</h1>

      <PresidencyMainTabs />
    </>
  )
}
