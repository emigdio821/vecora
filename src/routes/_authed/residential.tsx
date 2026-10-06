import { createFileRoute } from '@tanstack/react-router'
import { ResidentialMainTabs } from '@/components/residential/main-tabs'
import { pageTitle } from '@/lib/metadata'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/_authed/residential')({
  head: () => ({ meta: [{ title: pageTitle(m.common_section_residential()) }] }),
  component: ResidentialPage,
})

function ResidentialPage() {
  return (
    <>
      <h1 className="font-heading text-base font-semibold">{m.common_section_residential()}</h1>

      <ResidentialMainTabs />
    </>
  )
}
