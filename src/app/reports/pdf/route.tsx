import { renderToBuffer } from '@react-pdf/renderer'
import type { NextRequest } from 'next/server'
import { FinancialReportDocument, isWholeMonth } from '@/components/reports/pdf/financial-report'
import { getCurrentUser } from '@/lib/supabase/current-user'
import { getFinancialReport } from '@/lib/supabase/financial-report'
import { getLogo, getSettings } from '@/lib/supabase/settings'
import { normalizeString } from '@/lib/utils'
import { reportRangeSchema } from '@/lib/validations/reports'
import { DEFAULT_RESIDENTIAL_LABEL } from '@/lib/validations/settings'

// Any board member can pull a report; the same gate as the (authed) layout,
// which doesn't run for route handlers. The data itself goes through RLS.

/** "reporte-loma-verde-coto-404-2026-08.pdf", or "…-2026-08-01_a_2026-08-15.pdf" for a custom range. */
function fileName(residentialName: string, from: string, to: string): string {
  const slug =
    normalizeString(residentialName)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'resido'
  const dates = isWholeMonth(from, to) ? from.slice(0, 7) : `${from}_a_${to}`

  return `reporte-${slug}-${dates}.pdf`
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: 'Inicia sesión para descargar el reporte' }, { status: 401 })
  }
  if (user.roles.length === 0 || user.mustSetPassword) {
    return Response.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const range = reportRangeSchema.safeParse({ from: searchParams.get('from'), to: searchParams.get('to') })
  if (!range.success) {
    return Response.json({ error: range.error.issues[0]?.message ?? 'Fechas inválidas' }, { status: 400 })
  }

  const [report, settings] = await Promise.all([getFinancialReport(range.data), getSettings()]).catch(
    (error: unknown) => {
      console.error('financial_report failed', error)
      return [null, null] as const
    },
  )
  if (!report || !settings) {
    return Response.json({ error: 'No se pudo generar el reporte' }, { status: 500 })
  }

  const residentialName = settings.residentialName || DEFAULT_RESIDENTIAL_LABEL
  const logo = settings.logoPath ? await getLogo(settings.logoPath) : null
  const pdf = await renderToBuffer(
    <FinancialReportDocument
      report={report}
      residentialName={residentialName}
      logo={logo}
      generatedBy={user.fullName}
      generatedAt={new Date()}
    />,
  )

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName(settings.residentialName, range.data.from, range.data.to)}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
