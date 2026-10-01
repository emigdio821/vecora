import { createFileRoute, redirect } from '@tanstack/react-router'
import { LogsDataTable } from '@/components/logs/table/data-table'
import { pageTitle } from '@/lib/metadata'

export const Route = createFileRoute('/_authed/logs')({
  // Admin only. RLS hides the rows anyway; this keeps others off an empty page.
  beforeLoad: ({ context }) => {
    if (!context.user.roles.includes('admin')) throw redirect({ to: '/' })
  },
  head: () => ({ meta: [{ title: pageTitle('Historial') }] }),
  component: LogsPage,
})

function LogsPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-base font-semibold">Historial</h1>
        <p className="text-sm text-muted-foreground">
          Aquí queda registrado cada cambio en la aplicación: qué se hizo, quién lo hizo y cuándo. Nadie puede
          editar ni borrar este historial.
        </p>
      </div>

      <LogsDataTable />
    </>
  )
}
