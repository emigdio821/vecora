import { createFileRoute } from '@tanstack/react-router'
import { AdminUsersTabs } from '@/components/admin/users-tabs'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/admin/users')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Administración') }],
  }),
})

function RouteComponent() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading font-medium text-lg leading-none">Administración de usuarios</h1>
        <p className="text-muted-foreground text-sm">
          En esta sección puedes administrar los datos de los usuarios de la aplicación.
        </p>
      </div>

      <AdminUsersTabs />
    </>
  )
}
