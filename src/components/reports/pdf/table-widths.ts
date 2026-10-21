import type { DocumentBlock, DocumentTable } from '@/lib/validations/documents'
import { measureText } from './layout'

// A table whose columns go by their text: react-pdf draws each row on its own, so the
// widths are worked out here, once for the whole table, the way the editor's browser does.

/** The cells' text size, and the 6pt on each side of it, like document.tsx's. */
const TEXT_SIZE = 11
const CELL_PADDING = 12
/** The page's width for content: A4's 595pt minus the 40pt margins on each side. */
const PAGE_CONTENT_WIDTH = 515

/** The lines of a cell's text, in its lists and quotes too. */
function cellLines(blocks: DocumentBlock[]): string[] {
  const lines: string[] = []
  for (const block of blocks) {
    if (block.type === 'paragraph' || block.type === 'heading') {
      let line = ''
      for (const node of block.content ?? []) {
        if (node.type === 'hardBreak') {
          lines.push(line)
          line = ''
        } else {
          line = line + node.text
        }
      }
      lines.push(line)
    }
    if (block.type === 'bulletList' || block.type === 'orderedList') {
      for (const item of block.content) {
        lines.push(...cellLines(item.content))
      }
    }
    if (block.type === 'blockquote') {
      lines.push(...cellLines(block.content))
    }
  }
  return lines
}

interface ColumnSize {
  /** Its widest line: how wide it is when nothing wraps. */
  widest: number
  /** Its longest word: the narrowest it can be without breaking one. */
  longestWord: number
}

function columnSizes(table: DocumentTable): ColumnSize[] {
  const sizes: ColumnSize[] = []
  for (const row of table.content) {
    row.content.forEach((cell, index) => {
      // Header cells are semibold.
      const weight = cell.type === 'tableHeader' ? 600 : 400
      const size = sizes[index] ?? { widest: CELL_PADDING, longestWord: CELL_PADDING }
      for (const line of cellLines(cell.content)) {
        size.widest = Math.max(size.widest, measureText(line, weight, TEXT_SIZE) + CELL_PADDING)
        for (const word of line.split(/\s+/)) {
          size.longestWord = Math.max(size.longestWord, measureText(word, weight, TEXT_SIZE) + CELL_PADDING)
        }
      }
      sizes[index] = size
    })
  }
  return sizes
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

/**
 * Each column's width, in points, when they go by their text (a browser's table-layout:
 * auto). If every widest line fits on the page, the columns share it by those widths. If
 * not, each gets its longest word, and what's left of the page goes to the ones that wrap,
 * by how much more room they'd want.
 */
export function contentColumnWidths(table: DocumentTable): number[] {
  const sizes = columnSizes(table)
  const widest = sum(sizes.map((size) => size.widest))
  if (widest <= PAGE_CONTENT_WIDTH) {
    return sizes.map((size) => size.widest)
  }
  const words = sum(sizes.map((size) => size.longestWord))
  const room = PAGE_CONTENT_WIDTH - words
  if (room <= 0) {
    return sizes.map((size) => size.longestWord)
  }
  const wanted = widest - words
  return sizes.map((size) => size.longestWord + (room * (size.widest - size.longestWord)) / wanted)
}
