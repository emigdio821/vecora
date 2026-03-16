import { IconArrowNarrowDown, IconArrowNarrowUp, IconArrowsSort } from '@tabler/icons-react'
import type { Column } from '@tanstack/react-table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

interface DataTableSortableHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableSortableHeader<TData, TValue>({
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
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="gap-1">
              <span className="text-sm">{title}</span>
              {isAscSorted && <IconArrowNarrowDown className="size-4" />}
              {isDescSorted && <IconArrowNarrowUp className="size-4" />}
              {!column.getIsSorted() && <IconArrowsSort className="size-4" />}
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="max-w-42">
          <DropdownMenuGroup>
            <DropdownMenuCheckboxItem
              checked={isAscSorted}
              onClick={() => {
                if (isAscSorted) {
                  column.clearSorting()
                } else {
                  column.toggleSorting(false)
                }
              }}
            >
              Ascendete
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
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
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
