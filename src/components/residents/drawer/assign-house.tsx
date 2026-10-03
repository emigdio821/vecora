import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleAlertIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { RELATIONSHIP_ITEMS } from '@/components/houses/relationship'
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
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toastManager } from '@/components/ui/toast'
import { type AssignHouseInput, assignHouseSchema } from '@/lib/validations/houses'
import { assignResidents } from '@/server-actions/houses'
import { HOUSES_QUERY_KEY, housesPickerQueryOptions } from '@/tanstack-queries/houses'
import { RESIDENTS_QUERY_KEY, type ResidentQueryData } from '@/tanstack-queries/residents'

const FORM_ID = 'assign-house-form'

const defaultValues: AssignHouseInput = {
  houseId: '',
  relationship: 'owner',
}

interface AssignHouseDrawerProps extends React.ComponentProps<typeof Drawer> {
  resident: ResidentQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignHouseDrawer({ resident, open, onOpenChange, ...props }: AssignHouseDrawerProps) {
  const queryClient = useQueryClient()
  const name = `${resident.first_name} ${resident.last_name}`

  const form = useForm<AssignHouseInput>({
    resolver: zodResolver(assignHouseSchema),
    defaultValues,
  })

  const mutation = useMutation({
    // The same link the house side creates, with just this resident.
    mutationFn: async ({ houseId, relationship }: AssignHouseInput) => {
      const result = await assignResidents(houseId, { residentIds: [resident.id], relationship })
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, { houseId }) => {
      // Read before invalidating; the picker loaded this list to offer the house.
      const house = queryClient
        .getQueryData(housesPickerQueryOptions().queryKey)
        ?.find((h) => h.id === houseId)
      // Both sides of the link show it: the house's residents and each resident's houses.
      void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: 'Casa asignada',
        description: house ? `${name} se asignó a la casa ${house.number}` : undefined,
      })
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

    if (!isOpen) form.reset(defaultValues)
  }

  const currentHouseIds = resident.property_residents.map(({ property }) => property.id)

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
          <DrawerTitle>Asignar casa</DrawerTitle>
          <DrawerDescription>{name}</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <Controller
              name="houseId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched}
                  dirty={fieldState.isDirty}
                >
                  <FieldLabel>
                    Casa <span className="text-destructive">*</span>
                  </FieldLabel>
                  <HousesPicker
                    excludeIds={currentHouseIds}
                    value={field.value || null}
                    onValueChange={(value) => {
                      field.onChange(value ?? '')
                    }}
                    inputRef={field.ref}
                    disabled={mutation.isPending}
                  />
                  <FieldDescription>
                    Las casas que ya tiene asignadas no aparecen en la lista.
                  </FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="relationship"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched}
                  dirty={fieldState.isDirty}
                >
                  <FieldLabel>
                    Relación <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    items={RELATIONSHIP_ITEMS}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                    }}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una relación" />
                    </SelectTrigger>
                    <SelectPopup>
                      {RELATIONSHIP_ITEMS.map((item) => (
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
            Asignar
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}
