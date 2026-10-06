import { renderToBuffer } from '@react-pdf/renderer'
import { createFileRoute } from '@tanstack/react-router'
import { FinancialReportDocument, isWholeMonth } from '@/components/reports/pdf/financial-report'
import { getCurrentUser } from '@/lib/supabase/current-user'
import { getFinancialReport } from '@/lib/supabase/financial-report'
import { getLogo, getSettings } from '@/lib/supabase/settings'
import { normalizeString } from '@/lib/utils'
import { reportRangeSchema } from '@/lib/validations/reports'
import { defaultResidentialLabel } from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'
import type { Locale } from '@/paraglide/runtime'

// Any board member can pull a report; the same gate as the _authed layout,
// which doesn't run for server routes. The data itself goes through RLS.

/**
 * "vecora-reporte-loma-verde-coto-404-2026-08.pdf", or "…-2026-08-01_a_2026-08-15.pdf"
 * for a custom range. Without a residential name it's just "vecora-reporte-2026-08.pdf".
 */
function fileName(residentialName: string, from: string, to: string, language: Locale): string {
  const slug = normalizeString(residentialName)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const dates = isWholeMonth(from, to)
    ? from.slice(0, 7)
    : m.reports_file_name_range({ from, to }, { locale: language })

  return `${[m.reports_file_name_prefix({}, { locale: language }), slug, dates].filter(Boolean).join('-')}.pdf`
}

export const Route = createFileRoute('/reports/pdf')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
})

async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: m.reports_sign_in_required() }, { status: 401 })
  }
  if (user.roles.length === 0 || user.mustSetPassword) {
    return Response.json({ error: m.common_no_permission() }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const range = reportRangeSchema.safeParse({ from: searchParams.get('from'), to: searchParams.get('to') })
  if (!range.success) {
    return Response.json(
      { error: range.error.issues[0]?.message ?? m.reports_invalid_dates() },
      { status: 400 },
    )
  }

  const [report, settings] = await Promise.all([getFinancialReport(range.data), getSettings()]).catch(
    (error: unknown) => {
      console.error('financial_report failed', error)
      return [null, null] as const
    },
  )
  if (!report || !settings) {
    return Response.json({ error: m.reports_generate_failed() }, { status: 500 })
  }

  const residentialName = settings.residentialName || defaultResidentialLabel(settings.defaultLanguage)
  const logo = settings.logoPath ? await getLogo(settings.logoPath) : null
  const pdf = await renderToBuffer(
    <FinancialReportDocument
      report={report}
      residentialName={residentialName}
      currency={settings.currency}
      language={settings.defaultLanguage}
      logo={logo}
      generatedBy={user.fullName}
      generatedAt={new Date()}
    />,
  )

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName(settings.residentialName, range.data.from, range.data.to, settings.defaultLanguage)}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
