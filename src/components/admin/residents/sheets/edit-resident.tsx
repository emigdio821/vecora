import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updateResident } from '@/api/server-functions/residents'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { RESIDENTS_QUERY_KEY, type ResidentQueryData } from '@/api/tanstack-queries/residents'
import { LoaderIcon } from '@/components/icons'
import { AvailableHousesSelector } from '@/components/shared/selectors/available-houses-selector'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { type UpdateResidentFormData, updateResidentSchema } from '@/schemas/residents'

interface EditResidentSheetProps {
  resident: ResidentQueryData
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function EditResidentSheet({ resident, state }: EditResidentSheetProps) {
  const editResidentFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<UpdateResidentFormData>({
    resolver: zodResolver(updateResidentSchema),
    values: {
      residentId: resident.id,
      firstName: resident.firstName,
      lastName: resident.lastName,
      phone: resident.phone,
      email: resident.email,
      isOwner: resident.isOwner,
      notes: resident.notes ?? '',
      houseIds: resident.houses.map((house) => house.id),
    },
  })

  const isOwner = form.watch('isOwner')

  const updateResidentMutation = useEntityMutation({
    mutationFn: async (data: UpdateResidentFormData) => {
      return await updateResident({ data })
    },
    invalidateKeys: [RESIDENTS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Residente actualizado',
    successDescription: 'El residente ha sido actualizado exitosamente.',
    errorDescription: 'Ocurrió un error al actualizar el residente, intenta nuevamente.',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: UpdateResidentFormData) {
    updateResidentMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (updateResidentMutation.isPending) return
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
          <SheetTitle>Editar residente</SheetTitle>
          <SheetDescription>Actualiza la información del residente.</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={editResidentFormId}
            aria-label="Editar residente"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="isOwner"
              control={form.control}
              render={({ field }) => (
                <Field className="flex flex-row items-center gap-2">
                  <Checkbox
                    id={field.name}
                    checked={field.value}
                    disabled={updateResidentMutation.isPending}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor={field.name}>¿Es propietario?</FieldLabel>
                </Field>
              )}
            />

            {isOwner && (
              <Controller
                name="houseIds"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Casas</FieldLabel>
                    <AvailableHousesSelector
                      id={field.name}
                      value={field.value}
                      invalid={fieldState.invalid}
                      disabled={updateResidentMutation.isPending}
                      onValueChange={field.onChange}
                      includeAssigned={resident.houses}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}

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
                    disabled={updateResidentMutation.isPending}
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
                    disabled={updateResidentMutation.isPending}
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
                    Correo electrónico <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    type="email"
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateResidentMutation.isPending}
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
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateResidentMutation.isPending}
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Notas</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateResidentMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </form>
        </SheetPanel>

        <SheetFooter>
          <Button type="submit" form={editResidentFormId} disabled={updateResidentMutation.isPending}>
            {updateResidentMutation.isPending && <LoaderIcon />}
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
