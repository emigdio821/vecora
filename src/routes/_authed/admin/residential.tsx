import { createFileRoute } from '@tanstack/react-router'
import { AdminResidentialTabs } from '@/components/admin/residential-tabs'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/admin/residential')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Administración') }],
  }),
})

function RouteComponent() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h4 className="font-heading font-medium text-lg leading-none">Administración residencial</h4>
        <p className="text-muted-foreground text-sm">
          En esta sección puedes administrar los datos relacionados con la gestión residencial.
        </p>
      </div>

      <AdminResidentialTabs />
    </>
  )
}
