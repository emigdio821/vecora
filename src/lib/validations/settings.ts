import { z } from 'zod'
import { type AppLanguage, CURRENCIES, type CurrencyCode, LANGUAGES } from '@/lib/enums'
import { m } from '@/paraglide/messages'
import type { Locale } from '@/paraglide/runtime'

export { type AppLanguage, LANGUAGES } from '@/lib/enums'

/**
 * What stands in for the name when none has been set: in the screen language,
 * or in `locale` (e.g. the HOA's, for reports).
 */
export function defaultResidentialLabel(locale?: Locale) {
  return m.common_default_residential_label({}, { locale })
}

/** Each language in itself, so anyone can find theirs. */
export const LANGUAGE_LABEL: Record<AppLanguage, string> = { es: 'Español', en: 'English' }

/**
 * Set when someone picks a language in the language menu. Paraglide's own
 * cookie can't tell: it also saves the detected browser language on the first
 * visit. Without this mark, signing in switches the device to the HOA's language.
 */
export const LANGUAGE_PICKED_COOKIE = 'language_picked'

export const CURRENCY_LABEL: Record<CurrencyCode, string> = {
  get MXN() {
    return m.settings_currency_mxn()
  },
  get USD() {
    return m.settings_currency_usd()
  },
}

/** For the settings selects. */
export const LANGUAGE_ITEMS = LANGUAGES.map((value) => ({ value, label: LANGUAGE_LABEL[value] }))
export const CURRENCY_ITEMS = CURRENCIES.map((value) => ({
  value,
  get label() {
    return CURRENCY_LABEL[value]
  },
}))

const residentialName = z
  .string()
  .trim()
  .max(60, { error: () => m.common_max_chars({ max: 60 }) })

export const settingsSchema = z.object({
  // Empty is allowed: the app falls back to defaultResidentialLabel().
  residentialName,
  // Admin only (settings.configure); left out when the president saves.
  defaultLanguage: z.enum(LANGUAGES).optional(),
  currency: z.enum(CURRENCIES).optional(),
})

export type SettingsInput = z.infer<typeof settingsSchema>

/** The bucket is private, so the settings preview goes through a link that expires. */
export const LOGO_URL_SECONDS = 60 * 60

/** What the president may upload; the server shrinks it to a small PNG anyway. */
export const LOGO_MAX_BYTES = 2 * 1024 * 1024

// Any format sharp can read; the server converts it to PNG.
export const logoFileSchema = z
  .file({ error: () => m.settings_logo_select_image() })
  .max(LOGO_MAX_BYTES, { error: () => m.settings_logo_max_size() })
  .refine((file) => file.type.startsWith('image/'), { error: () => m.settings_logo_must_be_image() })
