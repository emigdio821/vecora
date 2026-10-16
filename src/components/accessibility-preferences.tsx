import { ScriptOnce } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'

export type TextSize = 'normal' | 'large' | 'larger'

const TEXT_SIZE_KEY = 'text-size'
/** Fired by the setter in this tab; the other tabs hear about it through `storage`. */
const CHANGE_EVENT = 'accessibilitychange'

/** Runs before the first paint, so the page never shows at the wrong size first. */
const applySavedPreferences = `(function () {
  try {
    var size = localStorage.getItem('${TEXT_SIZE_KEY}')
    if (size === 'large' || size === 'larger') document.documentElement.setAttribute('data-text-size', size)
  } catch (e) {}
})()`

function readTextSize(): TextSize {
  const saved = localStorage.getItem(TEXT_SIZE_KEY)
  return saved === 'large' || saved === 'larger' ? saved : 'normal'
}

/** The saved text size as an attribute on <html>; globals.css does the rest. */
function applyTextSize() {
  const root = document.documentElement
  const textSize = readTextSize()
  if (textSize === 'normal') {
    root.removeAttribute('data-text-size')
  } else {
    root.setAttribute('data-text-size', textSize)
  }
}

/** Saves the per-device text size and applies it, in this tab and the others. */
export function setTextSize(size: TextSize) {
  localStorage.setItem(TEXT_SIZE_KEY, size)
  applyTextSize()
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(onChange: () => void) {
  // Picked in another tab: apply it here too. A null key means storage was cleared.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== TEXT_SIZE_KEY && event.key !== null) return
    applyTextSize()
    onChange()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

// The server can't read localStorage: it renders with the default, then React
// switches to the device's value.
export function useTextSize() {
  return useSyncExternalStore(subscribe, readTextSize, () => 'normal' as const)
}

/** Put it before the page content, like the theme script. */
export function AccessibilityScript() {
  return <ScriptOnce>{applySavedPreferences}</ScriptOnce>
}
