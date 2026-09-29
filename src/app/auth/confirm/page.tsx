import type { EmailOtpType } from '@supabase/supabase-js'
import { KeyRoundIcon, UserRoundXIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AppFooter } from '@/components/app-footer'
import { VecoraIcon } from '@/components/shared/icons'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { getCurrentUser } from '@/lib/supabase/current-user'
import { ConfirmAccessButton } from './confirm-access-button'

export const metadata: Metadata = {
  title: 'Acceso a Vecora',
}

/**
 * Lands the access link generated in server-actions/hoa-board.ts. Opening it
 * changes nothing: link previews (WhatsApp) and email scanners fetch the URL
 * too, and would otherwise spend the one-time token before the person taps
 * it. The token is only used by the button (see confirmAccessLink).
 *
 * If the browser already has a session, using the link replaces it, so the
 * page says whose session will close.
 */
export default async function ConfirmAccessPage({ searchParams }: PageProps<'/auth/confirm'>) {
  const params = await searchParams
  const tokenHash = typeof params.token_hash === 'string' ? params.token_hash : null
  const type = typeof params.type === 'string' ? (params.type as EmailOtpType) : null
  if (!tokenHash || !type) redirect('/login?error=invite')

  const user = await getCurrentUser()

  return (
    <main className="flex min-h-svh flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <VecoraIcon className="size-4" />
          <span className="text-base font-semibold text-foreground">Vecora</span>
        </div>

        <Empty className="max-w-sm">
          {user ? (
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserRoundXIcon />
              </EmptyMedia>
              <EmptyTitle>Ya hay una sesión iniciada</EmptyTitle>
              <EmptyDescription>
                Este navegador tiene la sesión de{' '}
                <strong className="font-medium text-foreground">{user.fullName}</strong> ({user.email}). Si
                continúas con el enlace de acceso, esa sesión se cerrará aquí.
              </EmptyDescription>
            </EmptyHeader>
          ) : (
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <KeyRoundIcon />
              </EmptyMedia>
              <EmptyTitle>Tu acceso a Vecora</EmptyTitle>
              <EmptyDescription>
                La mesa directiva te envió este enlace. Continúa para crear tu contraseña.
              </EmptyDescription>
            </EmptyHeader>
          )}
          <EmptyContent>
            <div className="flex flex-wrap justify-center gap-2">
              {user && (
                <Button variant="outline" render={<Link href="/" />}>
                  Cancelar
                </Button>
              )}
              <ConfirmAccessButton tokenHash={tokenHash} type={type}>
                {user ? 'Cerrar sesión y continuar' : 'Continuar'}
              </ConfirmAccessButton>
            </div>
          </EmptyContent>
        </Empty>
      </div>

      <AppFooter />
    </main>
  )
}
