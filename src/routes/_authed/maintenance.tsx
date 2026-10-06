import { createFileRoute } from '@tanstack/react-router'
import { RequestsDataTable } from '@/components/maintenance/table/data-table'
import { pageTitle } from '@/lib/metadata'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/_authed/maintenance')({
  head: () => ({ meta: [{ title: pageTitle(m.common_section_maintenance()) }] }),
  component: MaintenancePage,
})

function MaintenancePage() {
  const { user } = Route.useRouteContext()

  const isAdmin = user.roles.includes('admin')
  const viewer = {
    canRequest: isAdmin || user.roles.includes('maintenance'),
    canResolve: isAdmin || user.roles.includes('treasurer'),
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-base font-semibold">{m.common_section_maintenance()}</h1>
        <p className="text-sm text-muted-foreground">{m.requests_maintenance_page_description()}</p>
      </div>

      <RequestsDataTable viewer={viewer} />
    </>
  )
}
