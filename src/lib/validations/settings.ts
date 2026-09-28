import { z } from 'zod'

/** What the sidebar shows when no name has been set. */
export const DEFAULT_RESIDENTIAL_LABEL = 'Administración residencial'

export const settingsSchema = z.object({
  // Empty is allowed: the app falls back to DEFAULT_RESIDENTIAL_LABEL.
  residential_name: z.string().trim().max(60, 'Máximo 60 caracteres'),
})

export type SettingsInput = z.infer<typeof settingsSchema>

/** Storage bucket for the logo (see the settings_logo migration). */
export const LOGO_BUCKET = 'branding'

/** What the president may upload; the server shrinks it to a small PNG anyway. */
export const LOGO_MAX_BYTES = 2 * 1024 * 1024

// Any format sharp can read; the server converts it to PNG.
export const logoFileSchema = z
  .file('Selecciona una imagen')
  .max(LOGO_MAX_BYTES, 'La imagen debe pesar máximo 2 MB')
  .refine((file) => file.type.startsWith('image/'), 'El archivo debe ser una imagen')
