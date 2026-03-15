import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updateExternalUser } from '@/api/server-functions/external-users'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { EXTERNAL_USERS_QUERY_KEY } from '@/api/tanstack-queries/external-users'
import { LoaderIcon } from '@/components/icons'
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
import type { SelectExternalUser } from '@/db/schema/zod/external-users'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { type UpdateExternalUserFormData, updateExternalUserSchema } from '@/schemas/external-users'

interface EditExternalUserSheetProps {
  externalUser: SelectExternalUser
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function EditExternalUserSheet({ externalUser, state }: EditExternalUserSheetProps) {
  const editExternalUserFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<UpdateExternalUserFormData>({
    resolver: zodResolver(updateExternalUserSchema),
    values: {
      externalUserId: externalUser.id,
      firstName: externalUser.firstName,
      lastName: externalUser.lastName,
      phone: externalUser.phone,
      email: externalUser.email,
    },
  })

  const updateExternalUserMutation = useEntityMutation({
    mutationFn: async (data: UpdateExternalUserFormData) => {
      return await updateExternalUser({ data })
    },
    invalidateKeys: [EXTERNAL_USERS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Usuario externo actualizado',
    successDescription: 'El usuario externo ha sido actualizado exitosamente.',
    errorDescription: 'Ocurrió un error al actualizar el usuario externo, intenta nuevamente.',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: UpdateExternalUserFormData) {
    updateExternalUserMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (updateExternalUserMutation.isPending) return
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
          <SheetTitle>Editar usuario externo</SheetTitle>
          <SheetDescription>Actualiza la información del usuario externo.</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={editExternalUserFormId}
            aria-label="Editar usuario externo"
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
                    disabled={updateExternalUserMutation.isPending}
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
                    disabled={updateExternalUserMutation.isPending}
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
                    disabled={updateExternalUserMutation.isPending}
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
                    disabled={updateExternalUserMutation.isPending}
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
          <Button type="submit" form={editExternalUserFormId} disabled={updateExternalUserMutation.isPending}>
            {updateExternalUserMutation.isPending && <LoaderIcon />}
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
