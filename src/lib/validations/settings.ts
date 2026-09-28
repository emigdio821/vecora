import { z } from 'zod'

/** What the sidebar shows when no name has been set. */
export const DEFAULT_RESIDENTIAL_LABEL = 'Administración residencial'

export const settingsSchema = z.object({
  // Empty is allowed: the app falls back to DEFAULT_RESIDENTIAL_LABEL.
  residential_name: z.string().trim().max(60, 'Máximo 60 caracteres'),
})

export type SettingsInput = z.infer<typeof settingsSchema>
