import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createServerFn } from '@tanstack/react-start'
import sharp from 'sharp'
import { type ActionResult, errorMessage } from '@/lib/action-result'
import { boardMiddleware, requirePermission } from '@/lib/auth/middleware'
import { can } from '@/lib/auth/permissions'
import { transactionAs } from '@/lib/db'
import { getSettings, LOGO_PREFIX, logoKey } from '@/lib/db/settings'
import * as settingsService from '@/lib/services/settings'
import { ASSETS_BUCKET, storage } from '@/lib/storage'
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
 * none. Every board member may see it, as with the settings row it comes from.
 */
const fetchLogoUrlFn = createServerFn()
  .middleware([boardMiddleware])
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
 * President (or admin) edits the residential's details. Language and currency
 * only reach here from an admin's form; anyone else sending them is refused.
 */
const updateSettingsFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission({ settings: ['write'] })])
  .validator((input: SettingsInput) => input)
  .handler(async ({ data: input, context }): Promise<ActionResult> => {
    const parsed = settingsSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }
    const { residentialName, defaultLanguage, currency } = parsed.data
    const configures = defaultLanguage !== undefined || currency !== undefined
    if (configures && !can(context.user.roles, { settings: ['configure'] })) {
      return { error: m.common_no_permission() }
    }

    try {
      await transactionAs(context.user.id, (tx) =>
        // Left out (undefined) when the president saves: Drizzle skips them.
        settingsService.updateSettings(tx, { residentialName, defaultLanguage, currency }),
      )
    } catch (error) {
      return { error: errorMessage(error, { fallback: m.settings_save_failed() }) }
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
 * logo. The callers' middleware already checked the role.
 */
async function setLogoPath(actorId: string, path: string | null): Promise<ActionResult> {
  try {
    await transactionAs(actorId, (tx) => settingsService.updateSettings(tx, { logoPath: path }))
  } catch (error) {
    return { error: errorMessage(error, { fallback: m.settings_logo_save_failed() }) }
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

/**
 * President (or admin) uploads the residential's logo. The middleware turns
 * others away before the expensive part, processing the image.
 */
const uploadLogoFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission({ settings: ['write'] })])
  .validator((formData: FormData) => formData)
  .handler(async ({ data: formData, context }): Promise<ActionResult> => {
    const parsed = logoFileSchema.safeParse(formData.get('logo'))
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? m.settings_logo_select_image() }
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

    const result = await setLogoPath(context.user.id, path)
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
  .middleware([requirePermission({ settings: ['write'] })])
  .handler(({ context }): Promise<ActionResult> => setLogoPath(context.user.id, null))

export const removeLogo = () => removeLogoFn()
