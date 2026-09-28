'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { CircleAlertIcon } from 'lucide-react'
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
import { type HallReservationInput, hallReservationSchema } from '@/lib/validations/presidency'
import { updateHallReservation } from '@/server-actions/presidency'
import { type HallReservationQueryData, PRESIDENCY_QUERY_KEY } from '@/tanstack-queries/presidency'
import { HallReservationFormFields } from './hall-reservation-form-fields'

const FORM_ID = 'edit-hall-reservation-form'

interface EditHallReservationDrawerProps extends React.ComponentProps<typeof Drawer> {
  reservation: HallReservationQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type UpdateMutation = UseMutationResult<void, Error, HallReservationInput>

export function EditHallReservationDrawer({
  reservation,
  open,
  onOpenChange,
  ...props
}: EditHallReservationDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: HallReservationInput) => {
      const result = await updateHallReservation(reservation.id, values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [PRESIDENCY_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: 'Reservación actualizada',
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
    <Drawer position="right" open={open} onOpenChange={handleOpenChange} {...props}>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>Editar reservación</DrawerTitle>
          <DrawerDescription>
            {formatDay(reservation.reserved_on)} - Casa {reservation.property.number}
          </DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while the drawer is open, so the form always starts
            from the current row and a refetch mid-edit can't reset it. */}
        <EditHallReservationForm reservation={reservation} mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function EditHallReservationForm({
  reservation,
  mutation,
}: {
  reservation: HallReservationQueryData
  mutation: UpdateMutation
}) {
  const form = useForm<HallReservationInput>({
    resolver: zodResolver(hallReservationSchema),
    defaultValues: {
      property_id: reservation.property.id,
      reserved_on: reservation.reserved_on,
      notes: reservation.notes ?? '',
    },
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
          <HallReservationFormFields form={form} disabled={mutation.isPending} currentId={reservation.id} />

          {form.formState.errors.root && (
            <Alert variant="error">
              <CircleAlertIcon />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}
        </Form>
      </DrawerPanel>

      <DrawerFooter>
        <DrawerClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
          Cancelar
        </DrawerClose>
        <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
          Guardar
        </Button>
      </DrawerFooter>
    </>
  )
}
