import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createExternalUser } from '@/api/server-functions/external-users'
import { EXTERNAL_USERS_QUERY_KEY } from '@/api/tanstack-queries/external-users'
import { LoaderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { type CreateExternalUserFormData, createExternalUserSchema } from '@/schemas/external-users'

interface CreateExternalUserSheetProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function CreateExternalUserSheet({ state }: CreateExternalUserSheetProps) {
  const createExternalUserFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<CreateExternalUserFormData>({
    shouldUnregister: true,
    resolver: zodResolver(createExternalUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      notes: '',
    },
  })

  const createExternalUserMutation = useEntityMutation({
    mutationFn: async (data: CreateExternalUserFormData) => {
      return await createExternalUser({ data })
    },
    invalidateKeys: [EXTERNAL_USERS_QUERY_KEY],
    successTitle: 'Usuario externo creado',
    successDescription: 'El usuario externo ha sido creado exitosamente.',
    errorDescription: 'Ocurrió un error al crear el usuario externo, intenta nuevamente.',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: CreateExternalUserFormData) {
    createExternalUserMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (createExternalUserMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetPopup side="right">
        <SheetHeader>
          <SheetTitle>Crear usuario externo</SheetTitle>
          <SheetDescription>Ingresa la información del nuevo usuario externo.</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <Form
            id={createExternalUserFormId}
            aria-label="Crear usuario externo"
            onSubmit={form.handleSubmit(onSubmit)}
          >
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
                    disabled={createExternalUserMutation.isPending}
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
                    disabled={createExternalUserMutation.isPending}
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
                    disabled={createExternalUserMutation.isPending}
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
                    disabled={createExternalUserMutation.isPending}
                  />
                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>Notas</FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.value}
                    className="max-h-40"
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                    disabled={createExternalUserMutation.isPending}
                    placeholder="Breve descripción del porqué se agrega el usuario externo (opcional)"
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
          <Button
            type="submit"
            form={createExternalUserFormId}
            disabled={createExternalUserMutation.isPending}
          >
            Crear usuario externo
            {createExternalUserMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  )
}
