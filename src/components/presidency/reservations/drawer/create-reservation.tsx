import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { useMutation, type UseMutationResult, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { houseLabel } from '@/components/shared/pickers/houses-picker'
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
import { useCurrency } from '@/hooks/use-currency'
import { useToday } from '@/hooks/use-today'
import { formatDay, ISO_DAY } from '@/lib/utils'
import { type ReservationInput, reservationSchema } from '@/lib/validations/presidency'
import { createReservation } from '@/server-actions/presidency'
import { housesPickerQueryOptions } from '@/tanstack-queries/houses'
import { amenitiesQueryOptions, PRESIDENCY_QUERY_KEY } from '@/tanstack-queries/presidency'
import { ReservationFormFields } from './reservation-form-fields'

const FORM_ID = 'create-reservation-form'

interface CreateReservationDrawerProps extends React.ComponentProps<typeof Drawer> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type CreateMutation = UseMutationResult<{ id: string }, Error, ReservationInput>

export function CreateReservationDrawer({ open, onOpenChange, ...props }: CreateReservationDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: ReservationInput) => {
      const result = await createReservation(values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (_data, values) => {
      const amenity = queryClient
        .getQueryData(amenitiesQueryOptions().queryKey)
        ?.find((a) => a.id === values.amenity_id)
      const house = queryClient
        .getQueryData(housesPickerQueryOptions().queryKey)
        ?.find((h) => h.id === values.property_id)

      void queryClient.invalidateQueries({ queryKey: [PRESIDENCY_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: 'Reservación registrada',
        description: [amenity?.name, formatDay(values.reserved_on), house && houseLabel(house)]
          .filter(Boolean)
          .join(' - '),
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
          <DrawerTitle>Nueva reservación</DrawerTitle>
          <DrawerDescription>
            Cada área se aparta por día completo y solo una casa puede usarla cada día. Si lleva una tarifa,
            el cobro queda pendiente para la tesorería.
          </DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while open, so the defaults (today, the area) are fresh. */}
        <CreateReservationForm mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function CreateReservationForm({ mutation }: { mutation: CreateMutation }) {
  const today = useToday()
  const currency = useCurrency()
  const { data: amenities } = useQuery(amenitiesQueryOptions())
  // With a single area to book, there's nothing to choose.
  const active = (amenities ?? []).filter((a) => a.is_active)
  const onlyAmenity = active.length === 1 ? active[0] : undefined

  const form = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      amenity_id: onlyAmenity?.id ?? '',
      property_id: '',
      reserved_on: format(today, ISO_DAY),
      amount: Number(onlyAmenity?.default_fee ?? 0),
      notes: '',
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
          <ReservationFormFields form={form} currency={currency} disabled={mutation.isPending} />

          {form.formState.errors.root && (
            <Alert variant="error">
              <IconAlertCircle />
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
          Reservar
        </Button>
      </DrawerFooter>
    </>
  )
}
