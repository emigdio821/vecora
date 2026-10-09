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
import { useFormatCurrency } from '@/hooks/use-currency'
import type { CurrencyCode } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import { deleteTransactions, restoreTransactions } from '@/server-actions/treasury'
import { type TransactionQueryData, TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'

/** How long the undo toast stays up. Ledger rows are never purged;
 *  this only bounds the one-click shortcut. */
const UNDO_TOAST_TIMEOUT_MS = 8000

/**
 * Standalone (not a hook): by the time the user clicks Undo the row —
 * and the menu/dialog that started the delete — is usually unmounted.
 */
async function undoDelete(queryClient: QueryClient, ids: string[]) {
  const result = await restoreTransactions(ids)

  if (result.error !== undefined) {
    toastManager.add({ type: 'error', title: m.common_undo_failed(), description: result.error })
    return
  }

  void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
  toastManager.add({
    type: 'success',
    title:
      result.data.restored === 1 ? m.treasury_transaction_restored() : m.treasury_transactions_restored(),
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
  onOpenChangeComplete,
  ...props
}: DeleteTransactionsAlertDialogProps) {
  const queryClient = useQueryClient()
  const count = transactions.length
  const isSingle = count === 1
  const formatCurrency = useFormatCurrency()
  // Net effect on the balance, one per currency in the selection.
  const totals = new Map<CurrencyCode, number>()
  for (const t of transactions) {
    totals.set(t.currency, (totals.get(t.currency) ?? 0) + Number(t.amount) * (t.kind === 'income' ? 1 : -1))
  }
  const impact = [...totals]
    .map(([currency, total]) => {
      const amount = formatCurrency(Math.abs(total), currency)
      return total >= 0
        ? m.treasury_delete_impact_less({ amount })
        : m.treasury_delete_impact_more({ amount })
    })
    .join(', ')
  const hasFee = transactions.some((t) => t.category.key === 'fee')
  const feeClause = hasFee
    ? isSingle
      ? m.treasury_delete_fee_clause_one()
      : m.treasury_delete_fee_clause_many()
    : null
  const hasAmenityFee = transactions.some((t) => t.category.key === 'amenity_fee')
  const amenityClause = hasAmenityFee ? m.treasury_delete_amenity_clause() : null
  const description = [
    m.treasury_delete_transactions_impact({ count, impact }),
    feeClause,
    amenityClause,
    m.treasury_delete_undo_hint(),
  ]
    .filter(Boolean)
    .join(' ')

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
        title: partial
          ? m.common_partial_delete()
          : isSingle
            ? m.treasury_transaction_deleted()
            : m.treasury_transactions_deleted(),
        description: partial
          ? m.treasury_transactions_deleted_partial({ deleted, count })
          : isSingle
            ? transactions[0].description
            : m.treasury_transactions_deleted_count({ count: deleted }),
        timeout: UNDO_TOAST_TIMEOUT_MS,
        actionProps: {
          children: m.common_action_undo(),
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
        title: m.common_delete_failed(),
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

  // Still busy after a delete, until the dialog has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <AlertDialog
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        // Clears `success`, which keeps the buttons busy while the dialog closes.
        if (!isOpen) {
          mutation.reset()
        }
        onOpenChangeComplete?.(isOpen)
      }}
      {...props}
    >
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.treasury_delete_transactions_title({ count })}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="max-h-48 scroll-fade overflow-y-auto px-6 pb-4 text-sm">
          {transactions.map((transaction) => (
            <li key={transaction.id} className="flex justify-between gap-4">
              <span className="truncate">{transaction.description}</span>
              <span className="shrink-0 tabular-nums">
                {transaction.kind === 'income' ? '+' : '−'}
                {formatCurrency(transaction.amount, transaction.currency)}
              </span>
            </li>
          ))}
        </ul>

        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />} disabled={isBusy}>
            {m.common_action_cancel()}
          </AlertDialogClose>
          <Button
            variant="destructive"
            loading={isBusy}
            disabled={count === 0}
            onClick={() => {
              mutation.mutate()
            }}
          >
            {m.common_action_delete()}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}
