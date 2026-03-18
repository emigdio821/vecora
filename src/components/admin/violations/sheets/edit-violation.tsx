import { zodResolver } from '@hookform/resolvers/zod'
import { IconSelector } from '@tabler/icons-react'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updateViolation, type ViolationQueryData } from '@/api/server-functions/violations'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { VIOLATIONS_QUERY_KEY } from '@/api/tanstack-queries/violations'
import { LoaderIcon } from '@/components/icons'
import { ResidentsSelector } from '@/components/shared/selectors/residents-selector'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { type ViolationStatus, violationStatusSchema } from '@/db/schema/zod/violations'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { formatDate } from '@/lib/utils'
import { type UpdateViolationFormData, updateViolationSchema } from '@/schemas/violations'

interface EditViolationSheetProps {
  violation: ViolationQueryData
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function EditViolationSheet({ violation, state }: EditViolationSheetProps) {
  const editViolationFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<UpdateViolationFormData>({
    resolver: zodResolver(updateViolationSchema),
    values: {
      violationId: violation.id,
      residentId: violation.residentId,
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
    successDescription: 'La infracción ha sido actualizada exitosamente',
    errorDescription: 'Ocurrió un error al actualizar la infracción, intenta nuevamente',
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
          <SheetDescription>Actualiza la información de la infracción</SheetDescription>
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
                    <InputGroupInput aria-invalid={fieldState.invalid} type="number" {...field} />
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
              name="residentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Residente <span className="text-destructive">*</span>
                  </FieldLabel>

                  <ResidentsSelector
                    id={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={updateViolationMutation.isPending}
                    invalid={fieldState.invalid}
                    includeNoneOption={false}
                  />

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
                          aria-invalid={fieldState.invalid}
                          disabled={updateViolationMutation.isPending}
                          className="w-full justify-between pr-2"
                        >
                          <span className="font-normal">{formatDate(field.value)}</span>
                          <IconSelector className="pointer-events-none size-4 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <PopoverContent className="w-auto p-1">
                      <Calendar
                        mode="single"
                        id={field.name}
                        selected={field.value}
                        defaultMonth={field.value}
                        onSelect={(date) => field.onChange(date || new Date())}
                      />
                    </PopoverContent>
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
                  <FieldLabel htmlFor={field.name}>Estatus</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue>{renderStatusValue}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Estatus</SelectLabel>
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
          <Button type="submit" form={editViolationFormId} disabled={updateViolationMutation.isPending}>
            {updateViolationMutation.isPending && <LoaderIcon />}
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
