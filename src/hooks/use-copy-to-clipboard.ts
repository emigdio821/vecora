import { useEffect, useRef, useState } from 'react'

export const COPY_TIMEOUT = 1000

export function useCopyToClipboard({
  timeout = COPY_TIMEOUT,
  onCopy,
}: {
  timeout?: number
  onCopy?: () => void
} = {}) {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)

  const copyToClipboard = (value: string) => {
    if (typeof window === 'undefined' || !navigator.clipboard.writeText) {
      return
    }

    if (!value) return

    navigator.clipboard.writeText(value).then(() => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
      setIsCopied(true)

      if (onCopy) {
        onCopy()
      }

      if (timeout !== 0) {
        timeoutIdRef.current = setTimeout(() => {
          setIsCopied(false)
          timeoutIdRef.current = null
        }, timeout)
      }
    }, console.error)
  }

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
    }
  }, [])

  return { copyToClipboard, isCopied }
}
