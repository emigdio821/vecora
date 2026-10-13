import interItalicUrl from '@fontsource/inter/files/inter-latin-400-italic.woff?inline'
import interRegularUrl from '@fontsource/inter/files/inter-latin-400-normal.woff?inline'
import interSemiBoldItalicUrl from '@fontsource/inter/files/inter-latin-600-italic.woff?inline'
import interSemiBoldUrl from '@fontsource/inter/files/inter-latin-600-normal.woff?inline'
import { Font, Image, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import { VECORA_MARK } from '@/components/shared/icons'
import { capitalize, intlLocale } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import type { Locale } from '@/paraglide/runtime'

// What every PDF shares: fonts, colors, page margins, and the header and
// footer repeated on each page. Only react-pdf primitives here: no DOM, no Tailwind.

// Inter, like the app. The app's variable woff2 would render every weight as
// regular here, so this uses the static woff files, bundled as data URLs;
// react-pdf embeds just the glyphs the document uses.
Font.register({
  family: 'Inter',
  fonts: [
    { src: interRegularUrl, fontWeight: 400 },
    { src: interItalicUrl, fontWeight: 400, fontStyle: 'italic' },
    { src: interSemiBoldUrl, fontWeight: 600 },
    { src: interSemiBoldItalicUrl, fontWeight: 600, fontStyle: 'italic' },
  ],
})

// The built-in hyphenation is English ("mantenimien-to"); wrap whole words.
Font.registerHyphenationCallback((word) => [word])

export const COLOR = {
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  panel: '#f9fafb',
  income: '#15803d',
  expense: '#b91c1c',
  /** A balance below zero, like the app's balance. */
  destructive: '#b91c1c',
}

export const layoutStyles = StyleSheet.create({
  page: {
    paddingTop: 84,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: 'Inter',
    fontSize: 9,
    color: COLOR.text,
  },
  header: {
    position: 'absolute',
    top: 32,
    left: 40,
    right: 40,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Fixed height, width from the image's own proportions (capped for wide
  // wordmarks), so the name sits right next to it whatever the shape.
  logo: { height: 32, maxWidth: 120, objectFit: 'contain', objectPosition: 'left' },
  residential: { fontSize: 13, fontWeight: 600 },
  headerSubtitle: { fontSize: 9, color: COLOR.muted, marginTop: 2 },
  headerAside: { fontSize: 10, fontWeight: 600, textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: COLOR.muted,
  },
  // A signature, not a co-brand: the residential's logo leads the header.
  footerSignature: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerMark: { width: 7.5 * (VECORA_MARK.width / VECORA_MARK.height), height: 7.5 },
  footerAppName: { fontWeight: 600 },
})

/**
 * "2 de Octubre de 2026 a las 3:15 p.m.", months capitalized like the rest of
 * the app. Intl puts a narrow no-break space (U+202F) before "p.m.", which the
 * PDF font has no glyph for, so every space becomes a plain one.
 */
function formatGeneratedAt(date: Date, language: Locale): string {
  // The server may run in UTC; the document is read in the residential's time.
  return new Intl.DateTimeFormat(intlLocale(language), {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  })
    .formatToParts(date)
    .map((part) => (part.type === 'month' ? capitalize(part.value) : part.value))
    .join('')
    .replace(/\s/g, ' ')
}

interface PageHeaderProps {
  residentialName: string
  /** PNG bytes; without it the header shows only the name. */
  logo: Buffer | null
  /** Under the name: what the document is. */
  subtitle: string
  /** On the right: the date or range it covers. */
  aside: string
}

/** Logo, name and what the document is, repeated at the top of every page. */
export function PageHeader({ residentialName, logo, subtitle, aside }: PageHeaderProps) {
  return (
    <View style={layoutStyles.header} fixed>
      <View style={layoutStyles.brand}>
        {logo && <Image style={layoutStyles.logo} src={{ data: logo, format: 'png' }} />}
        <View>
          <Text style={layoutStyles.residential}>{residentialName}</Text>
          <Text style={layoutStyles.headerSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text style={layoutStyles.headerAside}>{aside}</Text>
    </View>
  )
}

interface PageFooterProps {
  generatedBy: string
  generatedAt: Date
  language: Locale
}

/** Who generated it and when, and the page number, repeated at the bottom of every page. */
export function PageFooter({ generatedBy, generatedAt, language }: PageFooterProps) {
  const locale = { locale: language }

  return (
    <View style={layoutStyles.footer} fixed>
      <View style={layoutStyles.footerSignature}>
        <Text>
          {m.reports_pdf_generated(
            { date: formatGeneratedAt(generatedAt, language), name: generatedBy },
            locale,
          )}
        </Text>
        <Text>-</Text>
        <Svg viewBox={VECORA_MARK.viewBox} style={layoutStyles.footerMark}>
          <Path d={VECORA_MARK.path} fill={COLOR.muted} fillRule="evenodd" />
        </Svg>
        <Text style={layoutStyles.footerAppName}>{m.common_app_name({}, locale)}</Text>
      </View>
      <Text
        render={({ pageNumber, totalPages }) =>
          m.reports_pdf_page({ page: pageNumber, total: totalPages }, locale)
        }
      />
    </View>
  )
}
