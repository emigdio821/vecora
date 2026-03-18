import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Table } from '@tanstack/react-table'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

interface BulkDeleteConfig<TData> {
  deleteFn: (item: TData) => Promise<unknown>
  invalidateKeys: string[]
  successTitle: React.ReactNode
  successDescription: React.ReactNode
  errorTitle?: React.ReactNode
  errorDescription?: React.ReactNode
  table: Table<TData>
  onSuccess?: () => void
}

export function useBulkDelete<TData>({
  deleteFn,
  invalidateKeys,
  successTitle,
  successDescription,
  errorTitle,
  errorDescription,
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
        toast.success(successTitle, {
          description: successDescription,
        })
      } else if (fulfilled === 0) {
        toast.error(errorTitle || 'Error', {
          description: errorDescription || 'Ocurrió un error al eliminar los elementos, intenta nuevamente',
        })
      } else {
        toast.warning('Advertencia', {
          description: `${fulfilled} eliminados, ${rejected} fallaron.`,
        })
      }

      customOnSuccess?.()
    },
    onError: (error) => {
      toast.error(errorTitle || 'Error', {
        description: errorDescription || 'Ocurrió un error al eliminar los elementos, intenta nuevamente',
      })

      logger.error('Bulk Delete Error', error)
    },
  })
}
