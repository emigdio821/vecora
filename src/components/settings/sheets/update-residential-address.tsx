import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updateResidentialAddress } from '@/api/server-functions/residential-address'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { RESIDENTIAL_ADDRESS_QUERY_KEY } from '@/api/tanstack-queries/residential-address'
import { LoaderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import type { SelectResidentialAddress } from '@/db/schema/zod/residential-address'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import {
  type UpdateResidentialAddressFormData,
  updateResidentialAddressSchema,
} from '@/schemas/residential-address'

interface UpdateResidentialAddressSheetProps extends React.ComponentProps<typeof Sheet> {
  address?: SelectResidentialAddress | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateResidentialAddressSheet({
  address,
  open,
  onOpenChange,
  ...props
}: UpdateResidentialAddressSheetProps) {
  const updateResidentialAddressFormId = useId()

  const form = useForm<UpdateResidentialAddressFormData>({
    resolver: zodResolver(updateResidentialAddressSchema),
    values: {
      addressId: address?.id,
      city: address?.city ?? '',
      country: address?.country ?? '',
      name: address?.name ?? '',
      state: address?.state ?? '',
      street: address?.street ?? '',
      zipCode: address?.zipCode ?? '',
    },
  })

  const updateResidentialAddressMutation = useEntityMutation({
    mutationFn: async (data: UpdateResidentialAddressFormData) => {
      return await updateResidentialAddress({ data })
    },
    invalidateKeys: [RESIDENTIAL_ADDRESS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Dirección actualizada',
    successDescription: 'La dirección residencial ha sido actualizada exitosamente',
    errorDescription: 'Ocurrió un error al actualizar la casa, intenta nuevamente',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: UpdateResidentialAddressFormData) {
    updateResidentialAddressMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (updateResidentialAddressMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) form.reset()
      }}
      {...props}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Actualizar dirección</SheetTitle>
          <SheetDescription>Actualiza la dirección del residencial</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={updateResidentialAddressFormId}
            aria-label="Editar dirección residencial"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Nombre del residencial <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateResidentialAddressMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="country"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    País <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateResidentialAddressMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="state"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Estado <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateResidentialAddressMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="city"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Ciudad <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateResidentialAddressMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="street"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Calle <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateResidentialAddressMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="zipCode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Código postal <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateResidentialAddressMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </form>
        </SheetPanel>

        <SheetFooter>
          <Button
            type="submit"
            form={updateResidentialAddressFormId}
            disabled={updateResidentialAddressMutation.isPending}
          >
            {updateResidentialAddressMutation.isPending && <LoaderIcon />}
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
