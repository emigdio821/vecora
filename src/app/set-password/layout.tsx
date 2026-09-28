import { AppFooter } from '@/components/app-footer'
import { AppProviders } from '@/components/providers'
import { StoaIcon } from '@/components/shared/icons'

/**
 * Same bare chrome as /login: no sidebar, so someone arriving from an access
 * link has nothing to do but choose a password.
 */
export default function SetPasswordLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <main>
        <section className="flex min-h-svh flex-col items-center justify-center">
          <div className="p-4 sm:p-6">
            <div className="mx-auto mb-4 w-full max-w-sm">
              <div className="flex items-center justify-center gap-2">
                <StoaIcon className="size-4" />
                <span className="text-base font-semibold text-foreground">Stoa</span>
              </div>
            </div>

            {children}
          </div>

          <AppFooter />
        </section>
      </main>
    </AppProviders>
  )
}
