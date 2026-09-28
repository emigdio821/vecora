import { UserRoundXIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AppFooter } from '@/components/app-footer'
import { ResidoIcon } from '@/components/shared/icons'
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

export const metadata: Metadata = {
  title: 'Sesión activa',
}

/**
 * An access link was opened in a browser that is already signed in. Using it
 * replaces that session, so ask first instead of doing it silently. Reached
 * only from /auth/confirm, which sends the link params along.
 */
export default async function ReplaceSessionPage({ searchParams }: PageProps<'/auth/confirm/replace'>) {
  const params = await searchParams
  const tokenHash = typeof params.token_hash === 'string' ? params.token_hash : null
  const type = typeof params.type === 'string' ? params.type : null
  if (!tokenHash || !type) redirect('/login?error=invite')

  const confirmUrl = new URLSearchParams({ token_hash: tokenHash, type })

  // Session ended in the meantime: nothing to warn about, just use the link.
  const user = await getCurrentUser()
  if (!user) redirect(`/auth/confirm?${confirmUrl}`)

  confirmUrl.set('replace', '1')

  return (
    <main className="flex min-h-svh flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <ResidoIcon className="size-4" />
          <span className="text-base font-semibold text-foreground">Resido</span>
        </div>

        <Empty className="max-w-sm">
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
          <EmptyContent>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" render={<Link href="/" />}>
                Cancelar
              </Button>
              {/* No prefetch: it would hit /auth/confirm and spend the one-time token. */}
              <Button render={<Link href={`/auth/confirm?${confirmUrl}`} prefetch={false} />}>
                Cerrar sesión y continuar
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>

      <AppFooter />
    </main>
  )
}
