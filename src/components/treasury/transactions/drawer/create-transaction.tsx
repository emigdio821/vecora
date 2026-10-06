import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
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
import { useCurrency, useFormatCurrency } from '@/hooks/use-currency'
import { ISO_DAY } from '@/lib/utils'
import {
  type CreateTransactionInput,
  createTransactionSchema,
  type TransactionKind,
} from '@/lib/validations/treasury'
import { m } from '@/paraglide/messages'
import { createTransaction } from '@/server-actions/treasury'
import { TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'
import { TransactionFormFields } from './transaction-form-fields'

const FORM_ID = 'create-transaction-form'

function defaultValues(kind: TransactionKind): CreateTransactionInput {
  return {
    kind,
    category_id: '',
    // The schema wants a number; RHF/NumberField hand us null until typed.
    amount: null as unknown as number,
    occurred_on: format(new Date(), ISO_DAY),
    payment_method: 'cash',
    folio: '',
    reference: '',
    property_id: null,
    description: '',
    notes: '',
  }
}

interface CreateTransactionDrawerProps extends React.ComponentProps<typeof Drawer> {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Which side the drawer opens on; the treasurer can still switch inside. */
  defaultKind?: TransactionKind
}

export function CreateTransactionDrawer({
  open,
  onOpenChange,
  defaultKind = 'income',
  ...props
}: CreateTransactionDrawerProps) {
  const queryClient = useQueryClient()
  const currency = useCurrency()
  const formatCurrency = useFormatCurrency()

  const form = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: defaultValues(defaultKind),
  })

  const mutation = useMutation({
    mutationFn: async (values: CreateTransactionInput) => {
      const result = await createTransaction(values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: values.kind === 'income' ? m.treasury_income_recorded() : m.treasury_expense_recorded(),
        description: `${values.description} - ${formatCurrency(values.amount, currency)}`,
      })
      onOpenChange(false)
    },
    onError: (error) => {
      form.setError('root', { message: error.message })
    },
  })

  const handleOpenChange: DrawerPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  function handleOpenChangeComplete(isOpen: boolean) {
    props.onOpenChangeComplete?.(isOpen)

    if (!isOpen) {
      form.reset(defaultValues(defaultKind))
    }
  }

  return (
    <Drawer
      position="right"
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      {...props}
    >
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{m.treasury_record_transaction()}</DrawerTitle>
          <DrawerDescription>{m.treasury_record_transaction_description()}</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <TransactionFormFields form={form} currency={currency} disabled={mutation.isPending} />

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
          <DrawerClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            {m.common_action_cancel()}
          </DrawerClose>
          <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
            {m.treasury_record()}
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}
