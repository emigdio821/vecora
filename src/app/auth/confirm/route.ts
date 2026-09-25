import type { EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Lands the invite link generated in server-actions/hoa-board.ts. Exchanges
 * the one-time token for a cookie session, then sends the person to choose a
 * password. Anything off goes back to /login with a reason.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

    if (!error) {
      return NextResponse.redirect(new URL('/set-password', origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=invite', origin))
}
