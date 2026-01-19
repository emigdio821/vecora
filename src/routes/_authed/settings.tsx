import { createFileRoute } from '@tanstack/react-router'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/settings')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Configuración') }],
  }),
})

function RouteComponent() {
  return <div>Settings</div>
}
