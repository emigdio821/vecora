import { createFileRoute } from '@tanstack/react-router'
import { ResidentialMainTabs } from '@/components/residential/main-tabs'
import { pageTitle } from '@/lib/metadata'

export const Route = createFileRoute('/_authed/residential')({
  head: () => ({ meta: [{ title: pageTitle('Residencial') }] }),
  component: ResidentialPage,
})

function ResidentialPage() {
  return (
    <>
      <h1 className="font-heading text-base font-semibold">Residencial</h1>

      <ResidentialMainTabs />
    </>
  )
}
