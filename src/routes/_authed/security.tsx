import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/security')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Security</div>
}
