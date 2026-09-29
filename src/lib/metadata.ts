import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config/site'

interface PageText {
  title?: string
  description?: string
}

/** The /api/og image for a page. No title shows the app name; no description, none. */
export function ogImageUrl({ title, description }: PageText = {}) {
  const params = new URLSearchParams()
  if (title) params.set('title', title)
  if (description) params.set('description', description)
  const query = params.toString()
  return query ? `${siteConfig.ogUrl}?${query}` : siteConfig.ogUrl
}

/**
 * Title, description and link preview for a public page. Next merges metadata
 * shallowly, so a page's openGraph/twitter replace the root layout's whole
 * objects; this rebuilds them around the page's own text and image.
 */
export function pageMetadata({ title, description }: PageText): Metadata {
  const image = ogImageUrl({ title, description })
  return {
    title,
    description,
    openGraph: {
      description,
      siteName: siteConfig.name,
      locale: 'es-MX',
      type: 'website',
      images: image,
    },
    twitter: {
      card: 'summary_large_image',
      description,
      images: [image],
    },
  }
}
