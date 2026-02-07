import { createFileRoute } from '@tanstack/react-router'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/presidency')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Presidencia') }],
  }),
})

function RouteComponent() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading font-medium text-lg leading-none">Presidencia</h1>
      <p className="text-muted-foreground text-sm">
        En esta sección puedes ver todo lo relacionado con presidencia.
      </p>
    </div>
  )
}
