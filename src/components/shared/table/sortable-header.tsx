import type { Column, RowData } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Menu, MenuCheckboxItem, MenuPopup, MenuTrigger, MenuGroup } from '@/components/ui/menu'
import { cn } from '@/lib/utils'
import type { DataTableFeatures } from './features'

interface DataTableSortableHeaderProps<TData extends RowData, TValue> {
  title: string
  className?: string
  column: Column<DataTableFeatures, TData, TValue>
}

export function DataTableSortableHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableSortableHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  const isAscSorted = column.getIsSorted() === 'asc'
  const isDescSorted = column.getIsSorted() === 'desc'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Menu>
        <MenuTrigger
          render={
            <Button variant="ghost" size="sm" className="gap-2 text-inherit">
              <span className="text-sm">{title}</span>
              {isAscSorted && <ChevronUpIcon className="size-4" />}
              {isDescSorted && <ChevronDownIcon className="size-4" />}
              {!column.getIsSorted() && <ChevronsUpDownIcon className="size-4" />}
            </Button>
          }
        />
        <MenuPopup align="start" className="max-w-42">
          <MenuGroup>
            <MenuCheckboxItem
              checked={isAscSorted}
              onClick={() => {
                if (isAscSorted) {
                  column.clearSorting()
                } else {
                  column.toggleSorting(false)
                }
              }}
            >
              Ascendente
            </MenuCheckboxItem>
            <MenuCheckboxItem
              checked={isDescSorted}
              onClick={() => {
                if (isDescSorted) {
                  column.clearSorting()
                } else {
                  column.toggleSorting(true)
                }
              }}
            >
              Descendente
            </MenuCheckboxItem>
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </div>
  )
}
