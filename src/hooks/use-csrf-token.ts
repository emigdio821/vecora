import { useEffect, useState } from 'react'

/**
 * Hook to get CSRF token from cookie
 * This token should be included in the X-CSRF-Token header for protected requests
 */
export function useCsrfToken(): string | null {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Get CSRF token from cookie
    const getCsrfToken = () => {
      const cookies = document.cookie.split(';').map((c) => c.trim())
      const csrfCookie = cookies.find((c) => c.startsWith('csrf_token='))

      if (csrfCookie) {
        return csrfCookie.split('=')[1] || null
      }

      return null
    }

    setToken(getCsrfToken())
  }, [])

  return token
}
