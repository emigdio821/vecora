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
import { type AmenityInput, amenitySchema } from '@/lib/validations/presidency'
import { updateAmenity } from '@/server-actions/presidency'
import { type AmenityQueryData, PRESIDENCY_QUERY_KEY } from '@/tanstack-queries/presidency'
import { AmenityFormFields } from './amenity-form-fields'

const FORM_ID = 'edit-amenity-form'

interface EditAmenityDrawerProps extends React.ComponentProps<typeof Drawer> {
  amenity: AmenityQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type UpdateAmenityMutation = UseMutationResult<void, Error, AmenityInput>

export function EditAmenityDrawer({ amenity, open, onOpenChange, ...props }: EditAmenityDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: AmenityInput) => {
      const result = await updateAmenity(amenity.id, values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      // Reservations embed the area name, so their list needs a refresh too.
      void queryClient.invalidateQueries({ queryKey: [PRESIDENCY_QUERY_KEY] })
      toastManager.add({ type: 'success', title: 'Área actualizada', description: values.name })
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
          <DrawerTitle>Editar área</DrawerTitle>
          <DrawerDescription>
            {amenity.name}. Las reservaciones ya registradas conservan su monto.
          </DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while the drawer is open, so the form always starts
            from the current row and a refetch mid-edit can't reset it. */}
        <EditAmenityForm amenity={amenity} mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function EditAmenityForm({
  amenity,
  mutation,
}: {
  amenity: AmenityQueryData
  mutation: UpdateAmenityMutation
}) {
  const form = useForm<AmenityInput>({
    resolver: zodResolver(amenitySchema),
    defaultValues: { name: amenity.name, default_fee: Number(amenity.default_fee) },
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
          <AmenityFormFields form={form} disabled={mutation.isPending} />

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
          Guardar
        </Button>
      </DrawerFooter>
    </>
  )
}
