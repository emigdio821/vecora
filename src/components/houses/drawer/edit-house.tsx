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
import { type UpdateHouseInput, updateHouseSchema } from '@/lib/validations/houses'
import { m } from '@/paraglide/messages'
import { updateHouse } from '@/server-actions/houses'
import { HOUSES_QUERY_KEY, type HouseQueryData } from '@/tanstack-queries/houses'
import { HouseFormFields } from './house-form-fields'
import { HouseResidents } from './house-residents'

const FORM_ID = 'edit-house-form'

interface EditHouseDrawerProps extends React.ComponentProps<typeof Drawer> {
  house: HouseQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type UpdateHouseMutation = UseMutationResult<void, Error, UpdateHouseInput>

export function EditHouseDrawer({
  house,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: EditHouseDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: UpdateHouseInput) => {
      const result = await updateHouse(house.id, values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: m.residential_house_updated(),
        description: m.residential_house_updated_description({ number: values.number }),
      })
      // Not handleOpenChange: the mutation is still `pending` while onSuccess runs.
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
          <DrawerTitle>{m.residential_edit_house()}</DrawerTitle>
          <DrawerDescription>{m.common_house_label({ number: house.number })}</DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while the drawer is open, so the form always starts
            from the current house and a refetch mid-edit can't reset it. */}
        <EditHouseForm house={house} mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function toFormValues(house: HouseQueryData): UpdateHouseInput {
  return {
    number: house.number,
    notes: house.notes ?? '',
  }
}

function EditHouseForm({ house, mutation }: { house: HouseQueryData; mutation: UpdateHouseMutation }) {
  const form = useForm<UpdateHouseInput>({
    resolver: zodResolver(updateHouseSchema),
    defaultValues: toFormValues(house),
  })

  // Still busy after a save, until the drawer has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <>
      <DrawerPanel className="grid gap-6">
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
          <HouseFormFields control={form.control} />

          {form.formState.errors.root && (
            <Alert variant="error">
              <IconAlertCircle />
              <AlertTitle>{m.common_error()}</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}
        </Form>

        {/* Links save on their own (assign/unassign), independent of the form's Guardar. */}
        <HouseResidents house={house} disabled={isBusy} />
      </DrawerPanel>

      <DrawerFooter>
        <DrawerClose render={<Button variant="ghost" />} disabled={isBusy}>
          {m.common_action_cancel()}
        </DrawerClose>
        <Button type="submit" form={FORM_ID} disabled={isBusy || !form.formState.isDirty} loading={isBusy}>
          {m.common_action_save()}
        </Button>
      </DrawerFooter>
    </>
  )
}
