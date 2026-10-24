import { createServerFn } from '@tanstack/react-start'
import { type ActionResult, errorMessage } from '@/lib/action-result'
import { boardMiddleware, requirePermission } from '@/lib/auth/middleware'
import { db, transactionAs } from '@/lib/db'
import { documentTemplates } from '@/lib/db/schema'
import * as documents from '@/lib/services/documents'
import {
  documentContentSchema,
  type DocumentTemplateInput,
  documentTemplateSchema,
  type TemplateDetailsInput,
  templateDetailsSchema,
} from '@/lib/validations/documents'
import { m } from '@/paraglide/messages'

const documentWrite = requirePermission({ document: ['write'] })

// ---------------------------------------------------------------------------
// saved templates
// ---------------------------------------------------------------------------

function toTemplateMessage(error: unknown, fallback: string) {
  return errorMessage(error, {
    fallback,
    constraints: { document_templates_name_key: m.documents_template_name_taken() },
  })
}

/**
 * The board's saved templates, by name. Without their documents: with images, those are
 * megabytes. `author` is null once the author's account is gone (the column is set null).
 */
const fetchSavedTemplatesFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(async () => {
    const templates = await db.query.documentTemplates.findMany({
      columns: { id: true, name: true, description: true, createdAt: true, createdBy: true },
      with: { createdByUser: { columns: { name: true } } },
      orderBy: { name: 'asc' },
    })

    return templates.map(({ createdByUser, ...template }) => ({ ...template, author: createdByUser }))
  })

export const fetchSavedTemplates = () => fetchSavedTemplatesFn()

/**
 * A saved template's document, in the editor's shape. Checked like any document: one the
 * PDF can no longer draw (the editor changed since) fails here, not in the editor.
 */
const fetchTemplateDocumentFn = createServerFn()
  .middleware([boardMiddleware])
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const template = await db.query.documentTemplates.findFirst({
      columns: { headerTitle: true, title: true, content: true },
      where: { id },
    })
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

/** Under the name of whoever saves it, for the whole board. */
const saveDocumentTemplateFn = createServerFn({ method: 'POST' })
  .middleware([documentWrite])
  .validator((input: DocumentTemplateInput) => input)
  .handler(async ({ data: input, context }): Promise<ActionResult> => {
    const parsed = documentTemplateSchema.safeParse(input)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? m.common_form_invalid() }
    }

    const { details, header_title, title, content } = parsed.data
    try {
      await transactionAs(context.user.id, (tx) =>
        tx.insert(documentTemplates).values({
          ...details,
          headerTitle: header_title,
          title,
          content,
          createdBy: context.user.id,
        }),
      )
    } catch (error) {
      return { error: toTemplateMessage(error, m.documents_template_save_failed()) }
    }

    return { data: undefined }
  })

export const saveDocumentTemplate = (input: DocumentTemplateInput) => saveDocumentTemplateFn({ data: input })

/** The name and description only: the document itself stays as it was saved. */
const updateDocumentTemplateFn = createServerFn({ method: 'POST' })
  .middleware([documentWrite])
  .validator((data: { id: string; input: TemplateDetailsInput }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult> => {
    const parsed = templateDetailsSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    try {
      await transactionAs(context.user.id, (tx) =>
        documents.renameTemplate(tx, context.user, id, parsed.data),
      )
    } catch (error) {
      return { error: toTemplateMessage(error, m.documents_template_update_failed()) }
    }

    return { data: undefined }
  })

export const updateDocumentTemplate = (id: string, input: TemplateDetailsInput) =>
  updateDocumentTemplateFn({ data: { id, input } })

const deleteDocumentTemplateFn = createServerFn({ method: 'POST' })
  .middleware([documentWrite])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }): Promise<ActionResult> => {
    try {
      await transactionAs(context.user.id, (tx) => documents.deleteTemplate(tx, context.user, id))
    } catch (error) {
      return { error: toTemplateMessage(error, m.documents_template_delete_failed()) }
    }

    return { data: undefined }
  })

export const deleteDocumentTemplate = (id: string) => deleteDocumentTemplateFn({ data: id })
