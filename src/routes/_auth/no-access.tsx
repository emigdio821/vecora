import { IconShieldOff } from '@tabler/icons-react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { LogoutButton } from '@/components/auth/logout-button'
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

/** Signed in, but not on the board. Reached from the _authed layout. */
export const Route = createFileRoute('/_auth/no-access')({
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: '/login' })
    if (context.user.roles.length > 0) throw redirect({ to: '/' })
    return { user: context.user }
  },
  head: () =>
    pageHead({
      title: m.auth_no_access_title(),
      description: m.auth_no_access_head_description({ appName: siteConfig.name }),
    }),
  component: NoAccessPage,
})

function NoAccessPage() {
  const { user } = Route.useRouteContext()

  return (
    <Empty className="max-w-sm">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconShieldOff />
        </EmptyMedia>
        <EmptyTitle>{m.auth_no_access_title()}</EmptyTitle>
        <EmptyDescription>
          {m.auth_no_access_signed_in_as({ email: user.email })} {m.auth_no_access_message()}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <LogoutButton />
      </EmptyContent>
    </Empty>
  )
}
