import { createFileRoute } from '@tanstack/react-router'
import { AdministrationTabs } from '@/components/admin/administration-tabs'

export const Route = createFileRoute('/_authed/administration')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <div>
        <h4 className="font-medium text-base leading-normal">Administración</h4>
        <p className="text-muted-foreground text-sm">
          En esta sección puedes administrar los propietarios, usuarios externos, casas, infracciones y pagos.
        </p>
      </div>

      <AdministrationTabs />
    </>
  )
}
