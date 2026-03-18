import { createFileRoute } from '@tanstack/react-router'
import { ResidentialAddressSettings } from '@/components/settings/residential-address'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/settings')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Configuración') }],
  }),
})

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading font-medium text-lg leading-none">Configuración</h1>
        {/*<p className="text-muted-foreground text-sm">
          En esta sección puedes administrar tus notificaciones.
        </p>*/}
      </div>

      <ResidentialAddressSettings />
    </div>
  )
}
