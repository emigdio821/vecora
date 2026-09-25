'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CircleAlertIcon } from 'lucide-react'
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
import { formatDay, ISO_DAY } from '@/lib/utils'
import { type HallReservationInput, hallReservationSchema } from '@/lib/validations/presidency'
import { createHallReservation } from '@/server-actions/presidency'
import { housesPickerQueryOptions } from '@/tanstack-queries/houses'
import { PRESIDENCY_QUERY_KEY } from '@/tanstack-queries/presidency'
import { HallReservationFormFields } from './hall-reservation-form-fields'

const FORM_ID = 'create-hall-reservation-form'

function defaultValues(): HallReservationInput {
  return { property_id: '', reserved_on: format(new Date(), ISO_DAY), notes: '' }
}

interface CreateHallReservationDrawerProps extends React.ComponentProps<typeof Drawer> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateHallReservationDrawer({
  open,
  onOpenChange,
  ...props
}: CreateHallReservationDrawerProps) {
  const queryClient = useQueryClient()

  const form = useForm<HallReservationInput>({
    resolver: zodResolver(hallReservationSchema),
    defaultValues: defaultValues(),
  })

  const mutation = useMutation({
    mutationFn: async (values: HallReservationInput) => {
      const result = await createHallReservation(values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (_data, values) => {
      const house = queryClient
        .getQueryData(housesPickerQueryOptions().queryKey)
        ?.find((h) => h.id === values.property_id)

      void queryClient.invalidateQueries({ queryKey: [PRESIDENCY_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: 'Terraza reservada',
        description: `${formatDay(values.reserved_on)}${house ? ` · ${houseLabel(house)}` : ''}`,
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
      form.reset(defaultValues())
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
          <DrawerTitle>Reservar terraza</DrawerTitle>
          <DrawerDescription>
            La terraza se aparta por día completo y solo una casa puede usarla cada día.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <HallReservationFormFields form={form} disabled={mutation.isPending} />

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
            Reservar
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}
