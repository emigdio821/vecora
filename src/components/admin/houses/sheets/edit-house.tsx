import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { LoaderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { HouseWithOwner } from '@/db/schemas/zod'
import { OWNERS_QUERY_KEY } from '@/lib/ts-queries/owners'
import type { UpdateOwnerFormData } from '@/server-fns/owners'

interface EditHouseSheetProps {
  house: HouseWithOwner
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function EditHouseSheet({ house, state }: EditHouseSheetProps) {
  const editOwnerFormId = useId()
  const { isOpen, onOpenChange } = state
  const queryClient = useQueryClient()

  // const form = useForm<UpdateOwnerFormData>({
  //   resolver: zodResolver(updateOwnerSchema),
  //   values: {
  //     ownerId: owner.id,
  //     firstName: owner.firstName,
  //     lastName: owner.lastName,
  //     phone: owner.phone,
  //     email: owner.email,
  //   },
  // })

  // const updateOwnerMutation = useMutation({
  //   mutationFn: async (data: UpdateOwnerFormData) => {
  //     return await updateOwner({ data })
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: [OWNERS_QUERY_KEY] })
  //     onOpenChange(false)
  //     toast.success('Propietario actualizado exitosamente.')
  //   },
  //   onError: () => {
  //     toast.error('Ocurrió un error al actualizar el propietario, intenta nuevamente.')
  //   },
  // })

  // function onSubmit(data: UpdateOwnerFormData) {
  //   updateOwnerMutation.mutate(data)
  // }

  function handleOpenChange(open: boolean) {
    // if (updateOwnerMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar casa</SheetTitle>
          <SheetDescription>Actualiza la información de la casa.</SheetDescription>
        </SheetHeader>

        {/* <div className="flex-1">
          <form id={editOwnerFormId} onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="px-4">
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
            </FieldGroup>
          </form>
        </div> */}

        <SheetFooter>
          <SheetClose
            render={
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            }
          />
          <Button type="submit" form={editOwnerFormId}>
            Guardar cambios
            {/* {updateOwnerMutation.isPending && <LoaderIcon />} */}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
