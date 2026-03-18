import { createFileRoute } from '@tanstack/react-router'
import { ResidentialAddressSettings } from '@/components/settings/residential-address/residential-address'
import { ProfileSettings } from '@/components/settings/user-profile/user-profile'
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
      </div>

      <ProfileSettings />
      <ResidentialAddressSettings />
    </div>
  )
}
