import { Table, TableCell, TableHeader, TableRow, TableView } from '@tiptap/extension-table'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { ColumnWidths } from '@/lib/validations/documents'

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

/**
 * Draws the table again when its column widths change: Tiptap's view only sets the
 * table's attributes when it's created.
 */
class DocumentTableView extends TableView {
  update(node: ProseMirrorNode): boolean {
    if (node.attrs.columnWidths !== this.node.attrs.columnWidths) {
      return false
    }
    return super.update(node)
  }
}

const DocumentTableNode = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      // How the columns share the width: the same for all ('equal') or by their text ('content').
      columnWidths: {
        default: 'equal' satisfies ColumnWidths,
        parseHTML: (element) => (element.dataset.columnWidths === 'content' ? 'content' : 'equal'),
        renderHTML: (attributes) =>
          attributes.columnWidths === 'content' ? { 'data-column-widths': 'content' } : {},
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      new Plugin({
        key: new PluginKey('tableCellSpans'),
        props: { transformPastedHTML: withoutCellSpans },
      }),
    ]
  },
}).configure({ View: DocumentTableView })

/** Tables the way the PDF draws them: columns of the same width or by their text, no merged cells. */
export const tableExtensions = [DocumentTableNode, TableRow, TableHeader, TableCell]
