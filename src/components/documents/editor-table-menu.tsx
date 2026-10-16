import {
  IconCheck,
  IconChevronDown,
  IconColumnInsertLeft,
  IconColumnInsertRight,
  IconColumnRemove,
  IconRowInsertBottom,
  IconRowInsertTop,
  IconRowRemove,
  IconTable,
  IconTableColumn,
  IconTableOff,
  IconTableRow,
} from '@tabler/icons-react'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MenuItem, MenuSeparator } from '@/components/ui/menu'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { ToolbarButton } from '@/components/ui/toolbar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import { keepEditorFocus, returnFocusToEditor, ToolbarMenu } from './editor-toolbar-controls'

/** The table the cursor is in, if any. */
function currentTable(editor: Editor): ProseMirrorNode | null {
  const { $from } = editor.state.selection
  for (let depth = $from.depth; depth > 0; depth = depth - 1) {
    const node = $from.node(depth)
    if (node.type.name === 'table') {
      return node
    }
  }
  return null
}

/** Whether the first row of the table the cursor is in is all header cells, like toggleHeaderRow checks. */
export function hasHeaderRow(editor: Editor): boolean {
  const firstRow = currentTable(editor)?.firstChild
  if (!firstRow) {
    return false
  }
  let isAllHeaders = true
  firstRow.forEach((cell) => {
    if (cell.type.name !== 'tableHeader') {
      isAllHeaders = false
    }
  })
  return isAllHeaders
}

/** Whether every row of the table the cursor is in starts with a header cell, like toggleHeaderColumn checks. */
export function hasHeaderColumn(editor: Editor): boolean {
  const table = currentTable(editor)
  if (!table || table.childCount === 0) {
    return false
  }
  let isAllHeaders = true
  table.forEach((row) => {
    if (row.firstChild?.type.name !== 'tableHeader') {
      isAllHeaders = false
    }
  })
  return isAllHeaders
}

/**
 * The largest table the picker offers; more rows can be added later. The PDF gives
 * every column the same width, so more columns would make them too narrow to read.
 */
const PICKER_COLUMNS = 8
const PICKER_ROWS = 8

interface TableSize {
  columns: number
  rows: number
}

/**
 * Pointing at a cell, or moving with the arrow keys, picks that size; a click or
 * Enter inserts it. Only the picked cell is in the Tab order.
 */
function TableSizeGrid({ onPick }: { onPick: (size: TableSize) => void }) {
  const [size, setSize] = useState<TableSize>({ columns: 1, rows: 1 })
  const gridRef = useRef<HTMLDivElement>(null)

  function focusCell(columns: number, rows: number) {
    const cell = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-columns="${columns}"][data-rows="${rows}"]`,
    )
    cell?.focus()
  }

  const cells = Array.from({ length: PICKER_ROWS * PICKER_COLUMNS }, (_, index) => {
    const rows = Math.floor(index / PICKER_COLUMNS) + 1
    const columns = (index % PICKER_COLUMNS) + 1
    const isPicked = columns <= size.columns && rows <= size.rows
    const isCorner = columns === size.columns && rows === size.rows

    return (
      <button
        key={index}
        type="button"
        data-columns={columns}
        data-rows={rows}
        aria-label={m.documents_table_insert_size({ columns, rows })}
        tabIndex={isCorner ? 0 : -1}
        className={cn(
          'size-5 rounded-sm border outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isPicked ? 'border-primary bg-primary/64' : 'border-input bg-muted',
        )}
        onPointerEnter={() => {
          setSize({ columns, rows })
        }}
        onFocus={() => {
          setSize({ columns, rows })
        }}
        onClick={() => {
          onPick({ columns, rows })
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            focusCell(Math.min(columns + 1, PICKER_COLUMNS), rows)
          } else if (event.key === 'ArrowLeft') {
            focusCell(Math.max(columns - 1, 1), rows)
          } else if (event.key === 'ArrowDown') {
            focusCell(columns, Math.min(rows + 1, PICKER_ROWS))
          } else if (event.key === 'ArrowUp') {
            focusCell(columns, Math.max(rows - 1, 1))
          } else {
            return
          }
          event.preventDefault()
        }}
      />
    )
  })

  return (
    <div className="flex flex-col items-center gap-2">
      {/* grid-cols-8: PICKER_COLUMNS. */}
      <div ref={gridRef} className="grid grid-cols-8 gap-1">
        {cells}
      </div>
      <span aria-hidden className="text-sm text-muted-foreground tabular-nums">
        {m.documents_table_size(size)}
      </span>
    </div>
  )
}

/** Outside a table, the table button picks the size of a new one. */
function TableInsertPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <ToolbarButton
                  aria-label={m.documents_format_table()}
                  onMouseDown={(event) => {
                    keepEditorFocus(event)
                  }}
                  render={<Button type="button" variant="ghost" size="sm" className="gap-0.5 px-1.5" />}
                />
              }
            />
          }
        >
          <IconTable />
          <IconChevronDown className="size-3" />
        </TooltipTrigger>
        <TooltipContent>{m.documents_format_table()}</TooltipContent>
      </Tooltip>
      <PopoverPopup
        align="start"
        finalFocus={() => {
          return returnFocusToEditor(editor)
        }}
      >
        <TableSizeGrid
          onPick={({ columns, rows }) => {
            setOpen(false)
            editor.chain().focus().insertTable({ rows, cols: columns, withHeaderRow: true }).run()
          }}
        />
      </PopoverPopup>
    </Popover>
  )
}

interface TableMenuProps {
  editor: Editor
  isTable: boolean
  isHeaderRow: boolean
  isHeaderColumn: boolean
}

/**
 * Outside a table, inserts one; inside, edits it: rows, columns and its headers.
 * No table inside another: a table in a cell is hard to read.
 */
export function TableMenu({ editor, isTable, isHeaderRow, isHeaderColumn }: TableMenuProps) {
  if (!isTable) {
    return <TableInsertPopover editor={editor} />
  }

  return (
    <ToolbarMenu editor={editor} label={m.documents_format_table()} icon={IconTable} isActive>
      <MenuItem
        onClick={() => {
          editor.chain().focus().addRowBefore().run()
        }}
      >
        <IconRowInsertTop />
        {m.documents_table_add_row_before()}
      </MenuItem>
      <MenuItem
        onClick={() => {
          editor.chain().focus().addRowAfter().run()
        }}
      >
        <IconRowInsertBottom />
        {m.documents_table_add_row_after()}
      </MenuItem>
      <MenuItem
        onClick={() => {
          editor.chain().focus().addColumnBefore().run()
        }}
      >
        <IconColumnInsertLeft />
        {m.documents_table_add_column_before()}
      </MenuItem>
      <MenuItem
        onClick={() => {
          editor.chain().focus().addColumnAfter().run()
        }}
      >
        <IconColumnInsertRight />
        {m.documents_table_add_column_after()}
      </MenuItem>
      <MenuSeparator />
      <MenuItem
        onClick={() => {
          editor.chain().focus().toggleHeaderRow().run()
        }}
      >
        <IconTableRow />
        <span className="flex-1">{m.documents_table_header_row()}</span>
        {isHeaderRow && <IconCheck />}
      </MenuItem>
      <MenuItem
        onClick={() => {
          editor.chain().focus().toggleHeaderColumn().run()
        }}
      >
        <IconTableColumn />
        <span className="flex-1">{m.documents_table_header_column()}</span>
        {isHeaderColumn && <IconCheck />}
      </MenuItem>
      <MenuSeparator />
      <MenuItem
        onClick={() => {
          editor.chain().focus().deleteRow().run()
        }}
      >
        <IconRowRemove />
        {m.documents_table_delete_row()}
      </MenuItem>
      <MenuItem
        onClick={() => {
          editor.chain().focus().deleteColumn().run()
        }}
      >
        <IconColumnRemove />
        {m.documents_table_delete_column()}
      </MenuItem>
      <MenuItem
        onClick={() => {
          editor.chain().focus().deleteTable().run()
        }}
      >
        <IconTableOff />
        {m.documents_table_delete()}
      </MenuItem>
    </ToolbarMenu>
  )
}
