import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createResident } from '@/api/server-functions/residents'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { RESIDENTS_QUERY_KEY } from '@/api/tanstack-queries/residents'
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
import { type CreateResidentFormData, createResidentSchema } from '@/schemas/residents'

interface CreateResidentSheetProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function CreateResidentSheet({ state }: CreateResidentSheetProps) {
  const createResidentFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<CreateResidentFormData>({
    shouldUnregister: true,
    resolver: zodResolver(createResidentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      isOwner: false,
      notes: '',
      houseIds: [],
    },
  })

  const isOwner = form.watch('isOwner')

  const createResidentMutation = useEntityMutation({
    mutationFn: async (data: CreateResidentFormData) => {
      return await createResident({ data })
    },
    invalidateKeys: [RESIDENTS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Residente creado',
    successDescription: 'El residente ha sido creado exitosamente',
    errorDescription: 'Ocurrió un error al crear el residente, intenta nuevamente',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: CreateResidentFormData) {
    createResidentMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (createResidentMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Crear residente</SheetTitle>
          <SheetDescription>Ingresa la información del nuevo residente</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={createResidentFormId}
            aria-label="Crear residente"
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
                    disabled={createResidentMutation.isPending}
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
                      disabled={createResidentMutation.isPending}
                      onValueChange={field.onChange}
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
                    disabled={createResidentMutation.isPending}
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
                    disabled={createResidentMutation.isPending}
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
                    disabled={createResidentMutation.isPending}
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
                    disabled={createResidentMutation.isPending}
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
                    disabled={createResidentMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </form>
        </SheetPanel>

        <SheetFooter>
          <Button type="submit" form={createResidentFormId} disabled={createResidentMutation.isPending}>
            {createResidentMutation.isPending && <LoaderIcon />}
            Crear
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
