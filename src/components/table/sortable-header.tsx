import { IconArrowNarrowDown, IconArrowNarrowUp, IconArrowsSort, IconFilter2X } from '@tabler/icons-react'
import type { Column } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import { Menu, MenuGroup, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from '../ui/menu'

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
      <Menu>
        <MenuTrigger
          render={
            <Button variant="plain" size="sm">
              <span>{title}</span>
              {isAscSorted && <IconArrowNarrowDown className="size-4" />}
              {isDescSorted && <IconArrowNarrowUp className="size-4" />}
              {!column.getIsSorted() && <IconArrowsSort className="size-4" />}
            </Button>
          }
        />
        <MenuPopup align="start" className="max-w-42">
          <MenuGroup>
            <MenuItem disabled={isAscSorted} onClick={() => column.toggleSorting(false)}>
              <IconArrowNarrowDown className="size-4" />
              Ascendete
            </MenuItem>

            <MenuItem disabled={isDescSorted} onClick={() => column.toggleSorting(true)}>
              <IconArrowNarrowUp className="size-4" />
              Descendente
            </MenuItem>

            {column.getIsSorted() && (
              <>
                <MenuSeparator />
                <MenuItem onClick={() => column.clearSorting()}>
                  <IconFilter2X className="size-4" />
                  Restablecer
                </MenuItem>
              </>
            )}
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </div>
  )
}
