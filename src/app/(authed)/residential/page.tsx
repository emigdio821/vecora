import type { Metadata } from 'next'
import { ResidentialMainTabs } from '@/components/residential/main-tabs'

export const metadata: Metadata = {
  title: 'Residencial',
}

export default function ResidentialPage() {
  return (
    <>
      <h1 className="font-heading text-base font-semibold">Residencial</h1>

      <ResidentialMainTabs />
    </>
  )
}
