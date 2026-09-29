import { CircleAlertIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { AppFooter } from '@/components/app-footer'
import { VecoraIcon } from '@/components/shared/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from '@/components/ui/card'
import { siteConfig } from '@/lib/config/site'
import { pageMetadata } from '@/lib/metadata'
import { LoginPageClient } from './page.client'

export const metadata: Metadata = pageMetadata({
  title: 'Iniciar sesión',
  description: `Entra a ${siteConfig.name} con tu correo y contraseña.`,
})

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  // /auth/confirm sends people here when an invite link is expired or reused.
  const { error } = await searchParams
  const inviteFailed = error === 'invite'

  return (
    <section className="flex min-h-svh flex-col items-center justify-center">
      <div className="p-4 sm:p-6">
        <div className="mx-auto mb-4 w-full max-w-sm">
          <div className="flex items-center justify-center gap-2">
            <VecoraIcon className="size-4" />
            <span className="text-base font-semibold text-foreground">Vecora</span>
          </div>
        </div>

        <CardFrame className="mx-auto w-full max-w-sm">
          <CardFrameHeader>
            <CardFrameTitle>Iniciar sesión</CardFrameTitle>
            <CardFrameDescription>Ingresa tus credenciales para acceder a tu cuenta.</CardFrameDescription>
          </CardFrameHeader>
          <Card>
            <CardPanel className="flex flex-col gap-4">
              {inviteFailed && (
                <Alert variant="warning">
                  <CircleAlertIcon />
                  <AlertTitle>El enlace de invitación ya no es válido</AlertTitle>
                  <AlertDescription>
                    Puede haber caducado o ya se usó. Pide un enlace nuevo a quien te lo envió.
                  </AlertDescription>
                </Alert>
              )}
              <LoginPageClient />
            </CardPanel>
          </Card>
        </CardFrame>
      </div>

      <AppFooter />
    </section>
  )
}
