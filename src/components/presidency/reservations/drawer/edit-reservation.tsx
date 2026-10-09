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
import { formatDay } from '@/lib/utils'
import { type ReservationInput, reservationSchema } from '@/lib/validations/presidency'
import { m } from '@/paraglide/messages'
import { updateReservation } from '@/server-actions/presidency'
import { PRESIDENCY_QUERY_KEY, type ReservationQueryData } from '@/tanstack-queries/presidency'
import { reservationPayment, reservationSummary } from '../status'
import { ReservationFormFields } from './reservation-form-fields'

const FORM_ID = 'edit-reservation-form'

interface EditReservationDrawerProps extends React.ComponentProps<typeof Drawer> {
  reservation: ReservationQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type UpdateMutation = UseMutationResult<void, Error, ReservationInput>

export function EditReservationDrawer({
  reservation,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: EditReservationDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: ReservationInput) => {
      const result = await updateReservation(reservation.id, values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [PRESIDENCY_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: m.presidency_reservation_updated(),
        description: formatDay(values.reserved_on),
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
          <DrawerTitle>{m.presidency_edit_reservation_title()}</DrawerTitle>
          <DrawerDescription>{reservationSummary(reservation)}</DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while the drawer is open, so the form always starts
            from the current row and a refetch mid-edit can't reset it. */}
        <EditReservationForm reservation={reservation} mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function EditReservationForm({
  reservation,
  mutation,
}: {
  reservation: ReservationQueryData
  mutation: UpdateMutation
}) {
  const form = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      amenity_id: reservation.amenity.id,
      property_id: reservation.property.id,
      reserved_on: reservation.reserved_on,
      amount: Number(reservation.amount),
      notes: reservation.notes ?? '',
    },
  })
  const isPaid = reservationPayment(reservation) !== undefined

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
          {isPaid && (
            <Alert variant="info">
              <IconInfoCircle />
              <AlertTitle>{m.presidency_reservation_paid_title()}</AlertTitle>
              <AlertDescription>{m.presidency_reservation_paid_description()}</AlertDescription>
            </Alert>
          )}

          <ReservationFormFields
            form={form}
            currency={reservation.currency}
            disabled={isBusy}
            currentId={reservation.id}
            lockPaidFields={isPaid}
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
