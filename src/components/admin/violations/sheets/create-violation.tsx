import { zodResolver } from '@hookform/resolvers/zod'
import { IconSelector } from '@tabler/icons-react'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createViolation } from '@/api/server-functions/violations'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { VIOLATIONS_QUERY_KEY } from '@/api/tanstack-queries/violations'
import { LoaderIcon } from '@/components/icons'
import { OwnersSelector } from '@/components/shared/owners-selector'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
      ownerId: '',
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
    invalidateKeys: [VIOLATIONS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
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
              name="ownerId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Propietario <span className="text-destructive">*</span>
                  </FieldLabel>
                  <OwnersSelector
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
                          className="w-full justify-between pr-2 data-[invalid=true]:border-destructive/36"
                        >
                          <span className="font-normal">{formatDate(field.value)}</span>
                          <IconSelector className="pointer-events-none size-4 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <PopoverContent className="p-0">
                      <Calendar
                        mode="single"
                        id={field.name}
                        selected={field.value}
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
          <SheetClose
            render={
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            }
          />
          <Button type="submit" form={createViolationFormId} disabled={createViolationMutation.isPending}>
            Crear infracción
            {createViolationMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
