import { createFileRoute, redirect } from '@tanstack/react-router'
import { SetPasswordForm } from '@/components/auth/set-password-form'
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

/**
 * Only stop for a session that came from an access link (see /auth/confirm).
 * The _authed layout sends those sessions here and nowhere else.
 */
export const Route = createFileRoute('/_auth/set-password')({
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: '/login' })
    // Already signed in with a password: nothing to do here.
    if (!context.user.mustSetPassword) throw redirect({ to: '/' })
    return { user: context.user }
  },
  head: () =>
    pageHead({
      title: 'Crear contraseña',
      description: `Crea la contraseña con la que entrarás a ${siteConfig.name}.`,
    }),
  component: SetPasswordPage,
})

/** Same bare chrome as /login: someone arriving from an access link has nothing to do but choose a password. */
function SetPasswordPage() {
  const { user } = Route.useRouteContext()

  return (
    <CardFrame className="w-full max-w-sm">
      <CardFrameHeader>
        <CardFrameTitle>Crea tu contraseña</CardFrameTitle>
        <CardFrameDescription>
          Para <strong className="font-medium text-foreground">{user.email}</strong>. Con ella entrarás a
          Vecora las próximas veces, junto con tu correo.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <CardPanel>
          <SetPasswordForm />
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
