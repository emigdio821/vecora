import { z } from 'zod'
import { m } from '@/paraglide/messages'

/*
 * A document is a header, a title and rich text. The text is the editor's
 * (Tiptap's) JSON, limited to what the PDF knows how to draw: anything else
 * fails here, on the server too, before it reaches the renderer.
 */

export const HEADER_TITLE_MAX = 60
export const TITLE_MAX = 150

export const TEXT_MARKS = ['bold', 'italic', 'underline', 'strike'] as const
export type TextMark = (typeof TEXT_MARKS)[number]

export const TEXT_ALIGNS = ['left', 'center', 'right', 'justify'] as const
export type TextAlign = (typeof TEXT_ALIGNS)[number]

/** Soft enough to read black text on; the first one is the default. */
export const HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e9d5ff'] as const
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]

/** Pasted highlights can come in any color: the PDF draws those with the default one. */
export function highlightColor(color: string | null | undefined): HighlightColor {
  const known = HIGHLIGHT_COLORS.find((option) => option === color)
  return known ?? HIGHLIGHT_COLORS[0]
}

const LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

/** Web pages, emails and phone numbers; anything else (javascript:, relative paths) isn't a link. */
export function isAllowedLink(href: string | null | undefined): boolean {
  if (!href) {
    return false
  }
  try {
    return LINK_PROTOCOLS.includes(new URL(href).protocol)
  } catch {
    return false
  }
}

/**
 * What someone types into the link box: "vecora.app" becomes "https://vecora.app" and
 * "mesa@vecora.app" becomes "mailto:mesa@vecora.app". Null when it can't be a link.
 */
export function normalizeLink(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed === '') {
    return null
  }

  let href = trimmed
  const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
  if (!hasProtocol) {
    const isEmail = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(trimmed)
    href = isEmail ? `mailto:${trimmed}` : `https://${trimmed}`
  }
  return isAllowedLink(href) ? href : null
}

// Highlights and links are taken as they come (pasted ones too) and checked when
// drawn, so an odd color or address never rejects the whole document.
const markSchema = z.union([
  z.object({ type: z.enum(TEXT_MARKS) }),
  z.object({ type: z.literal('highlight'), attrs: z.object({ color: z.string().nullish() }).optional() }),
  z.object({ type: z.literal('link'), attrs: z.object({ href: z.string().nullish() }).optional() }),
])

export type DocumentMark = z.infer<typeof markSchema>

const textSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  marks: z.array(markSchema).optional(),
})

const hardBreakSchema = z.object({ type: z.literal('hardBreak') })

const inlineSchema = z.discriminatedUnion('type', [textSchema, hardBreakSchema])

/** null until someone picks an alignment: the text then starts on the left. */
const alignSchema = z.enum(TEXT_ALIGNS).nullish()

const paragraphSchema = z.object({
  type: z.literal('paragraph'),
  attrs: z.object({ textAlign: alignSchema }).optional(),
  content: z.array(inlineSchema).optional(),
})

/** Largest first; all of them sit under the document's own title. */
export const HEADING_LEVELS = [1, 2, 3, 4] as const
export type HeadingLevel = (typeof HEADING_LEVELS)[number]

const headingSchema = z.object({
  type: z.literal('heading'),
  attrs: z
    .object({
      textAlign: alignSchema,
      level: z.literal(HEADING_LEVELS).optional(),
    })
    .optional(),
  content: z.array(inlineSchema).optional(),
})

/**
 * Images travel inside the document, shrunk by the browser to PNG or JPEG: the two the PDF
 * can draw. Never an address, so the server doesn't fetch anything someone else points to.
 */
export const IMAGE_DATA_URL = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/

/** Resized images, as a percentage of the width they sit in. */
export const IMAGE_MIN_SIZE = 10
export const IMAGE_MAX_SIZE = 100

/** The PDF page's width for content, in points: A4's 595 minus the 40pt margins on each side. */
const PAGE_CONTENT_WIDTH = 515
/** A screen pixel is 0.75pt: a small image prints at the size it has on a screen. */
const POINTS_PER_PIXEL = 0.75
/** About 40% of the page: a tall photo still leaves room for the text around it. */
export const INITIAL_IMAGE_MAX_HEIGHT = 340

interface ImageSizeAttributes {
  size?: number | null
  width?: number | null
  height?: number | null
}

/**
 * The share of the width an image takes, in percent. Until someone resizes it, its own
 * size on the page (but never wider than the page or taller than 340pt): as a percentage
 * too, so the editor, wider than the page, shows it the way the PDF prints it. Null for a
 * pasted image that came without its pixels.
 */
export function imageSize({ size, width, height }: ImageSizeAttributes): number | null {
  if (size) {
    return size
  }
  if (!width || !height) {
    return null
  }
  const points = Math.min(
    width * POINTS_PER_PIXEL,
    (INITIAL_IMAGE_MAX_HEIGHT * width) / height,
    PAGE_CONTENT_WIDTH,
  )
  return (points / PAGE_CONTENT_WIDTH) * 100
}

export type ImageAlign = 'left' | 'center' | 'right'

/** Images start centered; justified means nothing for one, so it's centered too. */
export function imageAlign(align: TextAlign | null | undefined): ImageAlign {
  if (align === 'left' || align === 'right') {
    return align
  }
  return 'center'
}

const imageSchema = z.object({
  type: z.literal('image'),
  attrs: z.object({
    src: z.string().regex(IMAGE_DATA_URL),
    alt: z.string().nullish(),
    title: z.string().nullish(),
    /** In pixels; the PDF sizes the image from these. Missing on a pasted one. */
    width: z.number().positive().nullish(),
    height: z.number().positive().nullish(),
    /** Set by resizing it; without it, the image prints at its own size. */
    size: z.number().int().min(IMAGE_MIN_SIZE).max(IMAGE_MAX_SIZE).nullish(),
    /** From the toolbar's alignment buttons, like the text's; see imageAlign. */
    textAlign: z.enum(TEXT_ALIGNS).nullish(),
  }),
})

// Blocks nest (a list inside an item, a list inside a quote), so these refer to
// each other through getters. An item can hold any block, like in the editor.
const listItemSchema = z.object({
  type: z.literal('listItem'),
  get content() {
    return z.array(blockSchema)
  },
})

const bulletListSchema = z.object({
  type: z.literal('bulletList'),
  get content() {
    return z.array(listItemSchema)
  },
})

const orderedListSchema = z.object({
  type: z.literal('orderedList'),
  attrs: z.object({ start: z.number().int().min(1).optional() }).optional(),
  get content() {
    return z.array(listItemSchema)
  },
})

/** A quote holds any other blocks: paragraphs, headings, lists, even another quote. */
const blockquoteSchema = z.object({
  type: z.literal('blockquote'),
  get content() {
    return z.array(blockSchema)
  },
})

/**
 * A cell holds any blocks, like a list item, and spans one row and one column: the PDF
 * draws a grid. `align` comes with pasted tables; a paragraph's own alignment wins over it.
 */
const tableCellSchema = z.object({
  type: z.enum(['tableCell', 'tableHeader']),
  attrs: z
    .object({
      colspan: z.literal(1).optional(),
      rowspan: z.literal(1).optional(),
      align: z.enum(['left', 'center', 'right']).nullish(),
    })
    .optional(),
  get content() {
    return z.array(blockSchema)
  },
})

const tableRowSchema = z.object({
  type: z.literal('tableRow'),
  content: z.array(tableCellSchema),
})

/** All columns the same width, or each as wide as its text asks (see contentColumnWidths). */
export const COLUMN_WIDTHS = ['equal', 'content'] as const
export type ColumnWidths = (typeof COLUMN_WIDTHS)[number]

const tableSchema = z.object({
  type: z.literal('table'),
  attrs: z.object({ columnWidths: z.enum(COLUMN_WIDTHS).nullish() }).optional(),
  content: z.array(tableRowSchema),
})

const blockSchema = z.discriminatedUnion('type', [
  paragraphSchema,
  headingSchema,
  bulletListSchema,
  orderedListSchema,
  blockquoteSchema,
  imageSchema,
  tableSchema,
])

export const documentContentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(blockSchema),
})

export type DocumentContent = z.infer<typeof documentContentSchema>
export type DocumentBlock = z.infer<typeof blockSchema>
export type DocumentListItem = z.infer<typeof listItemSchema>
export type DocumentInline = z.infer<typeof inlineSchema>
export type DocumentImage = z.infer<typeof imageSchema>
export type DocumentTable = z.infer<typeof tableSchema>
export type DocumentTableCell = z.infer<typeof tableCellSchema>

interface ContentTree {
  type: string
  text?: string
  content?: ContentTree[]
}

/** An empty editor still holds one empty paragraph: this looks for actual words or an image. */
export function hasContent(node: ContentTree): boolean {
  if (node.type === 'image') {
    return true
  }
  if (node.text && node.text.trim() !== '') {
    return true
  }
  if (!node.content) {
    return false
  }
  return node.content.some((child) => hasContent(child))
}

export const EMPTY_DOCUMENT_CONTENT: DocumentContent = { type: 'doc', content: [{ type: 'paragraph' }] }

export const documentSchema = z.object({
  header_title: z
    .string()
    .trim()
    .min(1, { error: () => m.documents_header_title_required() })
    .max(HEADER_TITLE_MAX, { error: () => m.documents_header_title_too_long({ max: HEADER_TITLE_MAX }) }),
  date: z.iso.date({ error: () => m.common_invalid_date() }),
  title: z
    .string()
    .trim()
    .min(1, { error: () => m.documents_title_required() })
    .max(TITLE_MAX, { error: () => m.documents_title_too_long({ max: TITLE_MAX }) }),
  content: documentContentSchema.refine((content) => hasContent(content), {
    error: () => m.documents_content_required(),
  }),
})

export type DocumentInput = z.infer<typeof documentSchema>

export const TEMPLATE_NAME_MAX = 80
export const TEMPLATE_DESCRIPTION_MAX = 200
/** Characters of JSON: a few shrunk photos (about 300 KB each) and the text. */
export const TEMPLATE_CONTENT_MAX_LENGTH = 2_000_000

/** What the menu shows of a saved template; the only part that can change after saving it. */
export const templateDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: () => m.documents_template_name_required() })
    .max(TEMPLATE_NAME_MAX, { error: () => m.documents_template_name_too_long({ max: TEMPLATE_NAME_MAX }) }),
  description: z
    .string()
    .trim()
    .max(TEMPLATE_DESCRIPTION_MAX, {
      error: () => m.documents_template_description_too_long({ max: TEMPLATE_DESCRIPTION_MAX }),
    }),
})

export type TemplateDetailsInput = z.infer<typeof templateDetailsSchema>

/** A document saved as a template: everything but its date, which is the day it's used. */
export const documentTemplateSchema = z.object({
  details: templateDetailsSchema,
  header_title: documentSchema.shape.header_title,
  title: documentSchema.shape.title,
  content: documentSchema.shape.content.refine(
    (content) => JSON.stringify(content).length <= TEMPLATE_CONTENT_MAX_LENGTH,
    { error: () => m.documents_template_too_big() },
  ),
})

export type DocumentTemplateInput = z.infer<typeof documentTemplateSchema>
