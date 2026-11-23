import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { VehiclesPicker } from '@/components/shared/pickers/vehicles-picker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { toastManager } from '@/components/ui/toast'
import { type AssignVehiclesInput, assignVehiclesSchema } from '@/lib/validations/vehicles'
import { m } from '@/paraglide/messages'
import { assignVehicles } from '@/server-actions/vehicles'
import { HOUSES_QUERY_KEY, type HouseQueryData } from '@/tanstack-queries/houses'
import { VEHICLES_QUERY_KEY } from '@/tanstack-queries/vehicles'

const FORM_ID = 'assign-vehicles-form'

const defaultValues: AssignVehiclesInput = {
  vehicleIds: [],
}

interface AssignVehiclesDrawerProps extends React.ComponentProps<typeof Drawer> {
  house: HouseQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignVehiclesDrawer({ house, open, onOpenChange, ...props }: AssignVehiclesDrawerProps) {
  const queryClient = useQueryClient()
  const [scope, setScope] = useState<'all' | 'unassigned'>('unassigned')

  const form = useForm<AssignVehiclesInput>({
    resolver: zodResolver(assignVehiclesSchema),
    defaultValues,
  })

  const mutation = useMutation({
    mutationFn: async (values: AssignVehiclesInput) => {
      const result = await assignVehicles(house.id, values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: ({ assigned }) => {
      // Both sides show it: the house's vehicles and each vehicle's house (one
      // moved from another house changes that house too).
      void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [VEHICLES_QUERY_KEY] })
      if (assigned === 1) {
        toastManager.add({
          type: 'success',
          title: m.residential_vehicle_assigned(),
          description: m.residential_vehicle_assigned_description({ number: house.number }),
        })
      } else {
        toastManager.add({
          type: 'success',
          title: m.residential_vehicles_assigned(),
          description: m.residential_vehicles_assigned_description({ count: assigned, number: house.number }),
        })
      }
      // Not handleOpenChange: the mutation is still `pending` while onSuccess runs.
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
      form.reset(defaultValues)
      setScope('unassigned')
      mutation.reset()
    }
  }

  // Still busy after a save, until the drawer has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  const currentVehicleIds = house.vehicles.map((vehicle) => vehicle.id)

  return (
    <Drawer
      position="right"
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      {...props}
    >
      <DrawerPopup>
        <DrawerHeader>
          <DrawerTitle>{m.residential_assign_vehicles()}</DrawerTitle>
          <DrawerDescription>{m.common_house_label({ number: house.number })}</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <Controller
              name="vehicleIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched}
                  dirty={fieldState.isDirty}
                >
                  <FieldLabel>
                    {m.residential_vehicles()} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <VehiclesPicker
                    multiple
                    scope={scope}
                    excludeIds={currentVehicleIds}
                    value={field.value}
                    onValueChange={field.onChange}
                    inputRef={field.ref}
                    disabled={isBusy}
                  />
                  <FieldDescription>{m.residential_vehicles_picker_hint()}</FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Label className="flex items-start gap-2 rounded-lg border p-3 hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50">
              <Checkbox
                checked={scope === 'unassigned'}
                onCheckedChange={(checked) => {
                  setScope(checked ? 'unassigned' : 'all')
                }}
              />
              <div className="flex flex-col gap-1">
                <p>{m.residential_only_unassigned_vehicles()}</p>
                <p className="text-xs text-muted-foreground">
                  {m.residential_only_unassigned_vehicles_hint()}
                </p>
              </div>
            </Label>

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
            {m.residential_action_assign()}
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}
