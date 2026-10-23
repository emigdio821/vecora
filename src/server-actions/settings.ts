import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import sharp from 'sharp'
import { type ActionResult, databaseError, postgrestErrorMessage } from '@/lib/action-result'
import { withCurrentUser } from '@/lib/db/current-user'
import { settings } from '@/lib/db/schema'
import { getSettings, LOGO_PREFIX, logoKey } from '@/lib/db/settings'
import { ASSETS_BUCKET, storage } from '@/lib/storage'
import { authMiddleware } from '@/lib/supabase/auth-middleware'
import { getCurrentUser } from '@/lib/supabase/current-user'
import {
  LOGO_URL_SECONDS,
  logoFileSchema,
  type SettingsInput,
  settingsSchema,
} from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'

/** Largest side of the stored logo, in pixels: plenty for the report header. */
const LOGO_SIZE = 512

/**
 * A link to the saved logo for the settings preview, or null when there's
 * none. Anyone signed in may see it, as with the settings row it comes from.
 */
const fetchLogoUrlFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async (): Promise<string | null> => {
    const { logoPath } = await getSettings()
    if (!logoPath) {
      return null
    }
    return getSignedUrl(storage, new GetObjectCommand({ Bucket: ASSETS_BUCKET, Key: logoKey(logoPath) }), {
      expiresIn: LOGO_URL_SECONDS,
    })
  })

export const fetchLogoUrl = () => fetchLogoUrlFn()

/**
 * President (or admin) edits the residential's details. RLS enforces the
 * role; language and currency only reach here from an admin, and a trigger
 * refuses them from anyone else.
 */
const updateSettingsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: SettingsInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult> => {
    const parsed = settingsSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    let updated: Array<{ id: string }>
    try {
      updated = await withCurrentUser((tx) =>
        tx
          .update(settings)
          .set({
            residentialName: parsed.data.residential_name,
            // Left out (undefined) when the president saves: Drizzle skips them.
            defaultLanguage: parsed.data.default_language,
            currency: parsed.data.currency,
          })
          .where(eq(settings.singleton, true))
          .returning({ id: settings.id }),
      )
    } catch (error) {
      return {
        error: postgrestErrorMessage(databaseError(error), {
          fallback: m.settings_save_failed(),
        }),
      }
    }
    // RLS filtered the row out: not president nor admin.
    if (updated.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const updateSettings = (input: SettingsInput) => updateSettingsFn({ data: input })

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

/**
 * Points the settings row at a new logo (or none), then deletes every other
 * logo. RLS decides who may change the row, so nothing is deleted for someone
 * who can't.
 */
async function setLogoPath(path: string | null): Promise<ActionResult> {
  let updated: Array<{ id: string }>
  try {
    updated = await withCurrentUser((tx) =>
      tx
        .update(settings)
        .set({ logoPath: path })
        .where(eq(settings.singleton, true))
        .returning({ id: settings.id }),
    )
  } catch (error) {
    return {
      error: postgrestErrorMessage(databaseError(error), { fallback: m.settings_logo_save_failed() }),
    }
  }
  if (updated.length === 0) {
    return { error: m.common_no_permission() }
  }

  // Only the current logo needs to stay. Clearing everything else, not just the previous
  // file, also picks up orphans, like a file from an earlier failed delete. The logo is
  // already saved, so a failure here is only logged.
  try {
    const listed = await storage.send(
      new ListObjectsV2Command({ Bucket: ASSETS_BUCKET, Prefix: LOGO_PREFIX }),
    )
    const keep = path === null ? null : logoKey(path)
    const stale = (listed.Contents ?? []).filter((object) => object.Key !== undefined && object.Key !== keep)
    if (stale.length > 0) {
      await storage.send(
        new DeleteObjectsCommand({
          Bucket: ASSETS_BUCKET,
          Delete: { Objects: stale.map((object) => ({ Key: object.Key })) },
        }),
      )
    }
  } catch (error) {
    console.error('removing old logos failed', error)
  }

  return { data: undefined }
}

/** President (or admin) uploads the residential's logo. RLS enforces the role. */
const uploadLogoFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
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
    try {
      await storage.send(
        new PutObjectCommand({
          Bucket: ASSETS_BUCKET,
          Key: logoKey(path),
          Body: png,
          ContentType: 'image/png',
          CacheControl: 'max-age=31536000',
        }),
      )
    } catch (error) {
      console.error('logo upload failed', error)
      return { error: m.settings_logo_upload_failed() }
    }

    const result = await setLogoPath(path)
    if (result.error !== undefined) {
      try {
        await storage.send(
          new DeleteObjectsCommand({ Bucket: ASSETS_BUCKET, Delete: { Objects: [{ Key: logoKey(path) }] } }),
        )
      } catch (error) {
        console.error('removing the unsaved logo failed', error)
      }
    }

    return result
  })

export const uploadLogo = (formData: FormData) => uploadLogoFn({ data: formData })

const removeLogoFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler((): Promise<ActionResult> => setLogoPath(null))

export const removeLogo = () => removeLogoFn()
