import type { EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Lands the access link generated in server-actions/hoa-board.ts. Exchanges
 * the one-time token for a cookie session, then sends the person to choose a
 * password. Anything off goes back to /login with a reason.
 *
 * If the browser already has a session, using the link would silently replace
 * it, so we first show /auth/confirm/replace and only continue with `replace=1`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL('/login?error=invite', origin))
  }

  const supabase = await createClient()
  const { data: current } = await supabase.auth.getClaims()

  if (current && searchParams.get('replace') !== '1') {
    const url = new URL('/auth/confirm/replace', origin)
    url.searchParams.set('token_hash', tokenHash)
    url.searchParams.set('type', type)
    return NextResponse.redirect(url)
  }

  // Drop the previous session from this browser only; other devices stay signed in.
  if (current) await supabase.auth.signOut({ scope: 'local' })

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
  if (error) {
    return NextResponse.redirect(new URL('/login?error=invite', origin))
  }

  return NextResponse.redirect(new URL('/set-password', origin))
}
