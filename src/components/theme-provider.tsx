import { ScriptOnce } from '@tanstack/react-router'
import { createContext, use, useEffect, useState } from 'react'

export type Theme = 'system' | 'light' | 'dark'

/** Same key next-themes used, so a saved preference carries over. */
const STORAGE_KEY = 'theme'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Runs before the first paint, so a dark preference never flashes light. */
const applySavedTheme = `(function () {
  try {
    var theme = localStorage.getItem('${STORAGE_KEY}') || 'system'
    var dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  } catch (e) {}
})()`

function readSavedTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  // Switch without every element animating its colors at once.
  const freeze = document.createElement('style')
  freeze.textContent = '*,*::before,*::after{transition:none!important}'
  document.head.append(freeze)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  // Force a style recalc before removing the override.
  void window.getComputedStyle(document.body).opacity
  freeze.remove()
}

/**
 * The per-device theme preference (light, dark or following the system),
 * stored in localStorage and applied as the `dark` class on <html>.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readSavedTheme)

  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      applyTheme('system')
    }
    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [theme])

  function setTheme(next: Theme) {
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
    setThemeState(next)
  }

  return (
    <ThemeContext value={{ theme, setTheme }}>
      <ScriptOnce>{applySavedTheme}</ScriptOnce>
      {children}
    </ThemeContext>
  )
}

export function useTheme() {
  const context = use(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
