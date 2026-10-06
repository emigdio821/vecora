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
import { m } from '@/paraglide/messages'

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
      title: m.auth_set_password_head_title(),
      description: m.auth_set_password_head_description({ appName: siteConfig.name }),
    }),
  component: SetPasswordPage,
})

/** Same bare chrome as /login: someone arriving from an access link has nothing to do but choose a password. */
function SetPasswordPage() {
  const { user } = Route.useRouteContext()

  return (
    <CardFrame className="w-full max-w-sm">
      <CardFrameHeader>
        <CardFrameTitle>{m.auth_set_password_title()}</CardFrameTitle>
        <CardFrameDescription>
          {m.auth_set_password_for_before()}{' '}
          <strong className="font-medium text-foreground">{user.email}</strong>
          {m.auth_set_password_for_after()}
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
