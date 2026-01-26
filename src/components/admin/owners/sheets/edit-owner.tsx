import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updateOwner } from '@/api/server-functions/owners'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { AVAILABLE_HOUSES_QUERY_KEY, HOUSES_QUERY_KEY } from '@/api/tanstack-queries/houses'
import { OWNERS_QUERY_KEY } from '@/api/tanstack-queries/owners'
import { LoaderIcon } from '@/components/icons'
import { AvailableHousesSelector } from '@/components/shared/available-houses-selector'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
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
import type { OwnerWithRelations } from '@/db/schemas/zod/owners'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { type UpdateOwnerFormData, updateOwnerSchema } from '@/schemas/owners'

interface EditOwnerSheetProps {
  owner: OwnerWithRelations
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function EditOwnerSheet({ owner, state }: EditOwnerSheetProps) {
  const editOwnerFormId = useId()
  const { isOpen, onOpenChange } = state
  const queryClient = useQueryClient()

  const form = useForm<UpdateOwnerFormData>({
    resolver: zodResolver(updateOwnerSchema),
    values: {
      ownerId: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      phone: owner.phone,
      email: owner.email,
      houseIds: owner.houses.map((house) => house.id),
    },
  })

  const updateOwnerMutation = useEntityMutation({
    mutationFn: async (data: UpdateOwnerFormData) => {
      return await updateOwner({ data })
    },
    invalidateKeys: [OWNERS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Propietario actualizado',
    successDescription: 'El propietario ha sido actualizado exitosamente.',
    errorDescription: 'Ocurrió un error al actualizar el propietario, intenta nuevamente.',
    onSuccess: () => {
      const houseIds = form.getValues('houseIds')
      if (houseIds.length > 0) {
        queryClient.invalidateQueries({ queryKey: [AVAILABLE_HOUSES_QUERY_KEY] })
        queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
      }
      onOpenChange(false)
    },
  })

  function onSubmit(data: UpdateOwnerFormData) {
    updateOwnerMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (updateOwnerMutation.isPending) return
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
          <SheetTitle>Editar propietario</SheetTitle>
          <SheetDescription>Actualiza la información del propietario.</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={editOwnerFormId}
            aria-label="Editar propietario"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Nombre <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateOwnerMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Apellido <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateOwnerMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Teléfono <span className="text-destructive">*</span>
                  </FieldLabel>
                  <PhoneInput
                    id={field.name}
                    value={field.value}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                    disabled={updateOwnerMutation.isPending}
                    onChange={(value) => {
                      field.onChange(value || '')
                    }}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Correo <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    type="email"
                    id={field.name}
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                    disabled={updateOwnerMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="houseIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Casas</FieldLabel>
                  <AvailableHousesSelector
                    id={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={updateOwnerMutation.isPending}
                    invalid={fieldState.invalid}
                    includeAssigned={owner.houses}
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
          <Button type="submit" form={editOwnerFormId} disabled={updateOwnerMutation.isPending}>
            Guardar cambios
            {updateOwnerMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
