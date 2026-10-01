import type { EmailOtpType } from '@supabase/supabase-js'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { KeyRoundIcon, UserRoundXIcon } from 'lucide-react'
import { z } from 'zod'
import { ConfirmAccessButton } from '@/components/auth/confirm-access-button'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { siteConfig } from '@/lib/config/site'
import { pageHead } from '@/lib/metadata'

/**
 * Lands the access link generated in server-actions/hoa-board.ts. Opening it
 * changes nothing: link previews (WhatsApp) and email scanners fetch the URL
 * too, and would otherwise spend the one-time token before the person taps
 * it. The token is only used by the button (see confirmAccessLink).
 *
 * If the browser already has a session, using the link replaces it, so the
 * page says whose session will close.
 */
export const Route = createFileRoute('/_auth/auth/confirm')({
  validateSearch: z.object({
    token_hash: z.string().optional().catch(undefined),
    type: z.string().optional().catch(undefined),
  }),
  beforeLoad: ({ search }) => {
    if (!search.token_hash || !search.type) {
      throw redirect({ to: '/login', search: { error: 'invite' } })
    }
    return { tokenHash: search.token_hash, type: search.type as EmailOtpType }
  },
  // The link is shared over WhatsApp, so this is also its preview.
  head: () =>
    pageHead({
      title: 'Confirmar acceso',
      description: `Recibiste un enlace de acceso a ${siteConfig.name}. Ábrelo para crear tu contraseña.`,
    }),
  component: ConfirmAccessPage,
})

function ConfirmAccessPage() {
  const { user, tokenHash, type } = Route.useRouteContext()

  return (
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
            Este es tu enlace de acceso a Vecora. Continúa para crear tu contraseña.
          </EmptyDescription>
        </EmptyHeader>
      )}
      <EmptyContent>
        <div className="flex flex-wrap justify-center gap-2">
          {user && (
            <Button variant="outline" render={<Link to="/" />}>
              Cancelar
            </Button>
          )}
          <ConfirmAccessButton tokenHash={tokenHash} type={type}>
            {user ? 'Cerrar sesión y continuar' : 'Continuar'}
          </ConfirmAccessButton>
        </div>
      </EmptyContent>
    </Empty>
  )
}
