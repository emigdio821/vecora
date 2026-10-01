import { createFileRoute } from '@tanstack/react-router'
import { RequestsDataTable } from '@/components/maintenance/table/data-table'
import { pageTitle } from '@/lib/metadata'

export const Route = createFileRoute('/_authed/maintenance')({
  head: () => ({ meta: [{ title: pageTitle('Mantenimiento') }] }),
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
        <h1 className="font-heading text-base font-semibold">Mantenimiento</h1>
        <p className="text-sm text-muted-foreground">
          Trabajos y compras de mantenimiento. Cada registro es una solicitud de pago que "Tesorería" marca
          como pagada o rechazada.
        </p>
      </div>

      <RequestsDataTable viewer={viewer} />
    </>
  )
}
