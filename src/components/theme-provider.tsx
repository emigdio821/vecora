import { ScriptOnce } from '@tanstack/react-router'
import { createContext, use, useSyncExternalStore } from 'react'

export type Theme = 'system' | 'light' | 'dark'
type ResolvedTheme = 'light' | 'dark'

/** Same key next-themes used, so a saved preference carries over. */
const STORAGE_KEY = 'theme'
/** Fired by setTheme in this tab; the other tabs hear about it through `storage`. */
const THEME_CHANGE_EVENT = 'themechange'
const DARK_QUERY = '(prefers-color-scheme: dark)'

interface ThemeContextValue {
  theme: Theme
  /** `theme` with `system` worked out: what the page shows right now. */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Runs before the first paint, so a dark preference never flashes light. */
const applySavedTheme = `(function () {
  try {
    var theme = localStorage.getItem('${STORAGE_KEY}') || 'system'
    var dark = theme === 'dark' || (theme === 'system' && matchMedia('${DARK_QUERY}').matches)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  } catch (e) {}
})()`

function readSavedTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

function readSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && readSystemTheme() === 'dark')
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

/** Saves the per-device preference and applies it, in this tab and the others. */
export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}

function subscribeToSavedTheme(onChange: () => void) {
  // Picked in another tab: apply it here too. A null key means storage was cleared.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return
    applyTheme(readSavedTheme())
    onChange()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(THEME_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(THEME_CHANGE_EVENT, onChange)
  }
}

function subscribeToSystemTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY)
  const onMediaChange = () => {
    if (readSavedTheme() === 'system') applyTheme('system')
    onChange()
  }
  media.addEventListener('change', onMediaChange)
  return () => {
    media.removeEventListener('change', onMediaChange)
  }
}

/**
 * The per-device theme preference (light, dark or following the system),
 * stored in localStorage and applied as the `dark` class on <html>.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The server can't read either one: it renders (and hydration starts) with
  // the defaults, then React switches to the device's values.
  const theme = useSyncExternalStore(subscribeToSavedTheme, readSavedTheme, () => 'system' as const)
  const systemTheme = useSyncExternalStore(subscribeToSystemTheme, readSystemTheme, () => 'light' as const)

  let resolvedTheme: ResolvedTheme = systemTheme
  if (theme !== 'system') resolvedTheme = theme

  return (
    <ThemeContext value={{ theme, resolvedTheme, setTheme }}>
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
