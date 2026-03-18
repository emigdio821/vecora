import { useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { useIsNavigatingAway } from './use-is-navigating-away'

export function useTabQueryState(key: string, defaultValue: string) {
  const isNavigatingAway = useIsNavigatingAway()
  const [queryValue, setQueryValue] = useQueryState(key, { defaultValue })
  const [searchValue, setSearchValue] = useState(queryValue)

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

    setQueryValue(searchValue || null)
  }, [searchValue, setQueryValue, isNavigatingAway])

  return [searchValue, setSearchValue] as const
}
