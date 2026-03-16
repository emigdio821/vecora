import { createFileRoute } from '@tanstack/react-router'
import { ProfilesDataTable } from '@/components/admin/profiles/table/data-table'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/admin/profiles')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Administración de perfiles') }],
  }),
})

function RouteComponent() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading font-medium text-lg leading-none">Administración de perfiles</h1>
        <p className="text-muted-foreground text-sm">
          En esta sección puedes administrar los perfiles que pueden ingresar a la aplicación.
        </p>
      </div>

      <ProfilesDataTable />
    </>
  )
}
