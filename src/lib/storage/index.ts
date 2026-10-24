import '@tanstack/react-start/server-only'
import { S3Client } from '@aws-sdk/client-s3'
import { serverEnv } from '@/lib/config/env.server'

/** Private bucket declared in neon.ts. Each Neon branch has its own copy of its objects. */
export const ASSETS_BUCKET = 'assets'

export const storage = new S3Client({
  region: serverEnv.AWS_REGION,
  endpoint: serverEnv.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: serverEnv.AWS_ACCESS_KEY_ID,
    secretAccessKey: serverEnv.AWS_SECRET_ACCESS_KEY,
  },
  // Neon serves buckets by path (endpoint/bucket/key), not as subdomains.
  forcePathStyle: true,
  // Recent SDK versions sign a checksum of the empty body into presigned PUT
  // URLs, which then rejects every real upload. Neon's docs turn it off.
  requestChecksumCalculation: 'WHEN_REQUIRED',
})
