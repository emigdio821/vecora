import { useEffect, useRef, useState } from 'react'

export function useCopyToClipboard({
  timeout = 1000,
  onCopy,
}: {
  timeout?: number
  onCopy?: () => void
} = {}) {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  const copyToClipboard = (value: string) => {
    if (!value || !navigator.clipboard?.writeText) return

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true)
      onCopy?.()

      if (timeout !== 0) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => setIsCopied(false), timeout)
      }
    }, console.error)
  }

  return { isCopied, copyToClipboard }
}
