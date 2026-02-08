import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/notifications')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading font-medium text-lg leading-none">Notificaciones</h1>
      <p className="text-muted-foreground text-sm">En esta sección puedes administrar tus notificaciones.</p>
    </div>
  )
}
