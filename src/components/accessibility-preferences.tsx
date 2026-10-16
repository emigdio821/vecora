import { ScriptOnce } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'

export type TextSize = 'normal' | 'large' | 'larger'

const TEXT_SIZE_KEY = 'text-size'
const REDUCE_MOTION_KEY = 'reduce-motion'
/** Fired by the setters in this tab; the other tabs hear about it through `storage`. */
const CHANGE_EVENT = 'accessibilitychange'

/** Runs before the first paint, so the page never shows at the wrong size first. */
const applySavedPreferences = `(function () {
  try {
    var size = localStorage.getItem('${TEXT_SIZE_KEY}')
    if (size === 'large' || size === 'larger') document.documentElement.setAttribute('data-text-size', size)
    if (localStorage.getItem('${REDUCE_MOTION_KEY}') === 'true') document.documentElement.setAttribute('data-reduce-motion', '')
  } catch (e) {}
})()`

function readTextSize(): TextSize {
  const saved = localStorage.getItem(TEXT_SIZE_KEY)
  return saved === 'large' || saved === 'larger' ? saved : 'normal'
}

function readReduceMotion(): boolean {
  return localStorage.getItem(REDUCE_MOTION_KEY) === 'true'
}

/** The saved preferences as attributes on <html>; globals.css does the rest. */
function applyPreferences() {
  const root = document.documentElement
  const textSize = readTextSize()
  if (textSize === 'normal') {
    root.removeAttribute('data-text-size')
  } else {
    root.setAttribute('data-text-size', textSize)
  }
  root.toggleAttribute('data-reduce-motion', readReduceMotion())
}

/** Saves the per-device text size and applies it, in this tab and the others. */
export function setTextSize(size: TextSize) {
  localStorage.setItem(TEXT_SIZE_KEY, size)
  applyPreferences()
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Saves whether to cut animations on this device, even if the device doesn't ask for it. */
export function setReduceMotion(reduce: boolean) {
  localStorage.setItem(REDUCE_MOTION_KEY, String(reduce))
  applyPreferences()
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(onChange: () => void) {
  // Picked in another tab: apply it here too. A null key means storage was cleared.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== TEXT_SIZE_KEY && event.key !== REDUCE_MOTION_KEY && event.key !== null) return
    applyPreferences()
    onChange()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

// The server can't read localStorage: it renders with the defaults, then React
// switches to the device's values.
export function useTextSize() {
  return useSyncExternalStore(subscribe, readTextSize, () => 'normal' as const)
}

export function useReduceMotion() {
  return useSyncExternalStore(subscribe, readReduceMotion, () => false)
}

/** Put it before the page content, like the theme script. */
export function AccessibilityScript() {
  return <ScriptOnce>{applySavedPreferences}</ScriptOnce>
}
