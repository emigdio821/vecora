import { createFileRoute } from '@tanstack/react-router'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/maintenance')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Mantenimiento') }],
  }),
})

function RouteComponent() {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-heading font-medium text-lg leading-none">Mantenimiento</h4>
      <p className="text-muted-foreground text-sm">
        En esta sección puedes ver todo lo relacionado con mantenimiento.
      </p>
    </div>
  )
}
