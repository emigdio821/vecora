import { createColumnHelper } from '@tanstack/react-table'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { systemCategorySource } from '@/lib/system-categories'
import { normalizeString } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import type { CategoryQueryData } from '@/tanstack-queries/treasury'
import { KIND_LABEL } from '../../kind'
import { CategoriesTableActions } from './actions'

const columnHelper = createColumnHelper<DataTableFeatures, CategoryQueryData>()

export const categoriesTableColumns = columnHelper.columns([
  columnHelper.accessor('name', {
    id: 'name',
    size: 320,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.common_field_name()} />,
    cell: ({ row }) => {
      const { name, key } = row.original
      return (
        <div className="grid gap-0.5">
          <span className="truncate">{name}</span>
          {key !== null && (
            <span className="text-xs text-muted-foreground">
              {m.treasury_category_used_by({ source: systemCategorySource(key) })}
            </span>
          )}
        </div>
      )
    },
    filterFn: (row, _columnId, value: string) => {
      const filterValue = normalizeString(value)
      if (!filterValue) return true
      return normalizeString(row.original.name).includes(filterValue)
    },
  }),

  columnHelper.accessor('kind', {
    id: 'kind',
    size: 140,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.common_field_type()} />,
    cell: ({ getValue }) => <Badge variant="outline">{KIND_LABEL[getValue()]}</Badge>,
  }),

  columnHelper.accessor('is_active', {
    id: 'is_active',
    size: 140,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.common_field_status()} />,
    cell: ({ getValue }) =>
      getValue() ? (
        <Badge variant="success">{m.treasury_category_active()}</Badge>
      ) : (
        <Badge variant="secondary">{m.treasury_category_inactive()}</Badge>
      ),
  }),

  columnHelper.display({
    id: 'actions',
    size: 50,
    cell: ({ row }) => <CategoriesTableActions category={row.original} />,
  }),
])
