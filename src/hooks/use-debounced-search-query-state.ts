import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { useDebounce } from './use-debounce'
import { useIsNavigatingAway } from './use-is-navigating-away'

export function useDebouncedSearchQuery(key: string, delay = 300) {
  const isNavigatingAway = useIsNavigatingAway()
  const [queryValue, setQueryValue] = useQueryState(key, parseAsString.withDefault(''))
  const [searchValue, setSearchValue] = useState(queryValue)
  const debouncedSearch = useDebounce(searchValue, delay)

  useEffect(() => {
    if (isNavigatingAway) {
      return
    }

    setSearchValue(queryValue)
  }, [queryValue, isNavigatingAway])

  useEffect(() => {
    if (isNavigatingAway) {
      return
    }

    setQueryValue(debouncedSearch || null)
  }, [debouncedSearch, setQueryValue, isNavigatingAway])

  return [searchValue, setSearchValue, debouncedSearch] as const
}
