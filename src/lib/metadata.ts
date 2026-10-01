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

/** "Residencial - Vecora"; the router has no title template, so routes build it here. */
export function pageTitle(title?: string) {
  return title ? `${title} - ${siteConfig.name}` : siteConfig.name
}

/**
 * Title, description and link preview for a public page. The deepest route's
 * tag wins per name/property, so these replace the root's defaults.
 */
export function pageHead({ title, description }: PageText) {
  const image = ogImageUrl({ title, description })
  const descriptionTags = description
    ? [
        { name: 'description', content: description },
        { property: 'og:description', content: description },
        { name: 'twitter:description', content: description },
      ]
    : []

  return {
    meta: [
      { title: pageTitle(title) },
      ...descriptionTags,
      { property: 'og:image', content: image },
      { name: 'twitter:image', content: image },
    ],
  }
}
