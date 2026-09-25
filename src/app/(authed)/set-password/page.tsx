import type { Metadata } from 'next'
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from '@/components/ui/card'
import { SetPasswordForm } from './set-password-form'

export const metadata: Metadata = {
  title: 'Crear contraseña',
}

/** First stop after opening an invite link (see /auth/confirm). */
export default function SetPasswordPage() {
  return (
    <CardFrame className="mx-auto w-full max-w-sm">
      <CardFrameHeader>
        <CardFrameTitle>Crea tu contraseña</CardFrameTitle>
        <CardFrameDescription>
          Con ella entrarás a Resido las próximas veces, junto con tu correo.
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
