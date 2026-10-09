import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle, IconInfoCircle } from '@tabler/icons-react'
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { DrawerPrimitive } from '@/components/ui/drawer'
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Form } from '@/components/ui/form'
import { toastManager } from '@/components/ui/toast'
import { useFormatCurrency } from '@/hooks/use-currency'
import { systemCategorySource } from '@/lib/system-categories'
import { type UpdateTransactionInput, updateTransactionSchema } from '@/lib/validations/treasury'
import { m } from '@/paraglide/messages'
import { updateTransaction } from '@/server-actions/treasury'
import { type TransactionQueryData, TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'
import { TransactionFormFields } from './transaction-form-fields'

const FORM_ID = 'edit-transaction-form'

interface EditTransactionDrawerProps extends React.ComponentProps<typeof Drawer> {
  transaction: TransactionQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type UpdateTransactionMutation = UseMutationResult<void, Error, UpdateTransactionInput>

export function EditTransactionDrawer({
  transaction,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: EditTransactionDrawerProps) {
  const queryClient = useQueryClient()
  const formatCurrency = useFormatCurrency()

  const mutation = useMutation({
    mutationFn: async (values: UpdateTransactionInput) => {
      const result = await updateTransaction(transaction.id, values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: m.treasury_transaction_updated(),
        description: `${values.description} - ${formatCurrency(values.amount, transaction.currency)}`,
      })
      onOpenChange(false)
    },
  })

  const handleOpenChange: DrawerPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  return (
    <Drawer
      position="right"
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        // Clears `success`, which keeps the form busy while the drawer slides out.
        if (!isOpen) {
          mutation.reset()
        }
        onOpenChangeComplete?.(isOpen)
      }}
      {...props}
    >
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{m.treasury_edit_transaction()}</DrawerTitle>
          <DrawerDescription>{transaction.description}</DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while the drawer is open, so the form always starts
            from the current row and a refetch mid-edit can't reset it. */}
        <EditTransactionForm transaction={transaction} mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function toFormValues(transaction: TransactionQueryData): UpdateTransactionInput {
  return {
    kind: transaction.kind,
    category_id: transaction.category.id,
    amount: Number(transaction.amount),
    occurred_on: transaction.occurred_on,
    payment_method: transaction.payment_method,
    folio: transaction.folio ?? '',
    reference: transaction.reference ?? '',
    property_id: transaction.property?.id ?? null,
    description: transaction.description,
    notes: transaction.notes ?? '',
  }
}

function EditTransactionForm({
  transaction,
  mutation,
}: {
  transaction: TransactionQueryData
  mutation: UpdateTransactionMutation
}) {
  const form = useForm<UpdateTransactionInput>({
    resolver: zodResolver(updateTransactionSchema),
    defaultValues: toFormValues(transaction),
  })
  // Fee, late-fee and reservation rows come from their RPCs (category key is set).
  const { key } = transaction.category
  const isFee = key !== null

  // Still busy after a save, until the drawer has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <>
      <DrawerPanel>
        <Form
          id={FORM_ID}
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate(values, {
              // Per-call callback so the error lands in this form instance.
              onError: (error) => form.setError('root', { message: error.message }),
            }),
          )}
        >
          {key !== null && (
            <Alert variant="info">
              <IconInfoCircle />
              <AlertTitle>{m.treasury_recorded_from({ source: systemCategorySource(key) })}</AlertTitle>
              <AlertDescription>
                {m.treasury_system_transaction_description({ source: systemCategorySource(key) })}
              </AlertDescription>
            </Alert>
          )}

          <TransactionFormFields
            form={form}
            currency={transaction.currency}
            disabled={isBusy}
            lockKind
            lockFeeFields={isFee}
          />

          {form.formState.errors.root && (
            <Alert variant="error">
              <IconAlertCircle />
              <AlertTitle>{m.common_error()}</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}
        </Form>
      </DrawerPanel>

      <DrawerFooter>
        <DrawerClose render={<Button variant="ghost" />} disabled={isBusy}>
          {m.common_action_cancel()}
        </DrawerClose>
        <Button type="submit" form={FORM_ID} disabled={isBusy} loading={isBusy}>
          {m.common_action_save()}
        </Button>
      </DrawerFooter>
    </>
  )
}
