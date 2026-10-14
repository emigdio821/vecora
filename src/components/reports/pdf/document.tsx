import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { capitalize, intlLocale } from '@/lib/utils'
import {
  type DocumentBlock,
  type DocumentImage,
  type DocumentInline,
  type DocumentInput,
  type DocumentListItem,
  type DocumentMark,
  type DocumentTable,
  type DocumentTableCell,
  type HeadingLevel,
  highlightColor,
  INITIAL_IMAGE_MAX_HEIGHT,
  imageAlign,
  imageSize,
  isAllowedLink,
  type TextAlign,
} from '@/lib/validations/documents'
import type { Locale } from '@/paraglide/runtime'
import { layoutStyles, PageFooter, PageHeader } from './layout'

// Rendered on the server by /reports/document, from the editor's JSON (already
// checked against documentSchema). Only react-pdf primitives here.

// The editor draws the same (src/styles/typeset-document.css, in "PDF points"): change
// one, change the other. Larger than the financial report's tables: read like a letter.
const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: 600, marginBottom: 12 },
  paragraph: { fontSize: 11, lineHeight: 1.5 },
  heading: { fontWeight: 600, lineHeight: 1.4 },
  listItem: { flexDirection: 'row' },
  // The editor's marker sits just before the text, in an 18pt column.
  listMarker: { width: 18, paddingRight: 5, textAlign: 'right', fontSize: 11, lineHeight: 1.5 },
  listBody: { flex: 1 },
  // A bar on the left, like the editor's; the text inside keeps its own styles.
  blockquote: {
    borderLeftWidth: 3,
    // neutral-300 and the editor's muted text (muted-foreground).
    borderLeftColor: '#d4d4d4',
    paddingLeft: 10,
    color: '#686868',
  },
  // blue-700, like the editor's links.
  link: { color: '#1d4ed8', textDecoration: 'underline' },
  // Inside a list or a quote the space is narrower: maxWidth shrinks it, contain keeps its shape.
  image: { maxWidth: '100%', objectFit: 'contain' },
  // A grid in the quote bar's gray: the table draws the top and left lines, each cell its
  // right and bottom ones.
  table: { borderTopWidth: 0.75, borderLeftWidth: 0.75, borderColor: '#d4d4d4' },
  tableRow: { flexDirection: 'row' },
  // flexBasis 0: every column the same width, whatever its text, like the editor's.
  tableCell: {
    flexGrow: 1,
    flexBasis: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: '#d4d4d4',
  },
  // neutral-100; the text inside is bold.
  tableHeaderCell: { backgroundColor: '#f5f5f5', fontWeight: 600 },
})

/** Between blocks, like typeset's flow. */
const BLOCK_GAP = 6
/** Above a heading; below one, the usual BLOCK_GAP. */
const HEADING_GAP = 12
/** Between list items, and between the blocks inside one. */
const LIST_GAP = 2
/** Above and below an image or a table. */
const FIGURE_GAP = 10

type BlockContext = 'flow' | 'listItem'

function isFigure(block: DocumentBlock): boolean {
  return block.type === 'image' || block.type === 'table'
}

/**
 * The space above a block, from the one before it: typeset-document's rules, checked
 * from its last (the one that wins) to its first. The first block of the page, an item,
 * a quote or a table cell starts at the top.
 */
function gapBefore(previous: DocumentBlock | undefined, block: DocumentBlock, context: BlockContext): number {
  if (!previous) {
    return 0
  }
  if (isFigure(previous) && block.type === 'heading') {
    return HEADING_GAP
  }
  if (isFigure(previous) || isFigure(block)) {
    return FIGURE_GAP
  }
  if (context === 'listItem') {
    return LIST_GAP
  }
  if (block.type === 'heading') {
    return HEADING_GAP
  }
  return BLOCK_GAP
}

/** One block after another, each spaced from the one before it. */
function Blocks({ blocks, context }: { blocks: DocumentBlock[]; context: BlockContext }) {
  return (
    <>
      {blocks.map((block, index) => (
        <Block key={index} block={block} gap={gapBefore(blocks[index - 1], block, context)} />
      ))}
    </>
  )
}

/** Resized, an image can be taller than it starts, up to what fits under a page's header (702pt). */
const IMAGE_MAX_HEIGHT = 600

/** All under the title's 20 and over the text's 11, so each level reads as its own step. */
const HEADING_FONT_SIZE: Record<HeadingLevel, number> = {
  1: 16,
  2: 14,
  3: 12.5,
  4: 11.5,
}

/** "13 de Octubre de 2026", months capitalized like the rest of the app. */
function formatLongDay(day: string, language: Locale): string {
  const [year, month, date] = day.split('-').map(Number)
  // UTC on both ends, so the server's time zone can't move it to the day before.
  return new Intl.DateTimeFormat(intlLocale(language), { dateStyle: 'long', timeZone: 'UTC' })
    .formatToParts(new Date(Date.UTC(year, month - 1, date)))
    .map((part) => (part.type === 'month' ? capitalize(part.value) : part.value))
    .join('')
}

function textDecoration(isUnderline: boolean, isStrike: boolean) {
  if (isUnderline && isStrike) {
    return 'underline line-through'
  }
  if (isUnderline) {
    return 'underline'
  }
  if (isStrike) {
    return 'line-through'
  }
  return undefined
}

/** Only what its marks add: the rest comes from the line, so a heading's runs stay bold. */
function TextRun({ text, marks }: { text: string; marks: DocumentMark[] }) {
  const types = marks.map((mark) => mark.type)
  const highlight = marks.find((mark) => mark.type === 'highlight')
  const link = marks.find((mark) => mark.type === 'link')

  const run = (
    <Text
      style={{
        fontWeight: types.includes('bold') ? 600 : undefined,
        fontStyle: types.includes('italic') ? 'italic' : undefined,
        textDecoration: textDecoration(types.includes('underline'), types.includes('strike')),
        backgroundColor: highlight ? highlightColor(highlight.attrs?.color) : undefined,
        // Dark on the light highlight even inside a muted quote, like the editor (neutral-900).
        color: highlight ? '#171717' : undefined,
      }}
    >
      {text}
    </Text>
  )

  // Only safe addresses become clickable; anything else stays as its text.
  const href = link?.attrs?.href
  if (href && isAllowedLink(href)) {
    return (
      <Link src={href} style={styles.link}>
        {run}
      </Link>
    )
  }
  return run
}

const IMAGE_PLACEMENT = {
  left: { alignSelf: 'flex-start', objectPositionX: 0 },
  center: { alignSelf: 'center', objectPositionX: '50%' },
  right: { alignSelf: 'flex-end', objectPositionX: '100%' },
} as const

function DocumentImageBlock({ image, gap }: { image: DocumentImage; gap: number }) {
  const { src, textAlign } = image.attrs
  // Where the toolbar put it; when its height is capped, the picture keeps to that side too.
  const placement = IMAGE_PLACEMENT[imageAlign(textAlign)]
  const size = imageSize(image.attrs)
  // A pasted image comes without its pixels: the widest it can be, keeping its shape.
  if (size === null) {
    return (
      <Image
        src={src}
        style={[
          styles.image,
          placement,
          { marginTop: gap, width: '100%', maxHeight: INITIAL_IMAGE_MAX_HEIGHT },
        ]}
      />
    )
  }
  // The same share of the space it sits in as in the editor, its height following.
  return (
    <Image
      src={src}
      style={[styles.image, placement, { marginTop: gap, width: `${size}%`, maxHeight: IMAGE_MAX_HEIGHT }]}
    />
  )
}

/** The runs of one line of text; goes inside a <Text>. */
function inlineContent(nodes: DocumentInline[] | undefined): React.ReactNode {
  // An empty paragraph is a blank line the author left on purpose: keep its height.
  if (!nodes || nodes.length === 0) {
    return ' '
  }

  return nodes.map((node, index) =>
    node.type === 'hardBreak' ? '\n' : <TextRun key={index} text={node.text} marks={node.marks ?? []} />,
  )
}

/**
 * Where the format changes inside a word ("**mensuales**,"), react-pdf sees a place to
 * break it with a hyphen. Its "infinite" penalty (10000) rules that out: lines break
 * between words only.
 */
const NO_BREAK_INSIDE_WORDS = 10_000

/** null until someone picks an alignment: the text then starts on the left. */
function textAlign(align: TextAlign | null | undefined): TextAlign {
  return align ?? 'left'
}

/** About 13 lines: always fits on one page. */
const SHORT_QUOTE_LENGTH = 1200

interface QuoteTree {
  type: string
  text?: string
  content?: QuoteTree[]
}

/** The characters of text in a quote, lists inside it included; Infinity with an image. */
function quoteLength(node: QuoteTree): number {
  if (node.type === 'image') {
    return Number.POSITIVE_INFINITY
  }
  let length = node.text?.length ?? 0
  for (const child of node.content ?? []) {
    length = length + quoteLength(child)
  }
  return length
}

function isShortQuote(block: QuoteTree): boolean {
  return quoteLength(block) <= SHORT_QUOTE_LENGTH
}

interface BlockProps {
  block: DocumentBlock
  /** The space above it, from gapBefore. */
  gap: number
}

function Block({ block, gap }: BlockProps) {
  switch (block.type) {
    case 'paragraph':
      return (
        <Text
          style={[styles.paragraph, { marginTop: gap, textAlign: textAlign(block.attrs?.textAlign) }]}
          hyphenationPenalty={NO_BREAK_INSIDE_WORDS}
        >
          {inlineContent(block.content)}
        </Text>
      )
    case 'heading':
      return (
        // A heading never ends a page alone, away from the text it introduces.
        <Text
          style={[
            styles.heading,
            {
              marginTop: gap,
              // Without a level the editor shows the largest one, so the PDF does too.
              fontSize: HEADING_FONT_SIZE[block.attrs?.level ?? 1],
              textAlign: textAlign(block.attrs?.textAlign),
            },
          ]}
          minPresenceAhead={40}
          hyphenationPenalty={NO_BREAK_INSIDE_WORDS}
        >
          {inlineContent(block.content)}
        </Text>
      )
    case 'bulletList':
      return <List items={block.content} marker={() => '•'} gap={gap} />
    case 'orderedList': {
      const start = block.attrs?.start ?? 1
      return <List items={block.content} marker={(index) => `${start + index}.`} gap={gap} />
    }
    case 'blockquote':
      return (
        // A short one moves to the next page whole: split, its bar could stay at the bottom
        // of a page with no text next to it. A long one has to split, or it wouldn't fit.
        <View style={[styles.blockquote, { marginTop: gap }]} wrap={!isShortQuote(block)}>
          <Blocks blocks={block.content} context="flow" />
        </View>
      )
    case 'image':
      return <DocumentImageBlock image={block} gap={gap} />
    case 'table':
      return <TableBlock table={block} gap={gap} />
  }
}

/** A pasted table can align a whole cell: its paragraphs follow, unless they have their own. */
function cellBlocks(cell: DocumentTableCell): DocumentBlock[] {
  const cellAlign = cell.attrs?.align
  if (!cellAlign) {
    return cell.content
  }
  return cell.content.map((block) => {
    if (block.type !== 'paragraph' || block.attrs?.textAlign) {
      return block
    }
    return { ...block, attrs: { ...block.attrs, textAlign: cellAlign } }
  })
}

function TableBlock({ table, gap }: { table: DocumentTable; gap: number }) {
  return (
    <View style={[styles.table, { marginTop: gap }]}>
      {table.content.map((row, rowIndex) => (
        // Rows never split across pages.
        <View key={rowIndex} style={styles.tableRow} wrap={false}>
          {row.content.map((cell, cellIndex) => (
            <View
              key={cellIndex}
              style={[styles.tableCell, cell.type === 'tableHeader' ? styles.tableHeaderCell : {}]}
            >
              <Blocks blocks={cellBlocks(cell)} context="flow" />
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

interface ListProps {
  items: DocumentListItem[]
  marker: (index: number) => string
  gap: number
}

function List({ items, marker, gap }: ListProps) {
  return (
    <View style={{ marginTop: gap }}>
      {items.map((item, index) => (
        <View key={index} style={[styles.listItem, { marginTop: index === 0 ? 0 : LIST_GAP }]}>
          <Text style={styles.listMarker}>{marker(index)}</Text>
          <View style={styles.listBody}>
            <Blocks blocks={item.content} context="listItem" />
          </View>
        </View>
      ))}
    </View>
  )
}

interface DocumentPdfProps {
  document: DocumentInput
  residentialName: string
  /** The HOA's default language, whoever downloads the document. */
  language: Locale
  /** PNG bytes; without it the header shows only the name. */
  logo: Buffer | null
  generatedBy: string
  generatedAt: Date
}

export function DocumentPdf({
  document,
  residentialName,
  language,
  logo,
  generatedBy,
  generatedAt,
}: DocumentPdfProps) {
  return (
    <Document
      title={document.title}
      author={residentialName}
      creator="Vecora"
      producer="Vecora"
      language={intlLocale(language)}
    >
      <Page size="A4" style={layoutStyles.page}>
        <PageHeader
          residentialName={residentialName}
          logo={logo}
          subtitle={document.header_title}
          aside={formatLongDay(document.date, language)}
        />

        <Text style={styles.title}>{document.title}</Text>
        <Blocks blocks={document.content.content} context="flow" />

        <PageFooter generatedBy={generatedBy} generatedAt={generatedAt} language={language} />
      </Page>
    </Document>
  )
}
