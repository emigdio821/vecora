import { createFileRoute } from '@tanstack/react-router'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/maintenance')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Mantenimiento') }],
  }),
})

function RouteComponent() {
  return <div>Maintenance</div>
}
