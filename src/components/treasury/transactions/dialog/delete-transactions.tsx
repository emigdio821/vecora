'use client'

import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AlertDialogPrimitive } from '@/components/ui/alert-dialog'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toastManager } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'
import { deleteTransactions, restoreTransactions } from '@/server-actions/treasury'
import { type TransactionQueryData, TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'

/** How long the "Deshacer" toast stays up. Ledger rows are never purged;
 *  this only bounds the one-click shortcut. */
const UNDO_TOAST_TIMEOUT_MS = 8000

/**
 * Standalone (not a hook): by the time the user clicks "Deshacer" the row —
 * and the menu/dialog that started the delete — is usually unmounted.
 */
async function undoDelete(queryClient: QueryClient, ids: string[]) {
  const result = await restoreTransactions(ids)

  if (result.error !== undefined) {
    toastManager.add({ type: 'error', title: 'No se pudo deshacer', description: result.error })
    return
  }

  void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
  toastManager.add({
    type: 'success',
    title: result.data.restored === 1 ? 'Movimiento restaurado' : 'Movimientos restaurados',
  })
}

interface DeleteTransactionsAlertDialogProps extends React.ComponentProps<typeof AlertDialog> {
  /** One movement from a row menu, or many from the table selection. */
  transactions: TransactionQueryData[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful delete, e.g. to clear the table selection. */
  onDeleted?: () => void
}

export function DeleteTransactionsAlertDialog({
  transactions,
  open,
  onOpenChange,
  onDeleted,
  ...props
}: DeleteTransactionsAlertDialogProps) {
  const queryClient = useQueryClient()
  const count = transactions.length
  const isSingle = count === 1
  const total = transactions.reduce((sum, t) => sum + Number(t.amount) * (t.kind === 'income' ? 1 : -1), 0)
  const hasFee = transactions.some((t) => t.category.key !== null)
  const feeClause = hasFee
    ? ` ${isSingle ? 'Es una cuota, así que ese mes volverá a aparecer como pendiente para la casa.' : 'Incluye cuotas, así que esos meses volverán a aparecer como pendientes para sus casas.'}`
    : ''
  const description = `${isSingle ? 'Dejará' : 'Dejarán'} de contar en el saldo (${formatCurrency(Math.abs(total))} ${total >= 0 ? 'menos' : 'más'}).${feeClause} Solo podrás deshacerlo durante unos segundos.`

  const mutation = useMutation({
    mutationFn: async () => {
      const ids = transactions.map((t) => t.id)
      const result = await deleteTransactions(ids)
      if (result.error !== undefined) throw new Error(result.error)
      return { ...result.data, ids }
    },
    onSuccess: ({ deleted, ids }) => {
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })

      const partial = deleted < count // RLS filtered some rows out
      const toastId = toastManager.add({
        type: partial ? 'warning' : 'success',
        title: partial ? 'Eliminación parcial' : isSingle ? 'Movimiento eliminado' : 'Movimientos eliminados',
        description: partial
          ? `Se eliminaron ${deleted} de ${count} movimientos`
          : isSingle
            ? transactions[0].description
            : `Se eliminaron ${deleted} movimientos`,
        timeout: UNDO_TOAST_TIMEOUT_MS,
        actionProps: {
          children: 'Deshacer',
          onClick: () => {
            toastManager.close(toastId)
            void undoDelete(queryClient, ids)
          },
        },
      })

      onDeleted?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({
        type: 'error',
        title: 'No se pudo eliminar',
        description: error.message,
      })
    },
  })

  const handleOpenChange: AlertDialogPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange} {...props}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSingle ? '¿Eliminar este movimiento?' : `¿Eliminar ${count} movimientos?`}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="max-h-48 scroll-fade overflow-y-auto px-6 pb-4 text-sm">
          {transactions.map((transaction) => (
            <li key={transaction.id} className="flex justify-between gap-4">
              <span className="truncate">{transaction.description}</span>
              <span className="shrink-0 tabular-nums">
                {transaction.kind === 'income' ? '+' : '−'}
                {formatCurrency(transaction.amount)}
              </span>
            </li>
          ))}
        </ul>

        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            Cancelar
          </AlertDialogClose>
          <Button
            variant="destructive"
            loading={mutation.isPending}
            disabled={count === 0}
            onClick={() => {
              mutation.mutate()
            }}
          >
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}
