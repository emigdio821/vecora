import { ShieldOffIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AppFooter } from '@/components/app-footer'
import { VecoraIcon } from '@/components/shared/icons'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { siteConfig } from '@/lib/config/site'
import { getCurrentUser } from '@/lib/supabase/current-user'
import { NO_ACCESS_MESSAGE } from '@/lib/validations/auth'
import { LogoutButton } from './logout-button'

export const metadata: Metadata = {
  title: 'Sin acceso',
  description: `Tu cuenta aún no tiene acceso a ${siteConfig.name}.`,
}

/** Signed in, but not on the board. Reached from the (authed) layout. */
export default async function NoAccessPage() {
  const user = await getCurrentUser()

  if (!user) redirect('/login')
  if (user.roles.length > 0) redirect('/')

  return (
    <main className="flex min-h-svh flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <VecoraIcon className="size-4" />
          <span className="text-base font-semibold text-foreground">Vecora</span>
        </div>

        <Empty className="max-w-sm">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldOffIcon />
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
      </div>

      <AppFooter />
    </main>
  )
}
