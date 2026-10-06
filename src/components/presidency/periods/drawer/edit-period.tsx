import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
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
import { type PeriodInput, periodSchema } from '@/lib/validations/treasury'
import { m } from '@/paraglide/messages'
import { updatePeriod } from '@/server-actions/treasury'
import { type PeriodQueryData, transactionCount, TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'
import { PeriodFormFields } from './period-form-fields'

const FORM_ID = 'edit-period-form'

interface EditPeriodDrawerProps extends React.ComponentProps<typeof Drawer> {
  period: PeriodQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type UpdatePeriodMutation = UseMutationResult<void, Error, PeriodInput>

export function EditPeriodDrawer({ period, open, onOpenChange, ...props }: EditPeriodDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: PeriodInput) => {
      const result = await updatePeriod(period.id, values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      // Movements embed the period name, so their list needs a refresh too.
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      toastManager.add({ type: 'success', title: m.presidency_period_updated(), description: values.name })
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
    <Drawer position="right" open={open} onOpenChange={handleOpenChange} {...props}>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{m.presidency_edit_period_title()}</DrawerTitle>
          <DrawerDescription>{period.name}</DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while the drawer is open, so the form always starts
            from the current row and a refetch mid-edit can't reset it. */}
        <EditPeriodForm period={period} mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function toFormValues(period: PeriodQueryData): PeriodInput {
  return {
    name: period.name,
    starts_on: period.starts_on,
    ends_on: period.ends_on,
    monthly_fee: Number(period.monthly_fee),
    late_fee: Number(period.late_fee),
    due_day: period.due_day,
  }
}

function EditPeriodForm({ period, mutation }: { period: PeriodQueryData; mutation: UpdatePeriodMutation }) {
  const form = useForm<PeriodInput>({
    resolver: zodResolver(periodSchema),
    defaultValues: toFormValues(period),
  })

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
          <PeriodFormFields
            form={form}
            currency={period.currency}
            disabled={mutation.isPending}
            inUse={transactionCount(period) > 0}
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
        <DrawerClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
          {m.common_action_cancel()}
        </DrawerClose>
        <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
          {m.common_action_save()}
        </Button>
      </DrawerFooter>
    </>
  )
}
