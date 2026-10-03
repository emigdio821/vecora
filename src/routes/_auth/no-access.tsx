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
import { NO_ACCESS_MESSAGE } from '@/lib/validations/auth'

/** Signed in, but not on the board. Reached from the _authed layout. */
export const Route = createFileRoute('/_auth/no-access')({
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: '/login' })
    if (context.user.roles.length > 0) throw redirect({ to: '/' })
    return { user: context.user }
  },
  head: () =>
    pageHead({
      title: 'Sin acceso',
      description: `Tu cuenta aún no tiene acceso a ${siteConfig.name}.`,
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
        <EmptyTitle>Sin acceso</EmptyTitle>
        <EmptyDescription>
          Iniciaste sesión como {user.email}. {NO_ACCESS_MESSAGE}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <LogoutButton />
      </EmptyContent>
    </Empty>
  )
}
