import type { EmailOtpType } from '@supabase/supabase-js'
import { IconKey, IconUserX } from '@tabler/icons-react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
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
import { m } from '@/paraglide/messages'

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
      title: m.auth_confirm_head_title(),
      description: m.auth_confirm_head_description({ appName: siteConfig.name }),
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
            <IconUserX />
          </EmptyMedia>
          <EmptyTitle>{m.auth_confirm_session_title()}</EmptyTitle>
          <EmptyDescription>
            {m.auth_confirm_session_before()}{' '}
            <strong className="font-medium text-foreground">{user.fullName}</strong>{' '}
            {m.auth_confirm_session_after({ email: user.email })}
          </EmptyDescription>
        </EmptyHeader>
      ) : (
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconKey />
          </EmptyMedia>
          <EmptyTitle>{m.auth_confirm_access_title()}</EmptyTitle>
          <EmptyDescription>{m.auth_confirm_access_description()}</EmptyDescription>
        </EmptyHeader>
      )}
      <EmptyContent>
        <div className="flex flex-wrap justify-center gap-2">
          {user && (
            <Button variant="outline" render={<Link to="/" />}>
              {m.common_action_cancel()}
            </Button>
          )}
          <ConfirmAccessButton tokenHash={tokenHash} type={type}>
            {user ? m.auth_confirm_sign_out_and_continue() : m.auth_confirm_continue()}
          </ConfirmAccessButton>
        </div>
      </EmptyContent>
    </Empty>
  )
}
