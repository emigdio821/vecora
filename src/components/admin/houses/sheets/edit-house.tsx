import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updateHouse } from '@/api/server-functions/houses'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { HOUSES_QUERY_KEY } from '@/api/tanstack-queries/houses'
import { ownersListQueryOptions } from '@/api/tanstack-queries/owners'
import { LoaderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import type { HouseWithOwner } from '@/db/schemas/zod/houses'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { type UpdateHouseFormData, updateHouseSchema } from '@/schemas/houses'

interface EditHouseSheetProps {
  house: HouseWithOwner
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function EditHouseSheet({ house, state }: EditHouseSheetProps) {
  const editHouseFormId = useId()
  const { isOpen, onOpenChange } = state

  const { data: owners = [], isLoading: isLoadingOwners } = useQuery(ownersListQueryOptions())

  const form = useForm<UpdateHouseFormData>({
    resolver: zodResolver(updateHouseSchema),
    values: {
      houseId: house.id,
      houseNumber: house.houseNumber,
      street: house.street ?? '',
      city: house.city ?? '',
      state: house.state ?? '',
      zipCode: house.zipCode ?? '',
      ownerId: house.ownerId,
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

  function renderOwnerValue(value: string | null) {
    if (owners.length === 0) return 'No hay propietarios disponibles'

    const owner = owners.find((owner) => owner.id === value)
    return owner ? `${owner.firstName} ${owner.lastName}` : 'Selecciona una opción'
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
          <Form id={editHouseFormId} aria-label="Editar casa" onSubmit={form.handleSubmit(onSubmit)}>
            <Controller
              name="houseNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>
                    Número de casa <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateHouseMutation.isPending}
                  />
                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="street"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>Calle</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateHouseMutation.isPending}
                  />
                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="city"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>Ciudad</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateHouseMutation.isPending}
                  />
                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="state"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>Estado</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateHouseMutation.isPending}
                  />
                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="zipCode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>Código postal</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateHouseMutation.isPending}
                  />
                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="ownerId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>Propietario</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={owners.length === 0 || isLoadingOwners}
                  >
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue>{renderOwnerValue}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={null}>Sin selección</SelectItem>
                        {owners.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            <span>{`${owner.firstName} ${owner.lastName}`}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          </Form>
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
            Guardar cambios
            {updateHouseMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
