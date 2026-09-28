import { queryOptions, skipToken } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { LOGO_BUCKET } from '@/lib/validations/settings'

export const SETTINGS_QUERY_KEY = 'settings'

/** The bucket is private, so the preview goes through a link that expires. */
const LOGO_URL_SECONDS = 60 * 60

export function logoUrlQueryOptions(path: string | null) {
  return queryOptions({
    // Every upload has a new path, so a new logo never reuses the old link.
    queryKey: [SETTINGS_QUERY_KEY, 'logo', path],
    queryFn: path
      ? async () => {
          const { data, error } = await createClient()
            .storage.from(LOGO_BUCKET)
            .createSignedUrl(path, LOGO_URL_SECONDS)
          if (error) throw error
          return data.signedUrl
        }
      : skipToken,
    // Refetch well before the link expires.
    staleTime: (LOGO_URL_SECONDS - 5 * 60) * 1000,
  })
}
