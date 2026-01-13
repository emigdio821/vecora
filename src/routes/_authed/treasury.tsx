import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/treasury')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Treasury</div>
}
