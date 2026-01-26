import { zodResolver } from '@hookform/resolvers/zod'
import { IconSelector } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updateViolation } from '@/api/server-functions/violations'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { ownersListQueryOptions } from '@/api/tanstack-queries/owners'
import { VIOLATIONS_QUERY_KEY } from '@/api/tanstack-queries/violations'
import { LoaderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
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
import {
  type ViolationStatus,
  type ViolationWithOwner,
  violationStatusSchema,
} from '@/db/schemas/zod/violations'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { formatDate } from '@/lib/utils'
import { type UpdateViolationFormData, updateViolationSchema } from '@/schemas/violations'

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

  const updateViolationMutation = useEntityMutation({
    mutationFn: async (data: UpdateViolationFormData) => {
      return await updateViolation({ data })
    },
    invalidateKeys: [VIOLATIONS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Infracción actualizada',
    successDescription: 'La infracción ha sido actualizada exitosamente.',
    errorDescription: 'Ocurrió un error al actualizar la infracción, intenta nuevamente.',
    onSuccess: () => {
      onOpenChange(false)
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

  function renderStatusValue(value: ViolationStatus | undefined) {
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
          <form
            className="space-y-4"
            id={editViolationFormId}
            aria-label="Editar infracción"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
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
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="ownerId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
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

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="violationDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Fecha de infracción</FieldLabel>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          id={field.name}
                          variant="outline"
                          className="w-full justify-between data-[invalid=true]:border-destructive/36"
                        >
                          <span className="font-normal">{formatDate(field.value)}</span>
                          <IconSelector className="-me-1!" />
                        </Button>
                      }
                    />
                    <PopoverPopup className="p-0">
                      <Calendar
                        mode="single"
                        id={field.name}
                        selected={field.value}
                        onSelect={(date) => field.onChange(date || new Date())}
                      />
                    </PopoverPopup>
                  </Popover>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
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

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="concept"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
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
          <Button type="submit" form={editViolationFormId} disabled={updateViolationMutation.isPending}>
            Guardar cambios
            {updateViolationMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
