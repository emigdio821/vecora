import { createFileRoute } from '@tanstack/react-router'
import { AdministrationTabs } from '@/components/admin/administration-tabs'

export const Route = createFileRoute('/_authed/_admin/administration')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <div>
        <h4 className="font-medium text-base leading-normal">Administración</h4>
        <p className="text-muted-foreground text-sm">
          En esta sección puedes administrar los propietarios, casas, infracciones, pagos y usuarios externos.
        </p>
      </div>

      <AdministrationTabs />
    </>
  )
}
