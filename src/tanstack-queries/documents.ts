import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { documentContentSchema } from '@/lib/validations/documents'

export const DOCUMENTS_QUERY_KEY = 'documents'

/** The board's saved templates, by name. Without their documents: with images, those are megabytes. */
function savedTemplatesQuery() {
  return createClient()
    .from('document_templates')
    .select('id, name, description, created_at, created_by, author:profiles!created_by ( full_name )')
    .order('name')
}

export type SavedTemplateQueryData = QueryData<ReturnType<typeof savedTemplatesQuery>>[number]

export const savedTemplatesQueryOptions = queryOptions({
  queryKey: [DOCUMENTS_QUERY_KEY, 'templates'],
  queryFn: async () => {
    const { data, error } = await savedTemplatesQuery()
    if (error) throw error
    return data
  },
})

/**
 * A saved template's document, read when someone picks it. It never changes once saved,
 * so a second pick reuses the first. Checked like any document: one the PDF can no longer
 * draw (the editor changed since) fails here, not in the editor.
 */
export function templateDocumentQueryOptions(id: string) {
  return queryOptions({
    // Not under 'templates': saving or renaming one refetches the list, not every document.
    queryKey: [DOCUMENTS_QUERY_KEY, 'template', id],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('document_templates')
        .select('header_title, title, content')
        .eq('id', id)
        .single()
      if (error) throw error
      return { ...data, content: documentContentSchema.parse(data.content) }
    },
    staleTime: Number.POSITIVE_INFINITY,
  })
}
