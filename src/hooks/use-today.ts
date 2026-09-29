import { useState } from 'react'

/**
 * The date when the component mounted. Reading `new Date()` during render
 * would give a new value on every re-render; this one stays put, which is
 * fine for "today" in pickers and summaries.
 */
export function useToday(): Date {
  const [today] = useState(() => new Date())
  return today
}
