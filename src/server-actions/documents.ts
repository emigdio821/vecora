import type { PostgrestError } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import { type ActionResult, postgrestErrorMessage } from '@/lib/action-result'
import { authMiddleware } from '@/lib/supabase/auth-middleware'
import { createClient } from '@/lib/supabase/server'
import {
  type DocumentTemplateInput,
  documentTemplateSchema,
  type TemplateDetailsInput,
  templateDetailsSchema,
} from '@/lib/validations/documents'
import { m } from '@/paraglide/messages'

// ---------------------------------------------------------------------------
// saved templates
// ---------------------------------------------------------------------------

function toTemplateMessage(error: PostgrestError, fallback: string) {
  return postgrestErrorMessage(error, {
    fallback,
    unique: { document_templates_name_key: m.documents_template_name_taken() },
  })
}

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
    const supabase = await createClient()
    const { error } = await supabase
      .from('document_templates')
      .insert({ ...details, header_title, title, content })

    if (error) {
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

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('document_templates')
      .update(parsed.data)
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) {
      return { error: toTemplateMessage(error, m.documents_template_update_failed()) }
    }
    // Someone else's, and not an admin: RLS filters the row out.
    if (!data) {
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
    const supabase = await createClient()
    const { data, error } = await supabase.from('document_templates').delete().eq('id', id).select('id')

    if (error) {
      return { error: toTemplateMessage(error, m.documents_template_delete_failed()) }
    }
    if (data.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const deleteDocumentTemplate = (id: string) => deleteDocumentTemplateFn({ data: id })
