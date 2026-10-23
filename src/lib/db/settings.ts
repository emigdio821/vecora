import '@tanstack/react-start/server-only'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { withUser } from '@/lib/db'
import { getSessionUserId } from '@/lib/db/current-user'
import { ASSETS_BUCKET, storage } from '@/lib/storage'
import type { CurrencyCode } from '@/lib/utils'
import type { AppLanguage } from '@/lib/validations/settings'

export interface Settings {
  /** Empty when the president hasn't set one yet. */
  residentialName: string
  /** File name of the logo (see logoKey); null when there's no logo. */
  logoPath: string | null
  /** Language of the HOA's data and reports, and the app's default. */
  defaultLanguage: AppLanguage
  /** Currency of new amounts; existing rows keep their own. */
  currency: CurrencyCode
}

const DEFAULT_SETTINGS: Settings = {
  residentialName: '',
  logoPath: null,
  defaultLanguage: 'es',
  currency: 'MXN',
}

/** Where a logo lives in the assets bucket. The settings row keeps only the file name. */
export const LOGO_PREFIX = 'logos/'

export function logoKey(path: string) {
  return `${LOGO_PREFIX}${path}`
}

/**
 * The single public.settings row (the authed layout loads it and hands it
 * down). Reports can call this too. Signed out, or when the read fails, it
 * answers the defaults so the app still renders with its generic labels.
 */
export async function getSettings(): Promise<Settings> {
  const userId = await getSessionUserId()
  if (!userId) {
    return DEFAULT_SETTINGS
  }

  try {
    const row = await withUser(userId, (tx) =>
      tx.query.settings.findFirst({
        columns: { residentialName: true, logoPath: true, defaultLanguage: true, currency: true },
      }),
    )
    if (!row) {
      return DEFAULT_SETTINGS
    }
    return row
  } catch (error) {
    console.error('reading settings failed', error)
    return DEFAULT_SETTINGS
  }
}

/** The logo's PNG bytes, for the report. Null when it can't be read: the report goes without it. */
export async function getLogo(path: string): Promise<Buffer | null> {
  try {
    const object = await storage.send(new GetObjectCommand({ Bucket: ASSETS_BUCKET, Key: logoKey(path) }))
    if (!object.Body) {
      return null
    }
    return Buffer.from(await object.Body.transformToByteArray())
  } catch (error) {
    console.error('logo download failed', error)
    return null
  }
}
