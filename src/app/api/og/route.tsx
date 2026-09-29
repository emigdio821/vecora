import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { VecoraIcon } from '@/components/shared/icons'
import { siteConfig } from '@/lib/config/site'

// Link previews: /api/og?title=…&description=… (both optional). Build the URL
// with ogImageUrl() in lib/metadata.ts.

const [geistRegular, geistSemiBold] = await Promise.all([
  readFile(join(process.cwd(), 'assets/fonts/Geist-Regular.ttf')),
  readFile(join(process.cwd(), 'assets/fonts/Geist-SemiBold.ttf')),
])

// The light theme's foreground (neutral-800) and muted foreground.
const FOREGROUND = '#262626'
const MUTED = '#686868'

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title')?.trim() || siteConfig.name
  const description = searchParams.get('description')?.trim()

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 28,
        padding: 96,
        backgroundColor: '#ffffff',
        fontFamily: 'Geist',
      }}
    >
      {/* lineClamp (display: block) ends long text with "…" instead of running off the image. */}
      <span
        style={{
          display: 'block',
          lineClamp: 2,
          fontSize: 88,
          fontWeight: 600,
          letterSpacing: -3,
          lineHeight: 1.1,
          color: FOREGROUND,
        }}
      >
        {title}
      </span>
      {description && (
        <span
          style={{
            display: 'block',
            lineClamp: 3,
            maxWidth: 860,
            fontSize: 40,
            fontWeight: 400,
            lineHeight: 1.4,
            color: MUTED,
          }}
        >
          {description}
        </span>
      )}
      {/* Like the login header: the logo takes the text color. */}
      <VecoraIcon
        width={88}
        height={80}
        style={{ position: 'absolute', right: 80, bottom: 72, color: FOREGROUND }}
      />
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Geist', data: geistRegular, weight: 400, style: 'normal' },
        { name: 'Geist', data: geistSemiBold, weight: 600, style: 'normal' },
      ],
    },
  )
}
