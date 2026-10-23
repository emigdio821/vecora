import { queryOptions, skipToken } from '@tanstack/react-query'
import { LOGO_URL_SECONDS } from '@/lib/validations/settings'
import { fetchLogoUrl } from '@/server-actions/settings'

export const SETTINGS_QUERY_KEY = 'settings'

export function logoUrlQueryOptions(path: string | null) {
  return queryOptions({
    // Every upload has a new path, so a new logo never reuses the old link.
    queryKey: [SETTINGS_QUERY_KEY, 'logo', path],
    queryFn: path
      ? async () => {
          const url = await fetchLogoUrl()
          if (!url) throw new Error('no logo')
          return url
        }
      : skipToken,
    // Refetch well before the link expires.
    staleTime: (LOGO_URL_SECONDS - 5 * 60) * 1000,
  })
}
