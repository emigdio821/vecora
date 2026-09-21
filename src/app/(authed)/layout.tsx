import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/server-actions/auth'

/**
 * Every route under (authed) requires a signed-in user.
 * proxy.ts redirects early as an optimisation; this check is the real gate.
 */
export default async function AuthedLayout({ children }: LayoutProps<'/'>) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data) {
    redirect('/login')
  }

  return (
    <>
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-semibold">Resido</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{data.claims.email}</span>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      {children}
    </>
  )
}
