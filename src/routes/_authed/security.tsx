import { createFileRoute } from '@tanstack/react-router'
import { RequestsDataTable } from '@/components/security/table/data-table'
import { pageTitle } from '@/lib/metadata'

export const Route = createFileRoute('/_authed/security')({
  head: () => ({ meta: [{ title: pageTitle('Seguridad') }] }),
  component: SecurityPage,
})

function SecurityPage() {
  const { user } = Route.useRouteContext()

  const isAdmin = user.roles.includes('admin')
  const viewer = {
    canRequest: isAdmin || user.roles.includes('security'),
    canResolve: isAdmin || user.roles.includes('treasurer'),
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-base font-semibold">Seguridad</h1>
        <p className="text-sm text-muted-foreground">
          Gastos de seguridad: cámaras, guardias, accesos y equipo. Cada registro es una solicitud de pago que
          "Tesorería" marca como pagada o rechazada.
        </p>
      </div>

      <RequestsDataTable viewer={viewer} />
    </>
  )
}
