import { IconAlertCircle } from '@tabler/icons-react'
import { createFileRoute, redirect } from '@tanstack/react-router'
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
import { isAppPath } from '@/lib/utils'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/_auth/login')({
  validateSearch: z.object({
    // /auth/confirm sends people here when an invite link is expired or reused.
    error: z.literal('invite').optional().catch(undefined),
    // The page to go back to after signing in. Only a path in this app, or
    // a crafted link could send someone to another site right after login.
    redirect: z.string().refine(isAppPath).optional().catch(undefined),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.user) throw redirect({ href: search.redirect ?? '/' })
  },
  head: () =>
    pageHead({
      title: m.auth_login_title(),
      description: m.auth_login_head_description({ appName: siteConfig.name }),
    }),
  component: LoginPage,
})

function LoginPage() {
  const { error, redirect: redirectTo } = Route.useSearch()
  const inviteFailed = error === 'invite'

  return (
    <CardFrame className="w-full max-w-sm">
      <CardFrameHeader>
        <CardFrameTitle>{m.auth_login_title()}</CardFrameTitle>
        <CardFrameDescription>{m.auth_login_description()}</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <CardPanel className="flex flex-col gap-4">
          {inviteFailed && (
            <Alert variant="warning">
              <IconAlertCircle />
              <AlertTitle>{m.auth_invite_invalid_title()}</AlertTitle>
              <AlertDescription>{m.auth_invite_invalid_description()}</AlertDescription>
            </Alert>
          )}
          <LoginForm redirectTo={redirectTo} />
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
