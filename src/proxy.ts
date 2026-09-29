import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Run on every path except:
     * - _next/static, _next/image (build assets)
     * - metadata files (favicon.ico, site.webmanifest, robots.txt), the OG
     *   image (api/og) and common image files; signed out, they'd get the
     *   login page's HTML instead
     */
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|robots.txt|api/og|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
