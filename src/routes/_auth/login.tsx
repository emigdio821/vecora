import { createFileRoute, redirect } from '@tanstack/react-router'
import { CircleAlertIcon } from 'lucide-react'
import { z } from 'zod'
import { LoginForm } from '@/components/auth/login-form'
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
import { pageHead } from '@/lib/metadata'

export const Route = createFileRoute('/_auth/login')({
  // /auth/confirm sends people here when an invite link is expired or reused.
  validateSearch: z.object({ error: z.literal('invite').optional().catch(undefined) }),
  beforeLoad: ({ context }) => {
    if (context.user) throw redirect({ to: '/' })
  },
  head: () =>
    pageHead({
      title: 'Iniciar sesión',
      description: `Entra a ${siteConfig.name} con tu correo y contraseña.`,
    }),
  component: LoginPage,
})

function LoginPage() {
  const { error } = Route.useSearch()
  const inviteFailed = error === 'invite'

  return (
    <CardFrame className="w-full max-w-sm">
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
          <LoginForm />
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
