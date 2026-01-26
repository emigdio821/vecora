import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createOwner } from '@/api/server-functions/owners'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { AVAILABLE_HOUSES_QUERY_KEY, HOUSES_QUERY_KEY } from '@/api/tanstack-queries/houses'
import { OWNERS_QUERY_KEY } from '@/api/tanstack-queries/owners'
import { LoaderIcon } from '@/components/icons'
import { AvailableHousesSelector } from '@/components/shared/available-houses-selector'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
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
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { type CreateOwnerFormData, createOwnerSchema } from '@/schemas/owners'

interface CreateOwnerDialogProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function CreateOwnerSheet({ state }: CreateOwnerDialogProps) {
  const createOwnerFormId = useId()
  const { isOpen, onOpenChange } = state
  const queryClient = useQueryClient()

  const form = useForm<CreateOwnerFormData>({
    shouldUnregister: true,
    resolver: zodResolver(createOwnerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      houseIds: [],
    },
  })

  const createOwnerMutation = useEntityMutation({
    mutationFn: async (data: CreateOwnerFormData) => {
      return await createOwner({ data })
    },
    invalidateKeys: [OWNERS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Propietario creado',
    successDescription: 'El propietario ha sido creado exitosamente.',
    errorDescription: 'Ocurrió un error al crear el propietario, intenta nuevamente.',
    onSuccess: () => {
      const houseIds = form.getValues('houseIds')
      if (houseIds.length > 0) {
        queryClient.invalidateQueries({ queryKey: [AVAILABLE_HOUSES_QUERY_KEY] })
        queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
      }
      onOpenChange(false)
    },
  })

  function onSubmit(data: CreateOwnerFormData) {
    createOwnerMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (createOwnerMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Crear propietario</SheetTitle>
          <SheetDescription>Ingresa la información del nuevo propietario.</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <Form id={createOwnerFormId} aria-label="Crear propietario" onSubmit={form.handleSubmit(onSubmit)}>
            <Controller
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>
                    Nombre <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={createOwnerMutation.isPending}
                  />
                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>
                    Apellido <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={createOwnerMutation.isPending}
                  />
                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>
                    Teléfono <span className="text-destructive">*</span>
                  </FieldLabel>
                  <PhoneInput
                    id={field.name}
                    onBlur={field.onBlur}
                    disabled={createOwnerMutation.isPending}
                    onChange={(value) => {
                      field.onChange(value || '')
                    }}
                  />
                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>
                    Correo <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    type="email"
                    id={field.name}
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                    disabled={createOwnerMutation.isPending}
                  />
                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="houseIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>Casas</FieldLabel>
                  <AvailableHousesSelector
                    id={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={createOwnerMutation.isPending}
                    invalid={fieldState.invalid}
                  />
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
          <Button type="submit" form={createOwnerFormId} disabled={createOwnerMutation.isPending}>
            Crear propietario
            {createOwnerMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
