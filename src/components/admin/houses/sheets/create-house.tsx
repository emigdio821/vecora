import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createHouse } from '@/api/server-functions/houses'
import { HOUSES_QUERY_KEY } from '@/api/tanstack-queries/houses'
import { LoaderIcon } from '@/components/icons'
import { OwnersSelector } from '@/components/shared/owners-selector'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
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
import { type CreateHouseFormData, createHouseSchema } from '@/schemas/houses'

interface CreateHouseDialogProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function CreateHouseSheet({ state }: CreateHouseDialogProps) {
  const createHouseFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<CreateHouseFormData>({
    shouldUnregister: true,
    resolver: zodResolver(createHouseSchema),
    defaultValues: {
      houseNumber: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      ownerId: null,
    },
  })

  const createHouseMutation = useEntityMutation({
    mutationFn: async (data: CreateHouseFormData) => {
      return await createHouse({ data })
    },
    invalidateKeys: [HOUSES_QUERY_KEY],
    successTitle: 'Casa creada',
    successDescription: 'La casa ha sido creada exitosamente.',
    errorDescription: 'Ocurrió un error al crear la casa, intenta nuevamente.',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: CreateHouseFormData) {
    createHouseMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (createHouseMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Crear casa</SheetTitle>
          <SheetDescription>Ingresa la información de la nueva casa.</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <Form id={createHouseFormId} aria-label="Crear casa" onSubmit={form.handleSubmit(onSubmit)}>
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
                    disabled={createHouseMutation.isPending}
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
                    disabled={createHouseMutation.isPending}
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
                    disabled={createHouseMutation.isPending}
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
                    disabled={createHouseMutation.isPending}
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
                    disabled={createHouseMutation.isPending}
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
                  <OwnersSelector
                    id={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={createHouseMutation.isPending}
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
          <Button type="submit" form={createHouseFormId} disabled={createHouseMutation.isPending}>
            Crear casa
            {createHouseMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
