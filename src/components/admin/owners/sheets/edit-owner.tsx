import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { LoaderIcon } from '@/components/icons'
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
import { toastManager } from '@/components/ui/toast'
import type { OwnerWithRelations } from '@/db/schemas/zod/owners'
import { OWNERS_QUERY_KEY } from '@/lib/ts-queries/owners'
import { type UpdateOwnerFormData, updateOwnerSchema } from '@/schemas/owners'
import { updateOwner } from '@/server-fns/owners'

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
    },
  })

  const updateOwnerMutation = useMutation({
    mutationFn: async (data: UpdateOwnerFormData) => {
      return await updateOwner({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OWNERS_QUERY_KEY] })
      onOpenChange(false)
      toastManager.add({
        type: 'success',
        title: 'Propietario actualizado',
        description: 'El propietario ha sido actualizado exitosamente.',
      })
    },
    onError: (error) => {
      console.error('Error updating owner:', error)

      toastManager.add({
        type: 'error',
        title: 'Error',
        description: 'Ocurrió un error al actualizar el propietario, intenta nuevamente.',
      })
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
          <Form id={editOwnerFormId} aria-label="Editar propietario" onSubmit={form.handleSubmit(onSubmit)}>
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
                    disabled={updateOwnerMutation.isPending}
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
                    disabled={updateOwnerMutation.isPending}
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
                    value={field.value}
                    onBlur={field.onBlur}
                    disabled={updateOwnerMutation.isPending}
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
                    disabled={updateOwnerMutation.isPending}
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
          <Button type="submit" form={editOwnerFormId} disabled={updateOwnerMutation.isPending}>
            Guardar cambios
            {updateOwnerMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
