import { Resvg } from '@resvg/resvg-js'
import { createFileRoute } from '@tanstack/react-router'
import satori from 'satori'
import { VecoraIcon } from '@/components/shared/icons'
import { siteConfig } from '@/lib/config/site'
import geistRegularUrl from '../../../assets/fonts/Geist-Regular.ttf?inline'
import geistSemiBoldUrl from '../../../assets/fonts/Geist-SemiBold.ttf?inline'

// Link previews: /api/og?title=…&description=… (both optional). Build the URL
// with ogImageUrl() in lib/metadata.ts.

export const Route = createFileRoute('/api/og')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
})

/** `?inline` bundles the fonts as data URLs, so there are no files to ship next to the function. */
function fromDataUrl(url: string): ArrayBuffer {
  const bytes = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64')
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

const geistRegular = fromDataUrl(geistRegularUrl)
const geistSemiBold = fromDataUrl(geistSemiBoldUrl)

// The light theme's foreground (neutral-800) and muted foreground.
const FOREGROUND = '#262626'
const MUTED = '#686868'

const WIDTH = 1200
const HEIGHT = 630

// satori lays the JSX out as SVG and resvg rasterizes it: what @vercel/og's
// ImageResponse does, minus its Node build that breaks outside webpack.
async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')?.trim() || siteConfig.name
  const description = searchParams.get('description')?.trim()

  const svg = await satori(
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
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'Geist', data: geistRegular, weight: 400, style: 'normal' },
        { name: 'Geist', data: geistSemiBold, weight: 600, style: 'normal' },
      ],
    },
  )
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng()

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, immutable, max-age=31536000' },
  })
}
