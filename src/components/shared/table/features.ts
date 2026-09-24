import {
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
} from '@tanstack/react-table'

/**
 * The single feature set shared by every <DataTable />.
 * TanStack Table v9 only exposes an API when its feature is registered here,
 * so add features in this file rather than per table.
 *
 * Order matters for row-model pipeline: filter -> sort -> paginate.
 */
export const dataTableFeatures = tableFeatures({
  columnSizingFeature,
  columnVisibilityFeature,
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

export type DataTableFeatures = typeof dataTableFeatures
