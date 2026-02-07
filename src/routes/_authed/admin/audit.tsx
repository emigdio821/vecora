import { createFileRoute } from '@tanstack/react-router'
import { AuditLogsDataTable } from '@/components/admin/audit-logs/table/data-table'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/admin/audit')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Administración') }],
  }),
})

function RouteComponent() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading font-medium text-lg leading-none">Auditoría</h1>
        <p className="text-muted-foreground text-sm">
          En esta sección puedes ver todos los registros del sistema.
        </p>
      </div>

      <AuditLogsDataTable />
    </>
  )
}
