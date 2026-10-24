import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { type ActionResult, databaseError, postgrestErrorMessage } from '@/lib/action-result'
import { authMiddleware } from '@/lib/auth/middleware'
import { withCurrentUser } from '@/lib/db/current-user'
import { documentTemplates } from '@/lib/db/schema'
import {
  documentContentSchema,
  type DocumentTemplateInput,
  documentTemplateSchema,
  type TemplateDetailsInput,
  templateDetailsSchema,
} from '@/lib/validations/documents'
import { m } from '@/paraglide/messages'

// ---------------------------------------------------------------------------
// saved templates
// ---------------------------------------------------------------------------

function toTemplateMessage(error: unknown, fallback: string) {
  return postgrestErrorMessage(databaseError(error), {
    fallback,
    unique: { document_templates_name_key: m.documents_template_name_taken() },
  })
}

/**
 * The board's saved templates, by name. Without their documents: with images, those are
 * megabytes. The rows keep the database's column names and ISO timestamps.
 */
const fetchSavedTemplatesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const templates = await withCurrentUser((tx) =>
      tx.query.documentTemplates.findMany({
        columns: { id: true, name: true, description: true, createdAt: true, createdBy: true },
        with: { profile: { columns: { fullName: true } } },
        orderBy: { name: 'asc' },
      }),
    )

    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      created_at: template.createdAt.toISOString(),
      created_by: template.createdBy,
      // Null once the author's account is gone (the column is set null).
      author: template.profile ? { full_name: template.profile.fullName } : null,
    }))
  })

export const fetchSavedTemplates = () => fetchSavedTemplatesFn()

/**
 * A saved template's document. Checked like any document: one the PDF can no longer
 * draw (the editor changed since) fails here, not in the editor.
 */
const fetchTemplateDocumentFn = createServerFn()
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const template = await withCurrentUser((tx) =>
      tx.query.documentTemplates.findFirst({
        columns: { headerTitle: true, title: true, content: true },
        where: { id },
      }),
    )
    if (!template) {
      throw new Error(`document template ${id} not found`)
    }

    return {
      header_title: template.headerTitle,
      title: template.title,
      content: documentContentSchema.parse(template.content),
    }
  })

export const fetchTemplateDocument = (id: string) => fetchTemplateDocumentFn({ data: id })

/** Under the name of whoever saves it (the column's default), for the whole board. */
const saveDocumentTemplateFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: DocumentTemplateInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult> => {
    const parsed = documentTemplateSchema.safeParse(input)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? m.common_form_invalid() }
    }

    const { details, header_title, title, content } = parsed.data
    try {
      await withCurrentUser((tx) =>
        tx.insert(documentTemplates).values({ ...details, headerTitle: header_title, title, content }),
      )
    } catch (error) {
      return { error: toTemplateMessage(error, m.documents_template_save_failed()) }
    }

    return { data: undefined }
  })

export const saveDocumentTemplate = (input: DocumentTemplateInput) => saveDocumentTemplateFn({ data: input })

/** The name and description only: the document itself stays as it was saved. */
const updateDocumentTemplateFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; input: TemplateDetailsInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = templateDetailsSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    let updated: Array<{ id: string }>
    try {
      updated = await withCurrentUser((tx) =>
        tx
          .update(documentTemplates)
          .set(parsed.data)
          .where(eq(documentTemplates.id, id))
          .returning({ id: documentTemplates.id }),
      )
    } catch (error) {
      return { error: toTemplateMessage(error, m.documents_template_update_failed()) }
    }
    // Someone else's, and not an admin: RLS filters the row out.
    if (updated.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const updateDocumentTemplate = (id: string, input: TemplateDetailsInput) =>
  updateDocumentTemplateFn({ data: { id, input } })

const deleteDocumentTemplateFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    let deleted: Array<{ id: string }>
    try {
      deleted = await withCurrentUser((tx) =>
        tx
          .delete(documentTemplates)
          .where(eq(documentTemplates.id, id))
          .returning({ id: documentTemplates.id }),
      )
    } catch (error) {
      return { error: toTemplateMessage(error, m.documents_template_delete_failed()) }
    }
    if (deleted.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const deleteDocumentTemplate = (id: string) => deleteDocumentTemplateFn({ data: id })
