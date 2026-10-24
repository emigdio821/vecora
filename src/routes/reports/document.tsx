import { renderToBuffer } from '@react-pdf/renderer'
import { createFileRoute } from '@tanstack/react-router'
import { DocumentPdf } from '@/components/reports/pdf/document'
import { preparePdfFonts } from '@/components/reports/pdf/layout'
import { getCurrentUser } from '@/lib/auth/current-user'
import { getLogo, getSettings } from '@/lib/db/settings'
import { slugify } from '@/lib/utils'
import { documentSchema } from '@/lib/validations/documents'
import { defaultResidentialLabel } from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'

// Any board member can write a document; the same gate as the _authed layout,
// which doesn't run for server routes. Nothing is stored: the document comes
// in the request and goes back as a PDF.

/**
 * Images come inside the document, so most of this is theirs (a shrunk photo is about
 * 300 KB). Under Vercel's 4.5 MB request limit, so the answer is ours and not a bare 413.
 */
const MAX_BODY_LENGTH = 4_000_000

/** "aviso-de-mantenimiento-2026-10-13.pdf", from the title and the document's date. */
function fileName(title: string, date: string): string {
  const slug = slugify(title)
  return slug ? `${slug}-${date}.pdf` : m.documents_default_file_name()
}

export const Route = createFileRoute('/reports/document')({
  server: { handlers: { POST: ({ request }) => POST(request) } },
})

async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: m.reports_sign_in_required() }, { status: 401 })
  }
  if (user.roles.length === 0 || user.mustSetPassword) {
    return Response.json({ error: m.common_no_permission() }, { status: 403 })
  }

  const body = await request.text()
  if (body.length > MAX_BODY_LENGTH) {
    return Response.json({ error: m.documents_too_long() }, { status: 413 })
  }

  let input: unknown
  try {
    input = JSON.parse(body)
  } catch {
    return Response.json({ error: m.common_form_invalid() }, { status: 400 })
  }

  const parsed = documentSchema.safeParse(input)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? m.common_form_invalid() },
      { status: 400 },
    )
  }

  const settings = await getSettings()
  const residentialName = settings.residentialName || defaultResidentialLabel(settings.defaultLanguage)
  const logo = settings.logoPath ? await getLogo(settings.logoPath) : null
  const generatedBy = user.isMainAdmin
    ? m.common_role_admin({}, { locale: settings.defaultLanguage })
    : user.fullName

  let pdf: Buffer
  try {
    await preparePdfFonts()
    pdf = await renderToBuffer(
      <DocumentPdf
        document={parsed.data}
        residentialName={residentialName}
        language={settings.defaultLanguage}
        logo={logo}
        generatedBy={generatedBy}
        generatedAt={new Date()}
      />,
    )
  } catch (error) {
    console.error('document render failed', error)
    return Response.json({ error: m.documents_generate_failed() }, { status: 500 })
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName(parsed.data.title, parsed.data.date)}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
