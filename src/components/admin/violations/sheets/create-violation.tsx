import { zodResolver } from '@hookform/resolvers/zod'
import { IconSelector } from '@tabler/icons-react'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createViolation } from '@/api/server-functions/violations'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { RESIDENTS_QUERY_KEY } from '@/api/tanstack-queries/residents'
import { VIOLATIONS_QUERY_KEY } from '@/api/tanstack-queries/violations'
import { LoaderIcon } from '@/components/icons'
import { ResidentsSelector } from '@/components/shared/selectors/residents-selector'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { formatDate } from '@/lib/utils'
import { type CreateViolationFormData, createViolationSchema } from '@/schemas/violations'

interface CreateViolationDialogProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function CreateViolationSheet({ state }: CreateViolationDialogProps) {
  const createViolationFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<CreateViolationFormData>({
    shouldUnregister: true,
    resolver: zodResolver(createViolationSchema),
    defaultValues: {
      residentId: '',
      concept: '',
      amount: '0',
      violationDate: new Date(),
      status: 'pending',
    },
  })

  const createViolationMutation = useEntityMutation({
    mutationFn: async (data: CreateViolationFormData) => {
      return await createViolation({ data })
    },
    invalidateKeys: [VIOLATIONS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY, RESIDENTS_QUERY_KEY],
    successTitle: 'Infracción creada',
    successDescription: 'La infracción ha sido creada exitosamente.',
    errorDescription: 'Ocurrió un error al crear la infracción, intenta nuevamente.',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: CreateViolationFormData) {
    createViolationMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (createViolationMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Crear infracción</SheetTitle>
          <SheetDescription>Ingresa la información de la nueva infracción.</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={createViolationFormId}
            aria-label="Crear infracción"
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
                    disabled={createViolationMutation.isPending}
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
                          disabled={createViolationMutation.isPending}
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
              render={({ field }) => <input type="hidden" className="hidden" {...field} />}
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
                    disabled={createViolationMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </form>
        </SheetPanel>

        <SheetFooter>
          <Button type="submit" form={createViolationFormId} disabled={createViolationMutation.isPending}>
            {createViolationMutation.isPending && <LoaderIcon />}
            Crear
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
