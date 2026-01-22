import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Table } from '@tanstack/react-table'
import { toastManager } from '@/components/ui/toast'

interface BulkDeleteConfig<TData> {
  deleteFn: (item: TData) => Promise<unknown>
  invalidateKeys: string[]
  entityNamePlural: string
  table: Table<TData>
  onSuccess?: () => void
}

export function useBulkDelete<TData>({
  deleteFn,
  invalidateKeys,
  entityNamePlural,
  table,
  onSuccess: customOnSuccess,
}: BulkDeleteConfig<TData>) {
  const queryClient = useQueryClient()
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedItems = selectedRows.map((row) => row.original)

  return useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(selectedItems.map((item) => deleteFn(item)))

      const fulfilled = results.filter((r) => r.status === 'fulfilled').length
      const rejected = results.filter((r) => r.status === 'rejected').length

      return { fulfilled, rejected, total: results.length }
    },
    onSuccess: ({ fulfilled, rejected }) => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      table.resetRowSelection()

      if (rejected === 0) {
        toastManager.add({
          type: 'success',
          title: `${entityNamePlural} eliminados`,
          description: `${entityNamePlural} seleccionados han sido eliminados exitosamente.`,
        })
      } else if (fulfilled === 0) {
        toastManager.add({
          type: 'error',
          title: 'Error',
          description: `Ocurrió un error al eliminar los ${entityNamePlural.toLowerCase()}, intenta nuevamente.`,
        })
      } else {
        toastManager.add({
          type: 'warning',
          title: 'Advertencia',
          description: `${fulfilled} eliminados, ${rejected} fallaron.`,
        })
      }

      customOnSuccess?.()
    },
    onError: () => {
      toastManager.add({
        type: 'error',
        title: 'Error',
        description: `Ocurrió un error al eliminar los ${entityNamePlural.toLowerCase()}, intenta nuevamente.`,
      })
    },
  })
}
