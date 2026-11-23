import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { type QueryClient, useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { HousesPicker } from '@/components/shared/pickers/houses-picker'
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
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toastManager } from '@/components/ui/toast'
import type { VehicleKind } from '@/lib/enums'
import { type VehicleInput, vehicleSchema } from '@/lib/validations/vehicles'
import { m } from '@/paraglide/messages'
import { addVehicle, updateVehicle } from '@/server-actions/vehicles'
import { HOUSES_QUERY_KEY, housesPickerQueryOptions } from '@/tanstack-queries/houses'
import { VEHICLES_QUERY_KEY } from '@/tanstack-queries/vehicles'
import { VEHICLE_KIND_ITEMS } from '../vehicle'

const FORM_ID = 'vehicle-form'

/** What the form edits: a row of the Vehicles tab, with its house as an id. */
export interface EditableVehicle {
  id: string
  kind: VehicleKind
  plate: string
  rfidSerial: string | null
  propertyId: string | null
}

interface VehicleDrawerProps extends React.ComponentProps<typeof Drawer> {
  /** The vehicle to edit; none to add one. */
  vehicle?: EditableVehicle
  open: boolean
  onOpenChange: (open: boolean) => void
}

type VehicleMutation = UseMutationResult<void, Error, VehicleInput>

/** The number of the house a vehicle was saved with, for the toast. */
function savedHouseNumber(queryClient: QueryClient, propertyId: string | null): string | undefined {
  if (propertyId === null) {
    return undefined
  }
  // The picker loaded this list to offer the house.
  const pickerHouses = queryClient.getQueryData(housesPickerQueryOptions.queryKey)
  return pickerHouses?.find((pickerHouse) => pickerHouse.id === propertyId)?.number
}

/** Adds or edits a vehicle, from the Vehicles tab. */
export function VehicleDrawer({
  vehicle,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: VehicleDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: VehicleInput) => {
      let result
      if (vehicle) {
        result = await updateVehicle(vehicle.id, values)
      } else {
        result = await addVehicle(values)
      }
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      // Read before invalidating.
      const number = savedHouseNumber(queryClient, values.propertyId)

      // Houses list their vehicles, so they change too.
      void queryClient.invalidateQueries({ queryKey: [VEHICLES_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })

      // The resolver's output: the plate as saved (trimmed, uppercase), not as typed.
      const plate = values.plate
      if (vehicle) {
        toastManager.add({
          type: 'success',
          title: m.residential_vehicle_updated(),
          description: m.residential_vehicle_updated_description({ plate }),
        })
      } else if (number !== undefined) {
        toastManager.add({
          type: 'success',
          title: m.residential_vehicle_added(),
          description: m.residential_vehicle_added_description({ plate, number }),
        })
      } else {
        toastManager.add({
          type: 'success',
          title: m.residential_vehicle_added(),
          description: m.residential_vehicle_created_description({ plate }),
        })
      }
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

  let description: string = m.residential_new_vehicle_description()
  if (vehicle) {
    description = vehicle.plate
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
      <DrawerPopup>
        <DrawerHeader>
          <DrawerTitle>{vehicle ? m.residential_edit_vehicle() : m.residential_new_vehicle()}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while the drawer is open, so the form always starts
            from the current vehicle and a refetch mid-edit can't reset it. */}
        <VehicleForm vehicle={vehicle} mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function toFormValues(vehicle: EditableVehicle | undefined): VehicleInput {
  if (!vehicle) {
    return { kind: 'car', plate: '', rfidSerial: '', propertyId: null }
  }
  return {
    kind: vehicle.kind,
    plate: vehicle.plate,
    rfidSerial: vehicle.rfidSerial ?? '',
    propertyId: vehicle.propertyId,
  }
}

function VehicleForm({ vehicle, mutation }: { vehicle?: EditableVehicle; mutation: VehicleMutation }) {
  const form = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: toFormValues(vehicle),
  })

  // Still busy after a save, until the drawer has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  // An edit with nothing changed has nothing to save.
  const canSubmit = !vehicle || form.formState.isDirty

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
          <Controller
            name="kind"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>
                  {m.common_field_type()} <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  items={VEHICLE_KIND_ITEMS}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                  }}
                  disabled={isBusy}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {VEHICLE_KIND_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="plate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>
                  {m.residential_field_plate()} <span className="text-destructive">*</span>
                </FieldLabel>
                {/* Saved in uppercase, so it's shown that way while typing. */}
                <Input {...field} className="uppercase" autoComplete="off" disabled={isBusy} />
                <FieldDescription>{m.residential_plate_hint()}</FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="rfidSerial"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>{m.residential_field_rfid()}</FieldLabel>
                <Input {...field} autoComplete="off" disabled={isBusy} />
                <FieldDescription>{m.residential_rfid_hint()}</FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="propertyId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>{m.common_field_house()}</FieldLabel>
                <HousesPicker
                  value={field.value}
                  onValueChange={field.onChange}
                  inputRef={field.ref}
                  disabled={isBusy}
                />
                <FieldDescription>{m.residential_vehicle_house_hint()}</FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
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
        <Button type="submit" form={FORM_ID} disabled={isBusy || !canSubmit} loading={isBusy}>
          {m.common_action_save()}
        </Button>
      </DrawerFooter>
    </>
  )
}
