import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/presidency')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Presidency</div>
}
