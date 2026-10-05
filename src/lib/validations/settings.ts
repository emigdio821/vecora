import { z } from 'zod'
import { Constants, type Database } from '@/lib/supabase/database.types'
import { CURRENCIES, type CurrencyCode } from '@/lib/utils'

/** What the sidebar shows when no name has been set. */
export const DEFAULT_RESIDENTIAL_LABEL = 'Administración residencial'

export type AppLanguage = Database['public']['Enums']['app_language']

export const LANGUAGES = Constants.public.Enums.app_language

/** Each language in itself, so anyone can find theirs. */
export const LANGUAGE_LABEL: Record<AppLanguage, string> = { es: 'Español', en: 'English' }

export const CURRENCY_LABEL: Record<CurrencyCode, string> = {
  MXN: 'Peso mexicano (MXN)',
  USD: 'Dólar estadounidense (USD)',
}

/** For the setup and settings selects. */
export const LANGUAGE_ITEMS = LANGUAGES.map((value) => ({ value, label: LANGUAGE_LABEL[value] }))
export const CURRENCY_ITEMS = CURRENCIES.map((value) => ({ value, label: CURRENCY_LABEL[value] }))

const residentialName = z.string().trim().max(60, 'Máximo 60 caracteres')

export const settingsSchema = z.object({
  // Empty is allowed: the app falls back to DEFAULT_RESIDENTIAL_LABEL.
  residential_name: residentialName,
  // Admin only (the database checks it); left out when the president saves.
  default_language: z.enum(LANGUAGES).optional(),
  currency: z.enum(CURRENCIES).optional(),
})

export type SettingsInput = z.infer<typeof settingsSchema>

/** The main admin's first sign-in: everything the HOA needs before anyone else joins. */
export const setupSchema = z.object({
  residential_name: residentialName.min(1, 'Nombre es requerido'),
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
  .file('Selecciona una imagen')
  .max(LOGO_MAX_BYTES, 'La imagen debe pesar máximo 2 MB')
  .refine((file) => file.type.startsWith('image/'), 'El archivo debe ser una imagen')
