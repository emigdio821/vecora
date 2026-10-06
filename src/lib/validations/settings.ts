import { z } from 'zod'
import { Constants, type Database } from '@/lib/supabase/database.types'
import { CURRENCIES, type CurrencyCode } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import type { Locale } from '@/paraglide/runtime'

/**
 * What stands in for the name when none has been set: in the screen language,
 * or in `locale` (e.g. the HOA's, for reports).
 */
export function defaultResidentialLabel(locale?: Locale) {
  return m.common_default_residential_label({}, { locale })
}

export type AppLanguage = Database['public']['Enums']['app_language']

export const LANGUAGES = Constants.public.Enums.app_language

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

/** For the setup and settings selects. */
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
  residential_name: residentialName,
  // Admin only (the database checks it); left out when the president saves.
  default_language: z.enum(LANGUAGES).optional(),
  currency: z.enum(CURRENCIES).optional(),
})

export type SettingsInput = z.infer<typeof settingsSchema>

/** The main admin's first sign-in: everything the HOA needs before anyone else joins. */
export const setupSchema = z.object({
  residential_name: residentialName.min(1, { error: () => m.common_name_required() }),
  default_language: z.enum(LANGUAGES),
  currency: z.enum(CURRENCIES),
})

export type SetupInput = z.infer<typeof setupSchema>

/** Storage bucket for the logo (see the settings_logo migration). */
export const LOGO_BUCKET = 'branding'

/** What the president may upload; the server shrinks it to a small PNG anyway. */
export const LOGO_MAX_BYTES = 2 * 1024 * 1024

// Any format sharp can read; the server converts it to PNG.
export const logoFileSchema = z
  .file({ error: () => m.settings_logo_select_image() })
  .max(LOGO_MAX_BYTES, { error: () => m.settings_logo_max_size() })
  .refine((file) => file.type.startsWith('image/'), { error: () => m.settings_logo_must_be_image() })
