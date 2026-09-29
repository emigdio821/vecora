import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { VecoraIcon } from '@/components/shared/icons'
import { siteConfig } from '@/lib/config/site'

// One image for every page: everything past the login is private, so there's
// nothing per-page to show. Rendered once at build time.
export const dynamic = 'force-static'

const geistSemiBold = await readFile(join(process.cwd(), 'assets/fonts/Geist-SemiBold.ttf'))

// The light theme's foreground (neutral-800).
const FOREGROUND = '#262626'

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
        backgroundColor: '#ffffff',
        fontFamily: 'Geist',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, color: FOREGROUND }}>
        {/* Like the login header: the logo takes the text color. */}
        <VecoraIcon width={120} height={109} />
        <span style={{ fontSize: 120, fontWeight: 600, letterSpacing: -4 }}>{siteConfig.name}</span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Geist', data: geistSemiBold, weight: 600, style: 'normal' }],
    },
  )
}
