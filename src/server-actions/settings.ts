import { createServerFn } from '@tanstack/react-start'
import sharp from 'sharp'
import { type ActionResult, postgrestErrorMessage } from '@/lib/action-result'
import { getCurrentUser } from '@/lib/supabase/current-user'
import { createClient } from '@/lib/supabase/server'
import {
  LOGO_BUCKET,
  logoFileSchema,
  type SettingsInput,
  settingsSchema,
  type SetupInput,
  setupSchema,
} from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'

/** Largest side of the stored logo, in pixels: plenty for the report header. */
const LOGO_SIZE = 512

/**
 * President (or admin) edits the residential's details. RLS enforces the
 * role; language and currency only reach here from an admin, and a trigger
 * refuses them from anyone else.
 */
const updateSettingsFn = createServerFn({ method: 'POST' })
  .validator((input: SettingsInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult> => {
    const parsed = settingsSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('settings')
      .update(parsed.data)
      .eq('singleton', true)
      .select('id')
      .maybeSingle()

    if (error) {
      return {
        error: postgrestErrorMessage(error, {
          fallback: m.settings_save_failed(),
        }),
      }
    }
    // RLS filtered the row out: not president nor admin.
    if (!data) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const updateSettings = (input: SettingsInput) => updateSettingsFn({ data: input })

/** The main admin's setup dialog: name, language and currency, then it never opens again. */
const completeSetupFn = createServerFn({ method: 'POST' })
  .validator((input: SetupInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult> => {
    const parsed = setupSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('settings')
      .update({ ...parsed.data, configured_at: new Date().toISOString() })
      .eq('singleton', true)
      .select('id')
      .maybeSingle()

    if (error) {
      return {
        error: postgrestErrorMessage(error, {
          fallback: m.settings_setup_save_failed(),
        }),
      }
    }
    if (!data) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const completeSetup = (input: SetupInput) => completeSetupFn({ data: input })

/**
 * Whatever the president uploads ends up as a light PNG: turned upright,
 * empty borders cropped, shrunk to fit LOGO_SIZE and reduced to a palette.
 * PNG because the report only takes PNG or JPG, and logos need transparency.
 */
function optimizeLogo(input: ArrayBuffer): Promise<Buffer> {
  // A small file can still unpack into a huge image; refuse past 40 megapixels.
  return sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .trim()
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'inside', withoutEnlargement: true })
    .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
    .toBuffer()
}

/** Points the settings row at a new logo (or none) and deletes the previous file. */
async function setLogoPath(path: string | null): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: current } = await supabase.from('settings').select('logo_path').maybeSingle()

  const { data, error } = await supabase
    .from('settings')
    .update({ logo_path: path })
    .eq('singleton', true)
    .select('id')
    .maybeSingle()

  if (error) {
    return {
      error: postgrestErrorMessage(error, { fallback: m.settings_logo_save_failed() }),
    }
  }
  if (!data) {
    return { error: m.common_no_permission() }
  }

  // Nothing points at the old file anymore; if the delete fails it's only an orphan.
  if (current?.logo_path && current.logo_path !== path) {
    await supabase.storage.from(LOGO_BUCKET).remove([current.logo_path])
  }

  return { data: undefined }
}

/** President (or admin) uploads the residential's logo. RLS enforces the role. */
const uploadLogoFn = createServerFn({ method: 'POST' })
  .validator((formData: FormData) => formData)
  .handler(async ({ data: formData }): Promise<ActionResult> => {
    const parsed = logoFileSchema.safeParse(formData.get('logo'))
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? m.settings_logo_select_image() }
    }

    // Processing the image is the expensive part: turn others away before it.
    const user = await getCurrentUser()
    if (!user?.roles.some((role) => role === 'president' || role === 'admin')) {
      return { error: m.common_no_permission() }
    }

    let png: Buffer
    try {
      png = await optimizeLogo(await parsed.data.arrayBuffer())
    } catch (error) {
      console.error('logo optimization failed', error)
      return { error: m.settings_logo_read_failed() }
    }

    // A new name every time, so no cache ever serves the previous logo.
    const path = `logo-${Date.now()}.png`
    const supabase = await createClient()
    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, png, { contentType: 'image/png', cacheControl: '31536000' })

    if (uploadError) {
      console.error('logo upload failed', uploadError)
      return { error: m.settings_logo_upload_failed() }
    }

    const result = await setLogoPath(path)
    if (result.error !== undefined) {
      await supabase.storage.from(LOGO_BUCKET).remove([path])
    }

    return result
  })

export const uploadLogo = (formData: FormData) => uploadLogoFn({ data: formData })

const removeLogoFn = createServerFn({ method: 'POST' }).handler((): Promise<ActionResult> =>
  setLogoPath(null),
)

export const removeLogo = () => removeLogoFn()
