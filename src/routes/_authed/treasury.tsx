import { createFileRoute } from '@tanstack/react-router'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/treasury')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Tesorería') }],
  }),
})

function RouteComponent() {
  return <div>Treasury</div>
}
