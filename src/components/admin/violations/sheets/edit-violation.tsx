import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { LoaderIcon } from '@/components/icons'
import { DateSelector } from '@/components/shared/date-selector'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Textarea } from '@/components/ui/textarea'
import { toastManager } from '@/components/ui/toast'
import { type ViolationStatus, type ViolationWithOwner, violationStatusSchema } from '@/db/schemas/zod'
import { ownersListQueryOptions } from '@/lib/ts-queries/owners'
import { VIOLATIONS_LIST_QUERY_KEY } from '@/lib/ts-queries/violations'
import { type UpdateViolationFormData, updateViolation, updateViolationSchema } from '@/server-fns/violations'

interface EditViolationSheetProps {
  violation: ViolationWithOwner
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function EditViolationSheet({ violation, state }: EditViolationSheetProps) {
  const editViolationFormId = useId()
  const { isOpen, onOpenChange } = state
  const queryClient = useQueryClient()

  const { data: owners = [], isLoading: isLoadingOwners } = useQuery(ownersListQueryOptions())

  const form = useForm<UpdateViolationFormData>({
    resolver: zodResolver(updateViolationSchema),
    values: {
      violationId: violation.id,
      ownerId: violation.ownerId,
      concept: violation.concept,
      amount: violation.amount,
      violationDate: new Date(violation.violationDate),
      status: violation.status,
    },
  })

  const updateViolationMutation = useMutation({
    mutationFn: async (data: UpdateViolationFormData) => {
      return await updateViolation({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VIOLATIONS_LIST_QUERY_KEY] })
      onOpenChange(false)
      toastManager.add({
        type: 'success',
        title: 'Infracción actualizada',
        description: 'La infracción ha sido actualizada exitosamente.',
      })
    },
    onError: (error) => {
      console.error('Error updating violation:', error)
      toastManager.add({
        type: 'error',
        title: 'Error',
        description: 'Ocurrió un error al actualizar la infracción, intenta nuevamente.',
      })
    },
  })

  function onSubmit(data: UpdateViolationFormData) {
    updateViolationMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (updateViolationMutation.isPending) return
    onOpenChange(open)
  }

  function renderOwnerValue(value: string) {
    if (owners.length === 0) return 'No hay propietarios disponibles'

    const owner = owners.find((owner) => owner.id === value)
    return owner ? `${owner.firstName} ${owner.lastName}` : 'Selecciona una opción'
  }

  function renderStatusValue(value: ViolationStatus) {
    if (!value) return 'Selecciona una opción'

    return value === 'pending' ? 'Pendiente' : 'Pagada'
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
          <SheetTitle>Editar infracción</SheetTitle>
          <SheetDescription>Actualiza la información de la infracción.</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <Form
            id={editViolationFormId}
            aria-label="Editar infracción"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>
                    Monto <span className="text-destructive">*</span>
                  </FieldLabel>

                  <InputGroup>
                    <NumberField
                      min={1}
                      id={field.name}
                      format={{
                        currency: 'MXN',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }}
                      value={Number(field.value)}
                      disabled={updateViolationMutation.isPending}
                      onValueChange={(value) => field.onChange(value?.toString() || '')}
                    >
                      <NumberFieldInput className="text-left" />
                    </NumberField>
                    <InputGroupAddon>
                      <InputGroupText>$</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>MXN</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="ownerId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>
                    Propietario <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={owners.length === 0 || isLoadingOwners}
                  >
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue>{renderOwnerValue}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {owners.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            <span>{`${owner.firstName} ${owner.lastName}`}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="violationDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>Fecha de infracción</FieldLabel>
                  <DateSelector
                    mode="single"
                    id={field.name}
                    value={field.value}
                    selected={field.value}
                    onSelect={(date) => field.onChange(date || new Date())}
                  />
                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>Estado</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue>{renderStatusValue}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {violationStatusSchema.options.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status === 'pending' ? 'Pendiente' : 'Pagada'}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="concept"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid} touched={fieldState.isTouched} dirty={fieldState.isDirty}>
                  <FieldLabel htmlFor={field.name}>
                    Concepto <span className="text-destructive">*</span>
                  </FieldLabel>

                  <Textarea
                    id={field.name}
                    value={field.value}
                    className="max-h-40"
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                    disabled={updateViolationMutation.isPending}
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
          <Button type="submit" form={editViolationFormId} disabled={updateViolationMutation.isPending}>
            Guardar cambios
            {updateViolationMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
