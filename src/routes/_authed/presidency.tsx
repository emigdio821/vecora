import { createFileRoute } from '@tanstack/react-router'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/presidency')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Presidencia') }],
  }),
})

function RouteComponent() {
  return <div>Presidency</div>
}
