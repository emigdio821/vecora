import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
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
import { getCurrentUser } from '@/lib/supabase/current-user'
import { SetPasswordForm } from './set-password-form'

export const metadata: Metadata = pageMetadata({
  title: 'Crear contraseña',
  description: `Crea la contraseña con la que entrarás a ${siteConfig.name}.`,
})

/**
 * Only stop for a session that came from an access link (see /auth/confirm).
 * The (authed) layout sends those sessions here and nowhere else.
 */
export default async function SetPasswordPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  // Already signed in with a password: nothing to do here.
  if (!user.mustSetPassword) redirect('/')

  return (
    <CardFrame className="mx-auto w-full max-w-sm">
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
