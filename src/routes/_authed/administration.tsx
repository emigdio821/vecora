import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/administration')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Administration</div>
}
