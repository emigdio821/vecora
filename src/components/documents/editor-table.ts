import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/** Any cell in the pasted HTML: only then is there something to clean. */
const HAS_TABLE_CELL = /<t[dh][\s>]/i

/**
 * A pasted table (from Word, Sheets, a web page) without merged cells or column widths,
 * which the PDF can't draw: a merged cell becomes a single one, and the editor adds the
 * cells a row ends up missing.
 */
function withoutCellSpans(html: string): string {
  if (!HAS_TABLE_CELL.test(html)) {
    return html
  }
  const pasted = new DOMParser().parseFromString(html, 'text/html')
  for (const cell of pasted.querySelectorAll('[colspan], [rowspan], [colwidth]')) {
    cell.removeAttribute('colspan')
    cell.removeAttribute('rowspan')
    cell.removeAttribute('colwidth')
  }
  for (const columns of pasted.querySelectorAll('colgroup')) {
    columns.remove()
  }
  return pasted.body.innerHTML
}

const DocumentTableNode = Table.extend({
  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      new Plugin({
        key: new PluginKey('tableCellSpans'),
        props: { transformPastedHTML: withoutCellSpans },
      }),
    ]
  },
})

/** Tables the way the PDF draws them: columns of the same width, no merged cells. */
export const tableExtensions = [DocumentTableNode, TableRow, TableHeader, TableCell]
