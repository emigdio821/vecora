import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/maintenance')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Maintenance</div>
}
