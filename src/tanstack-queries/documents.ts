import { queryOptions } from '@tanstack/react-query'
import { fetchSavedTemplates, fetchTemplateDocument } from '@/server-actions/documents'

export const DOCUMENTS_QUERY_KEY = 'documents'

export type SavedTemplateQueryData = Awaited<ReturnType<typeof fetchSavedTemplates>>[number]

export const savedTemplatesQueryOptions = queryOptions({
  queryKey: [DOCUMENTS_QUERY_KEY, 'templates'],
  queryFn: () => fetchSavedTemplates(),
})

/** A saved template's document, read when someone picks it. It never changes once saved, so a second pick reuses the first. */
export function templateDocumentQueryOptions(id: string) {
  return queryOptions({
    // Not under 'templates': saving or renaming one refetches the list, not every document.
    queryKey: [DOCUMENTS_QUERY_KEY, 'template', id],
    queryFn: () => fetchTemplateDocument(id),
    staleTime: Number.POSITIVE_INFINITY,
  })
}
