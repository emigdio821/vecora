import { useLocation } from '@tanstack/react-router'
import { useRef } from 'react'

export function useIsNavigatingAway() {
  const initialPathnameRef = useRef<string | null>(null)
  const location = useLocation()

  if (initialPathnameRef.current === null) {
    initialPathnameRef.current = location.pathname
  }

  return location.pathname !== initialPathnameRef.current
}
