import { zodResolver } from '@hookform/resolvers/zod'
import { IconSelector } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { LoaderIcon } from '@/components/icons'
import { OwnersSelector } from '@/components/shared/owners-selector'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
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
import { VIOLATIONS_QUERY_KEY } from '@/lib/ts-queries/violations'
import { formatDate } from '@/lib/utils'
import { type CreateViolationFormData, createViolation, createViolationSchema } from '@/server-fns/violations'

interface CreateViolationDialogProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function CreateViolationSheet({ state }: CreateViolationDialogProps) {
  const createViolationFormId = useId()
  const { isOpen, onOpenChange } = state
  const queryClient = useQueryClient()

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

  const createViolationMutation = useMutation({
    mutationFn: async (data: CreateViolationFormData) => {
      return await createViolation({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VIOLATIONS_QUERY_KEY] })
      onOpenChange(false)
      toastManager.add({
        type: 'success',
        title: 'Infracción creada',
        description: 'La infracción ha sido creada exitosamente.',
      })
    },
    onError: (error) => {
      console.error('Error creating violation:', error)

      toastManager.add({
        type: 'error',
        title: 'Error',
        description: 'Ocurrió un error al crear la infracción, intenta nuevamente.',
      })
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
          <Form
            id={createViolationFormId}
            aria-label="Crear infracción"
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
                      id={field.name}
                      format={{
                        currency: 'MXN',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }}
                      value={Number(field.value) || null}
                      disabled={createViolationMutation.isPending}
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
                  <OwnersSelector
                    id={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={createViolationMutation.isPending}
                    invalid={fieldState.invalid}
                    includeNoneOption={false}
                  />

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
                  <FieldError match={fieldState.invalid}>{fieldState.error?.message}</FieldError>
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
                    disabled={createViolationMutation.isPending}
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
          <Button type="submit" form={createViolationFormId} disabled={createViolationMutation.isPending}>
            Crear infracción
            {createViolationMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
