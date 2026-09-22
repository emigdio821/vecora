import type { Metadata } from 'next'
import { AppFooter } from '@/components/app-footer'
import { ResidoIcon } from '@/components/shared/icons'
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from '@/components/ui/card'
import { LoginPageClient } from './page.client'

export const metadata: Metadata = {
  title: {
    default: 'Iniciar sesión',
    template: `%s · Iniciar sesión`,
  },
  description: 'Ingresa tus credenciales para acceder a tu cuenta',
}

export default function LoginPage() {
  return (
    <section className="flex min-h-svh flex-col items-center justify-center">
      <div className="p-4 sm:p-6">
        <div className="mx-auto mb-4 w-full max-w-sm">
          <div className="flex items-center justify-center gap-2">
            <ResidoIcon className="size-4" />
            <span className="text-base font-semibold text-foreground">Resido</span>
          </div>
        </div>

        <CardFrame className="w-full max-w-sm mx-auto">
          <CardFrameHeader>
            <CardFrameTitle>Iniciar sesión</CardFrameTitle>
            <CardFrameDescription>Ingresa tus credenciales para acceder a tu cuenta</CardFrameDescription>
          </CardFrameHeader>
          <Card>
            <CardPanel>
              <LoginPageClient />
            </CardPanel>
          </Card>
        </CardFrame>
      </div>

      <AppFooter />
    </section>
  )
}
