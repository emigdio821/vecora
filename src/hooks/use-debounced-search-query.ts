import { parseAsString, useQueryState } from 'nuqs'
import { useCallback, useEffect, useRef, useState } from 'react'

export function useDebouncedSearchQuery(key: string, delay = 300) {
  const [queryValue, setQueryValue] = useQueryState(key, parseAsString.withDefault(''))
  const [inputValue, setInputValue] = useState(queryValue)
  const [debouncedValue, setDebouncedValue] = useState(queryValue)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInternalUpdate = useRef(false)

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    setInputValue(queryValue)
    setDebouncedValue(queryValue)
  }, [queryValue])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const setValue = useCallback(
    (next: string) => {
      setInputValue(next)

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        setDebouncedValue(next)
        isInternalUpdate.current = true
        setQueryValue(next || null)
        timerRef.current = null
      }, delay)
    },
    [delay, setQueryValue],
  )

  return [inputValue, setValue, debouncedValue] as const
}
