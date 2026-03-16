import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updateHouse } from '@/api/server-functions/houses'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { HOUSES_QUERY_KEY, type HouseQueryData } from '@/api/tanstack-queries/houses'
import { LoaderIcon } from '@/components/icons'
import { ResidentsSelector } from '@/components/shared/selectors/residents-selector'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { type UpdateHouseFormData, updateHouseSchema } from '@/schemas/houses'

interface EditHouseSheetProps {
  house: HouseQueryData
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function EditHouseSheet({ house, state }: EditHouseSheetProps) {
  const editHouseFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<UpdateHouseFormData>({
    resolver: zodResolver(updateHouseSchema),
    values: {
      houseId: house.id,
      houseNumber: house.houseNumber,
      street: house.street ?? '',
      city: house.city ?? '',
      state: house.state ?? '',
      zipCode: house.zipCode ?? '',
      residentId: house.residentId,
    },
  })

  const updateHouseMutation = useEntityMutation({
    mutationFn: async (data: UpdateHouseFormData) => {
      return await updateHouse({ data })
    },
    invalidateKeys: [HOUSES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Casa actualizada',
    successDescription: 'La casa ha sido actualizada exitosamente.',
    errorDescription: 'Ocurrió un error al actualizar la casa, intenta nuevamente.',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: UpdateHouseFormData) {
    updateHouseMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (updateHouseMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) form.reset()
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Editar casa</SheetTitle>
          <SheetDescription>Actualiza la información de la casa.</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={editHouseFormId}
            aria-label="Editar casa"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="houseNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Número de casa <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateHouseMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="street"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Calle</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateHouseMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="city"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Ciudad</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateHouseMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="state"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Estado</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateHouseMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="zipCode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Código postal</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateHouseMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="residentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Propietario</FieldLabel>

                  <ResidentsSelector
                    id={field.name}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                    }}
                    ownersOnly
                    disabled={updateHouseMutation.isPending}
                    invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </form>
        </SheetPanel>

        <SheetFooter>
          <SheetClose
            render={
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            }
          />
          <Button type="submit" form={editHouseFormId} disabled={updateHouseMutation.isPending}>
            {updateHouseMutation.isPending && <LoaderIcon />}
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
